// backend/controllers/featuredController.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// ✅ تابع کمکی اصلی (اصلاح‌شده)
// منطق: 
//   ۱. اگر variation_id مشخصی درخواست شده بود، همون رو برگردون
//   ۲. در غیر این صورت، اولویت به ترکیب‌های تخفیف‌دار (ارزان‌ترین بین اونها)
//   ۳. اگر هیچ ترکیبی تخفیف نداشت، ارزان‌ترین ترکیب کلی
// ============================================================
const getCheapestDiscountedVariation = (productId, featuredDiscounts, variations, preferVariationId = null) => {
  if (!variations || variations.length === 0) return null;

  const productDiscounts = featuredDiscounts.filter(f => f.product_id === productId && f.type === 'discount');
  if (productDiscounts.length === 0) return null;

  const discountMap = {};
  let globalDiscount = null;
  productDiscounts.forEach(d => {
    if (d.variation_id === null) globalDiscount = d;
    else discountMap[d.variation_id] = d;
  });

  const variationsWithPrice = variations.map(v => {
    const originalPrice = parseFloat(v.price) || 0;
    let finalPrice = originalPrice;
    let discountApplied = false;
    let discountPercent = 0;
    let discountId = null;

    // اولویت اول: تخفیف مخصوص همین ترکیب
    const variationDiscount = discountMap[v.id];
    if (variationDiscount) {
      const percent = variationDiscount.discount_percent || 0;
      const endTime = variationDiscount.end_time;
      const isValid = percent > 0 && (!endTime || endTime > Date.now());
      if (isValid && originalPrice > 0) {
        discountPercent = percent;
        discountApplied = true;
        discountId = variationDiscount.id;
        finalPrice = Math.round(originalPrice * (1 - percent / 100));
      }
    }

    // اولویت دوم: تخفیف عمومی (روی کل محصول)
    if (!discountApplied && globalDiscount) {
      const percent = globalDiscount.discount_percent || 0;
      const endTime = globalDiscount.end_time;
      const isValid = percent > 0 && (!endTime || endTime > Date.now());
      if (isValid && originalPrice > 0) {
        discountPercent = percent;
        discountApplied = true;
        discountId = globalDiscount.id;
        finalPrice = Math.round(originalPrice * (1 - percent / 100));
      }
    }

    return {
      ...v,
      original_price: originalPrice,
      final_price: finalPrice,
      discount_applied: discountApplied,
      discount_percent: discountApplied ? discountPercent : 0,
      discount_id: discountId,
    };
  });

  // ✅ اول: اگر یک ترکیب خاص درخواست شده، همون رو برگردون
  if (preferVariationId) {
    const preferred = variationsWithPrice.find(v => v.id === preferVariationId);
    if (preferred) return preferred;
  }

  // ✅ دوم: ترکیب‌های تخفیف‌دار رو ترجیح بده (ارزان‌ترین بین اونها)
  const discountedVariations = variationsWithPrice.filter(v => v.discount_applied);
  if (discountedVariations.length > 0) {
    discountedVariations.sort((a, b) => a.final_price - b.final_price);
    return discountedVariations[0];
  }

  // ✅ سوم: اگر هیچ ترکیبی تخفیف نداشت، ارزان‌ترین کلی
  variationsWithPrice.sort((a, b) => a.final_price - b.final_price);
  return variationsWithPrice[0];
};

