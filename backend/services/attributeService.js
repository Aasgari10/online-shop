// backend/services/attributeService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// توابع عمومی
// ============================================================

const getColors = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM attribute_values WHERE attribute_type_id = 1 ORDER BY sort_order ASC, id ASC'
  );
  return rows;
};

const getProductColors = async (productId) => {
  const [rows] = await pool.query(
    `SELECT av.id, av.value, av.color_code
     FROM product_attributes pa
     JOIN attribute_values av ON pa.attribute_value_id = av.id
     WHERE pa.product_id = ? AND av.attribute_type_id = 1`,
    [productId]
  );
  return rows;
};

const getProductCustomAttributes = async (productId) => {
  const [rows] = await pool.query(
    'SELECT custom_attributes FROM products WHERE id = ? AND deleted_at IS NULL',
    [productId]
  );
  if (rows.length === 0) throw new AppError('محصول یافت نشد', 404);
  return rows[0].custom_attributes || {};
};

const updateProductCustomAttributes = async (productId, customAttributes) => {
  const attrs = customAttributes && typeof customAttributes === 'object' 
    ? JSON.stringify(customAttributes) 
    : null;
  await pool.query(
    'UPDATE products SET custom_attributes = ? WHERE id = ?',
    [attrs, productId]
  );
  logger.info(`✏️ ویژگی‌های اختصاصی محصول ${productId} به‌روزرسانی شد`);
};

const getProductVariations = async (productId) => {
  const [rows] = await pool.query(
    `SELECT pv.*, 
            c.value as color_name, c.color_code,
            s.value as size_name
     FROM product_variations pv
     LEFT JOIN attribute_values c ON pv.color_value_id = c.id
     LEFT JOIN attribute_values s ON pv.size_value_id = s.id
     WHERE pv.product_id = ?
     ORDER BY pv.id`,
    [productId]
  );
  const variations = rows.map(row => {
    let attributeValues = {};
    if (row.attribute_values_json) {
      try {
        attributeValues = typeof row.attribute_values_json === 'string'
          ? JSON.parse(row.attribute_values_json)
          : row.attribute_values_json;
      } catch (e) {
        attributeValues = {};
      }
    }
    return {
      ...row,
      attribute_values: attributeValues,
    };
  });
  return variations;
};

const getTotalVariationStock = async (productId) => {
  const [result] = await pool.query(
    'SELECT SUM(stock) as total FROM product_variations WHERE product_id = ?',
    [productId]
  );
  return Number(result[0]?.total) || 0;
};

const getBaseProductStock = async (productId) => {
  return 0;
};

const validateVariationStock = async (productId, newStock, excludeVariationId = null) => {
  logger.info(`⚠️ [validateVariationStock] اعتبارسنجی موجودی غیرفعال شده است (productId: ${productId})`);
  return { baseStock: 0, currentTotal: 0, newTotal: 0 };
};

const getDiscountsForProduct = async (productId, variationId = null) => {
  let query = `
    SELECT * FROM featured_products 
    WHERE product_id = ? 
      AND type = 'discount' 
      AND deleted_at IS NULL
      AND (end_time IS NULL OR end_time > UNIX_TIMESTAMP(NOW()) * 1000)
  `;
  let params = [productId];
  
  if (variationId !== null) {
    query += ` AND (variation_id = ? OR variation_id IS NULL)`;
    params.push(variationId);
  }
  
  const [rows] = await pool.query(query, params);
  return rows;
};

const getCheapestDiscountedVariation = async (productId) => {
  const [variations] = await pool.query(
    `SELECT 
      pv.*,
      cv.value as color_name,
      cv.color_code,
      sv.value as size_name
     FROM product_variations pv
     LEFT JOIN attribute_values cv ON pv.color_value_id = cv.id
     LEFT JOIN attribute_values sv ON pv.size_value_id = sv.id
     WHERE pv.product_id = ?
     ORDER BY pv.price ASC`,
    [productId]
  );

  if (variations.length === 0) return null;

  const [discountRows] = await pool.query(
    `SELECT * FROM featured_products 
     WHERE product_id = ? AND type = 'discount' AND deleted_at IS NULL
     AND (end_time IS NULL OR end_time > UNIX_TIMESTAMP(NOW()) * 1000)`,
    [productId]
  );

  const variationsWithPrice = variations.map(v => {
    const originalPrice = parseFloat(v.price) || 0;
    let finalPrice = originalPrice;
    let discountApplied = false;
    let discountPercent = 0;

    const variationDiscount = discountRows.find(d => d.variation_id === v.id);
    if (variationDiscount) {
      const percent = variationDiscount.discount_percent || 0;
      const endTime = variationDiscount.end_time;
      const isValid = percent > 0 && (!endTime || endTime > Date.now());
      if (isValid && originalPrice > 0) {
        discountPercent = percent;
        discountApplied = true;
        finalPrice = Math.round(originalPrice * (1 - percent / 100));
      }
    }

    if (!discountApplied) {
      const globalDiscount = discountRows.find(d => d.variation_id === null);
      if (globalDiscount) {
        const percent = globalDiscount.discount_percent || 0;
        const endTime = globalDiscount.end_time;
        const isValid = percent > 0 && (!endTime || endTime > Date.now());
        if (isValid && originalPrice > 0) {
          discountPercent = percent;
          discountApplied = true;
          finalPrice = Math.round(originalPrice * (1 - percent / 100));
        }
      }
    }

    return {
      ...v,
      original_price: originalPrice,
      final_price: finalPrice,
      discount_applied: discountApplied,
      discount_percent: discountApplied ? discountPercent : 0,
    };
  });

  variationsWithPrice.sort((a, b) => a.final_price - b.final_price);
  return variationsWithPrice[0] || null;
};

// ============================================================
// توابع مدیریت رنگ‌ها
// ============================================================

const addProductColor = async (productId, colorValueId) => {
  await pool.query(
    'INSERT IGNORE INTO product_attributes (product_id, attribute_value_id) VALUES (?, ?)',
    [productId, colorValueId]
  );
  logger.info(`✅ رنگ ${colorValueId} به محصول ${productId} اضافه شد`);
};

const removeProductColor = async (productId, colorValueId) => {
  await pool.query(
    'DELETE FROM product_attributes WHERE product_id = ? AND attribute_value_id = ?',
    [productId, colorValueId]
  );
  logger.info(`🗑️ رنگ ${colorValueId} از محصول ${productId} حذف شد`);
};

// ============================================================
// توابع مدیریت ترکیبات (✅ اصلاح‌شده برای پشتیبانی از رنگ‌های سفارشی)
// ============================================================

const createDynamicVariation = async (productId, attributeMap) => {
  logger.info('🔍 [createDynamicVariation] attributeMap دریافتی:', JSON.stringify(attributeMap, null, 2));

  const [product] = await pool.query(
    'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
    [productId]
  );
  if (product.length === 0) throw new AppError('محصول یافت نشد', 404);

  // حذف فیلدهای اضافی (stock, price و ...)
  const cleanAttributeMap = { ...attributeMap };
  delete cleanAttributeMap.stock;
  delete cleanAttributeMap.STOCK;
  delete cleanAttributeMap.Stock;
  delete cleanAttributeMap.price;
  delete cleanAttributeMap.PRICE;

  let colorValueId = null;
  const attrEntries = [];

  for (const [key, value] of Object.entries(cleanAttributeMap)) {
    if (key === '1') {
      // ✅ فقط اگر value یک عدد مثبت معتبر باشد، colorValueId را مقداردهی کن
      const parsed = parseInt(value);
      if (!isNaN(parsed) && parsed > 0) {
        // رنگ عمومی (وجود دارد در جدول attribute_values)
        colorValueId = parsed;
        // خود value را هم در attrEntries نگه دار تا در JSON ذخیره شود
        attrEntries.push({ key, value });
      } else {
        // ✅ رنگ سفارشی: colorValueId = null و مقدار به attribute_values_json سپرده می‌شود
        // خود value را هم در attrEntries نگه دار تا در JSON ذخیره شود
        attrEntries.push({ key, value });
        colorValueId = null; // به صراحت null
      }
    } else {
      attrEntries.push({ key, value });
    }
  }

  // ساخت jsonData برای attribute_values_json (همه ویژگی‌ها)
  const jsonData = {};
  for (const [key, value] of Object.entries(cleanAttributeMap)) {
    jsonData[key] = value;
  }

  const stock = parseInt(attributeMap.stock) || 0;
  const price = parseFloat(attributeMap.price) || null;

  // ✅ اطمینان از اینکه colorValueId حتماً null یا عدد است (نه NaN)
  if (colorValueId !== null && isNaN(colorValueId)) {
    colorValueId = null;
  }

  const [result] = await pool.query(
    `INSERT INTO product_variations 
     (product_id, color_value_id, attribute_values_json, stock, price) 
     VALUES (?, ?, ?, ?, ?)`,
    [productId, colorValueId, JSON.stringify(jsonData), stock, price]
  );

  logger.info(`✅ ترکیب جدید با ID ${result.insertId} برای محصول ${productId} ایجاد شد`);
  return {
    id: result.insertId,
    product_id: productId,
    attribute_values: jsonData,
    stock,
    price,
  };
};