// ===== دریافت محصولات ویژه (عمومی) =====
const getPublicFeaturedProducts = async (req, res, next) => {
  try {
    const [featuredRows] = await pool.query(`
      SELECT 
        f.id as featured_id,
        f.type,
        f.discount_percent,
        f.original_price,
        f.end_time,
        f.order_index,
        f.product_id,
        f.variation_id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock,
        p.brand,
        p.model,
        p.weight,
        p.dimensions,
        p.custom_attributes,
        p.slug,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND deleted_at IS NULL AND is_approved = 1) as averageRating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND deleted_at IS NULL AND is_approved = 1) as totalReviews
      FROM featured_products f
      JOIN products p ON f.product_id = p.id
      WHERE f.deleted_at IS NULL
        AND f.type = 'discount'
        AND p.deleted_at IS NULL
        AND (f.end_time IS NULL OR f.end_time > UNIX_TIMESTAMP(NOW()) * 1000)
      ORDER BY f.order_index ASC, f.id DESC
    `);

    if (featuredRows.length === 0) return res.json({ success: true, data: [] });

    const productIds = featuredRows.map(f => f.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    const [variations] = await pool.query(`
      SELECT pv.*, cv.value as color_name, cv.color_code, sv.value as size_name
      FROM product_variations pv
      LEFT JOIN attribute_values cv ON pv.color_value_id = cv.id
      LEFT JOIN attribute_values sv ON pv.size_value_id = sv.id
      WHERE pv.product_id IN (${placeholders})
      ORDER BY pv.price ASC
    `, productIds);

    const variationsByProduct = {};
    variations.forEach(v => {
      if (!variationsByProduct[v.product_id]) variationsByProduct[v.product_id] = [];
      variationsByProduct[v.product_id].push(v);
    });

    const result = featuredRows.map(featured => {
      const productVariations = variationsByProduct[featured.product_id] || [];
      // ✅ پاس دادن featured.variation_id به عنوان preferVariationId
      const cheapest = getCheapestDiscountedVariation(
        featured.product_id,
        featuredRows,
        productVariations,
        featured.variation_id
      );

      let displayPrice = 0, originalPrice = 0, discountPercent = featured.discount_percent || 0;
      if (cheapest) {
        originalPrice = cheapest.original_price;
        displayPrice = cheapest.final_price;
        discountPercent = cheapest.discount_percent || discountPercent;
      } else {
        originalPrice = parseFloat(featured.price) || 0;
        displayPrice = Math.round(originalPrice * (1 - (discountPercent / 100)));
      }

      return {
        ...featured,
        display_price: displayPrice,
        original_price_display: originalPrice,
        discount_percent: discountPercent,
        cheapest_variation: cheapest ? {
          id: cheapest.id,
          price: cheapest.price,
          stock: cheapest.stock,
          final_price: cheapest.final_price,
          original_price: cheapest.original_price,
          color_name: cheapest.color_name,
          color_code: cheapest.color_code,
          size_name: cheapest.size_name,
          attribute_values_json: cheapest.attribute_values_json,
          discount_id: cheapest.discount_id,
          discount_percent: cheapest.discount_percent,
        } : null,
        total_stock: productVariations.reduce((sum, v) => sum + (v.stock || 0), 0),
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [getPublicFeaturedProducts] خطا:', error);
    next(error);
  }
};

// ===== دریافت محصولات ویژه (ادمین) =====
const getFeaturedProducts = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.id as featured_id,
        f.type,
        f.discount_percent,
        f.original_price,
        f.end_time,
        f.order_index,
        f.created_at,
        f.updated_at,
        f.product_id,
        f.variation_id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.stock,
        p.brand,
        p.model,
        p.weight,
        p.dimensions,
        p.custom_attributes,
        p.slug,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND deleted_at IS NULL AND is_approved = 1) as averageRating,
        (SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND deleted_at IS NULL AND is_approved = 1) as totalReviews
      FROM featured_products f
      JOIN products p ON f.product_id = p.id
      WHERE f.deleted_at IS NULL
      ORDER BY f.type, f.order_index ASC, f.id DESC
    `);

    const discountItems = rows.filter(f => f.type === 'discount');
    if (discountItems.length > 0) {
      const productIds = discountItems.map(f => f.product_id);
      const placeholders = productIds.map(() => '?').join(',');
      const [variations] = await pool.query(`
        SELECT pv.*, cv.value as color_name, cv.color_code, sv.value as size_name
        FROM product_variations pv
        LEFT JOIN attribute_values cv ON pv.color_value_id = cv.id
        LEFT JOIN attribute_values sv ON pv.size_value_id = sv.id
        WHERE pv.product_id IN (${placeholders})
        ORDER BY pv.price ASC
      `, productIds);

      const variationsByProduct = {};
      variations.forEach(v => {
        if (!variationsByProduct[v.product_id]) variationsByProduct[v.product_id] = [];
        variationsByProduct[v.product_id].push(v);
      });

      const result = rows.map(featured => {
        if (featured.type !== 'discount') return featured;

        const productVariations = variationsByProduct[featured.product_id] || [];
        // ✅ پاس دادن featured.variation_id به عنوان preferVariationId
        const cheapest = getCheapestDiscountedVariation(
          featured.product_id,
          rows,
          productVariations,
          featured.variation_id
        );

        let displayPrice = 0, originalPrice = 0, discountPercent = featured.discount_percent || 0;
        if (cheapest) {
          originalPrice = cheapest.original_price;
          displayPrice = cheapest.final_price;
          discountPercent = cheapest.discount_percent || discountPercent;
        } else {
          originalPrice = parseFloat(featured.price) || 0;
          displayPrice = Math.round(originalPrice * (1 - (discountPercent / 100)));
        }

        return {
          ...featured,
          display_price: displayPrice,
          original_price_display: originalPrice,
          discount_percent: discountPercent,
          cheapest_variation: cheapest ? {
            id: cheapest.id,
            price: cheapest.price,
            stock: cheapest.stock,
            final_price: cheapest.final_price,
            original_price: cheapest.original_price,
            color_name: cheapest.color_name,
            color_code: cheapest.color_code,
            size_name: cheapest.size_name,
            attribute_values_json: cheapest.attribute_values_json,
            discount_id: cheapest.discount_id,
            discount_percent: cheapest.discount_percent,
          } : null,
          total_stock: productVariations.reduce((sum, v) => sum + (v.stock || 0), 0),
        };
      });
      res.json({ success: true, data: result });
    } else {
      res.json({ success: true, data: rows });
    }
  } catch (error) {
    console.error('❌ [getFeaturedProducts] خطا:', error);
    next(error);
  }
};

// ===== افزودن محصول ویژه =====
const addFeatured = async (req, res, next) => {
  try {
    const { product_id, variation_id, type, discount_percent, original_price, end_time, order_index } = req.body;
    if (!product_id || !type) throw new AppError('شناسه محصول و نوع ویژه الزامی است', 400);
    const [product] = await pool.query('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [product_id]);
    if (product.length === 0) throw new AppError('محصول یافت نشد', 404);
    if (variation_id) {
      const [variation] = await pool.query('SELECT id FROM product_variations WHERE id = ? AND product_id = ?', [variation_id, product_id]);
      if (variation.length === 0) throw new AppError('ترکیب یافت نشد', 404);
    }
    let endTimeValue = null;
    if (end_time !== undefined && end_time !== null && end_time !== '') {
      const num = Number(end_time);
      if (!isNaN(num) && num > 0) endTimeValue = num;
    }
    const query = `
      INSERT INTO featured_products (product_id, variation_id, type, discount_percent, original_price, end_time, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        discount_percent = VALUES(discount_percent),
        original_price = VALUES(original_price),
        end_time = VALUES(end_time),
        order_index = VALUES(order_index),
        deleted_at = NULL,
        updated_at = NOW()
    `;
    const [result] = await pool.query(query, [
      product_id, variation_id || null, type, discount_percent || 0, original_price || null, endTimeValue, order_index || 0
    ]);
    const isUpdate = result.affectedRows === 2;
    const message = isUpdate ? 'تخفیف با موفقیت به‌روزرسانی شد' : 'محصول با موفقیت به ویژه اضافه شد';
    let insertedId = result.insertId;
    if (!insertedId) {
      const [rows] = await pool.query(
        `SELECT id FROM featured_products WHERE product_id = ? AND type = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))`,
        [product_id, type, variation_id || null, variation_id]
      );
      if (rows.length > 0) insertedId = rows[0].id;
    }
    logger.info(`⭐ محصول ${product_id} (ترکیب: ${variation_id || 'همه'}) - ${message} (ID: ${insertedId || 'unknown'})`);
    return res.status(201).json({
      success: true,
      message,
      data: {
        id: insertedId || null,
        product_id,
        variation_id: variation_id || null,
        type,
        discount_percent: discount_percent || 0,
        original_price: original_price || null,
        end_time: endTimeValue,
        order_index: order_index || 0
      }
    });
  } catch (error) {
    console.error('❌ [addFeatured] خطا:', error);
    next(error);
  }
};

// ===== ✅ ویرایش محصول ویژه =====
const updateFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { discount_percent, end_time } = req.body;

    console.log('📥 [updateFeatured] ===== شروع درخواست =====');
    console.log('📥 [updateFeatured] id دریافت شده:', id);
    console.log('📥 [updateFeatured] discount_percent:', discount_percent);
    console.log('📥 [updateFeatured] end_time:', end_time);

    if (discount_percent === undefined || discount_percent === null) {
      return res.status(400).json({ success: false, message: 'درصد تخفیف ارسال نشده است' });
    }

    const discount = Number(discount_percent);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      return res.status(400).json({ success: false, message: 'درصد تخفیف نامعتبر است' });
    }

    const [checkResult] = await pool.query(
      'SELECT id, product_id, discount_percent FROM featured_products WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, message: 'محصول ویژه یافت نشد' });
    }

    const query = 'UPDATE featured_products SET discount_percent = ?, end_time = ?, updated_at = NOW() WHERE id = ?';
    const params = [discount, end_time || null, id];

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'محصول ویژه یافت نشد' });
    }

    const [updated] = await pool.query(
      'SELECT * FROM featured_products WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    res.json({ success: true, message: 'محصول ویژه با موفقیت ویرایش شد', data: updated[0] });
  } catch (error) {
    console.error('❌ [updateFeatured] خطای غیرمنتظره:', error);
    next(error);
  }
};

// ===== حذف نرم =====
const softDeleteFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [item] = await pool.query('SELECT id FROM featured_products WHERE id = ? AND deleted_at IS NULL', [id]);
    if (item.length === 0) throw new AppError('محصول ویژه یافت نشد', 404);
    await pool.query('UPDATE featured_products SET deleted_at = NOW() WHERE id = ?', [id]);
    logger.info(`🗑️ محصول ویژه ${id} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'محصول ویژه به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

// ===== بازیابی =====
const restoreFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [item] = await pool.query('SELECT id FROM featured_products WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    if (item.length === 0) throw new AppError('محصول ویژه در سطل زباله یافت نشد', 404);
    await pool.query('UPDATE featured_products SET deleted_at = NULL WHERE id = ?', [id]);
    logger.info(`♻️ محصول ویژه ${id} بازیابی شد`);
    res.json({ success: true, message: 'محصول ویژه بازیابی شد' });
  } catch (error) { next(error); }
};

// ===== حذف دائمی =====
const forceDeleteFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [item] = await pool.query('SELECT id FROM featured_products WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    if (item.length === 0) throw new AppError('محصول ویژه در سطل زباله یافت نشد', 404);
    await pool.query('DELETE FROM featured_products WHERE id = ?', [id]);
    logger.info(`💀 محصول ویژه ${id} برای همیشه حذف شد`);
    res.json({ success: true, message: 'محصول ویژه برای همیشه حذف شد' });
  } catch (error) { next(error); }
};

// ===== دریافت محصولات ویژه سطل زباله =====
const getTrashedFeatured = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, p.name as product_name
       FROM featured_products f
       JOIN products p ON f.product_id = p.id
       WHERE f.deleted_at IS NOT NULL
       ORDER BY f.deleted_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

module.exports = {
  getPublicFeaturedProducts,
  getFeaturedProducts,
  addFeatured,
  updateFeatured,
  softDeleteFeatured,
  restoreFeatured,
  forceDeleteFeatured,
  getTrashedFeatured,
};