const updateVariation = async (variationId, data) => {
  const { price, stock, sku } = data;
  
  const [variation] = await pool.query(
    'SELECT product_id FROM product_variations WHERE id = ?',
    [variationId]
  );
  if (variation.length === 0) throw new AppError('ترکیب یافت نشد', 404);
  const productId = variation[0].product_id;

  let priceValue = null;
  if (price !== undefined && price !== null && price !== '') {
    priceValue = parseFloat(price);
    if (isNaN(priceValue)) {
      throw new AppError('قیمت نامعتبر است', 400);
    }
  }
  
  const stockValue = (stock !== undefined && stock !== null) ? parseInt(stock) : 0;
  
  await pool.query(
    'UPDATE product_variations SET price = ?, stock = ?, sku = ? WHERE id = ?',
    [priceValue, stockValue, sku || null, variationId]
  );
  logger.info(`🔄 ترکیب ${variationId} به‌روزرسانی شد (price: ${priceValue}, stock: ${stockValue})`);
};

const deleteVariation = async (variationId) => {
  const [existing] = await pool.query(
    'SELECT id FROM product_variations WHERE id = ?',
    [variationId]
  );
  if (existing.length === 0) throw new AppError('ترکیب یافت نشد', 404);
  await pool.query('DELETE FROM product_variations WHERE id = ?', [variationId]);
  logger.info(`🗑️ ترکیب ${variationId} حذف شد`);
};

const deleteVariationsBatch = async (ids) => {
  if (!ids || ids.length === 0) throw new AppError('حداقل یک ترکیب را انتخاب کنید', 400);
  const placeholders = ids.map(() => '?').join(',');
  await pool.query(`DELETE FROM product_variations WHERE id IN (${placeholders})`, ids);
  logger.info(`🗑️ ${ids.length} ترکیب به‌صورت گروهی حذف شدند`);
};

const getAllAttributeTypesAndValues = async () => {
  const [types] = await pool.query('SELECT * FROM attribute_types ORDER BY id');
  const valuesMap = {};
  for (const type of types) {
    const [values] = await pool.query(
      'SELECT * FROM attribute_values WHERE attribute_type_id = ? ORDER BY id',
      [type.id]
    );
    valuesMap[type.id] = values;
  }
  return { types, valuesMap };
};

// ============================================================
// خروجی ماژول
// ============================================================

module.exports = {
  getColors,
  getProductColors,
  getProductCustomAttributes,
  updateProductCustomAttributes,
  getProductVariations,
  getTotalVariationStock,
  getBaseProductStock,
  validateVariationStock,
  getCheapestDiscountedVariation,
  getDiscountsForProduct,
  addProductColor,
  removeProductColor,
  createDynamicVariation,   // ✅ اصلاح‌شده
  updateVariation,
  deleteVariation,
  deleteVariationsBatch,
  getAllAttributeTypesAndValues,
};