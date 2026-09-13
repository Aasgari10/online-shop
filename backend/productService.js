// backend/services/productService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { AppError } = require('../middleware/errorHandler');
const slugify = require('slugify-persian');

const generateUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const [rows] = await pool.query(
      'SELECT id FROM products WHERE slug = ? AND (id != ? OR ? IS NULL) AND deleted_at IS NULL',
      [slug, excludeId || 0, excludeId === null ? 1 : 0]
    );
    if (rows.length === 0) {
      exists = false;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
};

const calculateTotalStock = async (productId) => {
  const [variationsResult] = await pool.query(
    'SELECT SUM(stock) as totalVariationStock FROM product_variations WHERE product_id = ?',
    [productId]
  );
  return Number(variationsResult[0]?.totalVariationStock) || 0;
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

const getVariationFinalPrice = (variationPrice, discounts, variationId) => {
  const originalPrice = parseFloat(variationPrice) || 0;
  let finalPrice = originalPrice;
  let discountApplied = false;
  let discountPercent = 0;

  const variationDiscount = discounts.find(d => d.variation_id === variationId);
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
    const globalDiscount = discounts.find(d => d.variation_id === null);
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

  return { finalPrice, discountApplied, discountPercent, originalPrice };
};

const pickBestVariation = (variationsWithPrice) => {
  if (!variationsWithPrice || variationsWithPrice.length === 0) return null;

  const discounted = variationsWithPrice.filter(v => v.discount_applied);
  if (discounted.length > 0) {
    discounted.sort((a, b) => a.final_price - b.final_price);
    return discounted[0];
  }

  const sorted = [...variationsWithPrice].sort((a, b) => a.final_price - b.final_price);
  return sorted[0];
};

// ============================================================
// ✅ getProducts (نسخه نهایی — با derived table برای سورت درست)
// ============================================================
const getProducts = async (filters) => {
  const { 
    search, 
    category, 
    minPrice, 
    maxPrice, 
    sort, 
    page = 1, 
    limit = 12, 
    minRating, 
    star,
    showDiscounted,
  } = filters;

  const filterDiscountedOnly = 
    showDiscounted === true || 
    showDiscounted === 'true' || 
    showDiscounted === 1 || 
    showDiscounted === '1';

  const minFinalPriceSubquery = `
    COALESCE(
      NULLIF(
        (
          SELECT MIN(
            CASE
              WHEN fp_v.id IS NOT NULL AND fp_v.discount_percent > 0
                AND (fp_v.end_time IS NULL OR fp_v.end_time > UNIX_TIMESTAMP(NOW()) * 1000)
              THEN ROUND(pv2.price * (1 - fp_v.discount_percent / 100))
              WHEN fp_g.id IS NOT NULL AND fp_g.discount_percent > 0
                AND (fp_g.end_time IS NULL OR fp_g.end_time > UNIX_TIMESTAMP(NOW()) * 1000)
              THEN ROUND(pv2.price * (1 - fp_g.discount_percent / 100))
              ELSE pv2.price
            END
          )
          FROM product_variations pv2
          LEFT JOIN featured_products fp_v 
            ON fp_v.product_id = pv2.product_id 
            AND fp_v.variation_id = pv2.id 
            AND fp_v.type = 'discount' 
            AND fp_v.deleted_at IS NULL
          LEFT JOIN featured_products fp_g 
            ON fp_g.product_id = pv2.product_id 
            AND fp_g.variation_id IS NULL 
            AND fp_g.type = 'discount' 
            AND fp_g.deleted_at IS NULL
          WHERE pv2.product_id = products.id
            AND pv2.price IS NOT NULL
            AND pv2.price > 0
        ),
        0
      ),
      NULLIF(products.price, 0),
      0
    )
  `;

  const minOriginalPriceSubquery = `
    COALESCE(
      NULLIF(
        (
          SELECT MIN(pv_orig.price) 
          FROM product_variations pv_orig 
          WHERE pv_orig.product_id = products.id 
            AND pv_orig.price IS NOT NULL
            AND pv_orig.price > 0
        ),
        0
      ),
      NULLIF(products.price, 0),
      0
    )
  `;

  const whereConditions = [];
  const whereParams = [];

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    whereConditions.push('(products.name LIKE ? OR products.description LIKE ?)');
    whereParams.push(term, term);
  }

  if (category && category !== 'همه') {
    if (!isNaN(category)) {
      whereConditions.push('products.category_id = ?');
      whereParams.push(parseInt(category));
    } else {
      whereConditions.push('products.category_id = (SELECT id FROM categories WHERE name = ? AND deleted_at IS NULL)');
      whereParams.push(category);
    }
  }

  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    const min = parseFloat(minPrice);
    if (!isNaN(min) && min >= 0) {
      whereConditions.push(`${minFinalPriceSubquery} >= ?`);
      whereParams.push(min);
    }
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    const max = parseFloat(maxPrice);
    if (!isNaN(max) && max >= 0) {
      whereConditions.push(`${minFinalPriceSubquery} <= ?`);
      whereParams.push(max);
    }
  }

  if (filterDiscountedOnly) {
    whereConditions.push(`EXISTS (
      SELECT 1 FROM featured_products fp_check 
      WHERE fp_check.product_id = products.id 
        AND fp_check.type = 'discount' 
        AND fp_check.deleted_at IS NULL
        AND (fp_check.end_time IS NULL OR fp_check.end_time > UNIX_TIMESTAMP(NOW()) * 1000)
    )`);
  }

  let ratingFilter = null;
  if (minRating !== undefined && minRating !== null && minRating !== '') {
    const rating = parseFloat(minRating);
    if (!isNaN(rating) && rating >= 0 && rating <= 5) {
      ratingFilter = rating;
    }
  }
  if (star !== undefined && star !== null && star !== '') {
    const starNum = parseInt(star);
    if (!isNaN(starNum) && starNum >= 1 && starNum <= 5) {
      if (ratingFilter === null) {
        ratingFilter = starNum;
      } else {
        ratingFilter = Math.max(ratingFilter, starNum);
      }
    }
  }

  let innerQuery = `
    SELECT 
      products.id,
      products.name,
      products.description,
      products.price,
      products.stock,
      products.image_url,
      products.created_at,
      products.rating,
      products.deleted_at,
      products.category_id,
      products.brand,
      products.weight,
      products.dimensions,
      products.custom_attributes,
      products.model,
      products.slug,
      products.meta_title,
      products.meta_description,
      products.meta_keywords,
      products.updated_at,
      categories.name as category_name,
      COALESCE(
        (SELECT SUM(oi.quantity) 
         FROM order_items oi 
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.product_id = products.id 
           AND o.status != 'لغو شده'
        ), 0
      ) as total_sales,
      COALESCE(
        (SELECT AVG(rating) 
         FROM reviews 
         WHERE product_id = products.id 
           AND deleted_at IS NULL 
           AND is_approved = 1
        ), 0
      ) as average_rating,
      COALESCE(
        (SELECT COUNT(*) 
         FROM reviews 
         WHERE product_id = products.id 
           AND deleted_at IS NULL 
           AND is_approved = 1
        ), 0
      ) as total_reviews,
      ${minOriginalPriceSubquery} as min_original_price,
      ${minFinalPriceSubquery} as min_final_price
    FROM products 
    LEFT JOIN categories ON products.category_id = categories.id AND categories.deleted_at IS NULL
    WHERE products.deleted_at IS NULL
  `;

  if (whereConditions.length > 0) {
    innerQuery += ' AND ' + whereConditions.join(' AND ');
  }

  const sortMap = {
    popular: 'total_sales DESC, id DESC',
    rating: 'average_rating DESC, id DESC',
    newest: 'created_at DESC, id DESC',
    price_asc: 'min_final_price ASC, id ASC',
    price_desc: 'min_final_price DESC, id DESC',
  };
  const orderBy = sortMap[sort] || 'created_at DESC, id DESC';

  let query = `
    SELECT * FROM (${innerQuery}) AS products_with_price
    ORDER BY ${orderBy}
  `;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ' LIMIT ? OFFSET ?';

  const queryParams = [...whereParams, parseInt(limit), offset];

  const [rows] = await pool.query(query, queryParams);

  let total = 0;

  if (ratingFilter !== null) {
    let countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT 
          products.id,
          COALESCE(
            (SELECT AVG(rating) 
             FROM reviews 
             WHERE product_id = products.id 
               AND deleted_at IS NULL 
               AND is_approved = 1
            ), 0
          ) as average_rating
        FROM products 
        WHERE products.deleted_at IS NULL
    `;
    if (whereConditions.length > 0) {
      countQuery += ' AND ' + whereConditions.join(' AND ');
    }
    countQuery += ` ) as filtered_products WHERE average_rating >= ?`;
    const countParams = [...whereParams, ratingFilter];
    const [countResult] = await pool.query(countQuery, countParams);
    total = countResult[0]?.total || 0;
  } else {
    let countQuery = `SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL`;
    if (whereConditions.length > 0) {
      countQuery += ' AND ' + whereConditions.join(' AND ');
    }
    const [countResult] = await pool.query(countQuery, whereParams);
    total = countResult[0]?.total || 0;
  }

  const productIds = rows.map(p => p.id);
  
  let avgRatings = {};
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const [ratings] = await pool.query(
      `SELECT product_id, AVG(rating) as avgRating, COUNT(*) as totalReviews 
       FROM reviews WHERE product_id IN (${placeholders}) AND deleted_at IS NULL AND is_approved = 1 GROUP BY product_id`,
      productIds
    );
    ratings.forEach(r => {
      avgRatings[r.product_id] = { avg: Number(r.avgRating) || 0, count: r.totalReviews };
    });
  }

  let variationsByProduct = {};
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const [variations] = await pool.query(
      `SELECT 
        pv.*,
        pv.product_id,
        cv.value as color_name,
        cv.color_code,
        sv.value as size_name
       FROM product_variations pv
       LEFT JOIN attribute_values cv ON pv.color_value_id = cv.id
       LEFT JOIN attribute_values sv ON pv.size_value_id = sv.id
       WHERE pv.product_id IN (${placeholders})
       ORDER BY pv.price ASC`,
      productIds
    );
    variations.forEach(v => {
      if (!variationsByProduct[v.product_id]) {
        variationsByProduct[v.product_id] = [];
      }
      variationsByProduct[v.product_id].push(v);
    });
  }

  let featuredDiscounts = {};
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const [discounts] = await pool.query(
      `SELECT * FROM featured_products 
       WHERE product_id IN (${placeholders}) 
         AND type = 'discount' 
         AND deleted_at IS NULL
         AND (end_time IS NULL OR end_time > UNIX_TIMESTAMP(NOW()) * 1000)`,
      productIds
    );
    discounts.forEach(d => {
      if (!featuredDiscounts[d.product_id]) {
        featuredDiscounts[d.product_id] = [];
      }
      featuredDiscounts[d.product_id].push(d);
    });
  }

  const data = await Promise.all(rows.map(async (product) => {
    const totalStock = await calculateTotalStock(product.id);
    const productVariations = variationsByProduct[product.id] || [];
    const discounts = featuredDiscounts[product.id] || [];

    let cheapest = null;
    let displayPrice = 0;
    let originalPrice = 0;
    let discountPercent = 0;
    let isDiscounted = false;

    if (productVariations.length > 0) {
      const variationsWithPrice = productVariations.map(v => {
        const result = getVariationFinalPrice(v.price, discounts, v.id);
        return {
          ...v,
          original_price: result.originalPrice,
          final_price: result.finalPrice,
          discount_applied: result.discountApplied,
          discount_percent: result.discountPercent,
        };
      });

      cheapest = pickBestVariation(variationsWithPrice);
      
      displayPrice = cheapest ? cheapest.final_price : 0;
      originalPrice = cheapest ? cheapest.original_price : 0;
      discountPercent = cheapest ? cheapest.discount_percent : 0;
      isDiscounted = cheapest ? cheapest.discount_applied : false;
    } else {
      originalPrice = parseFloat(product.price) || 0;
      const result = getVariationFinalPrice(product.price, discounts, null);
      displayPrice = result.finalPrice;
      discountPercent = result.discountPercent;
      isDiscounted = result.discountApplied;
    }

    return {
      ...product,
      stock: totalStock,
      total_stock: totalStock,
      display_price: displayPrice,
      original_price: originalPrice,
      discount_percent: discountPercent,
      is_discounted: isDiscounted,
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
        discount_percent: cheapest.discount_percent,
      } : null,
      averageRating: avgRatings[product.id]?.avg || 0,
      totalReviews: avgRatings[product.id]?.count || 0,
    };
  }));

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    },
  };
};

// ============================================================
// ✅ getProductById
// ============================================================
const getProductById = async (idOrSlug) => {
  const isNumeric = !isNaN(idOrSlug) && idOrSlug !== '';

  let query, params;
  if (isNumeric) {
    query = `
      SELECT products.*, categories.name as category_name 
      FROM products 
      LEFT JOIN categories ON products.category_id = categories.id AND categories.deleted_at IS NULL
      WHERE products.id = ? AND products.deleted_at IS NULL
    `;
    params = [idOrSlug];
  } else {
    query = `
      SELECT products.*, categories.name as category_name 
      FROM products 
      LEFT JOIN categories ON products.category_id = categories.id AND categories.deleted_at IS NULL
      WHERE products.slug = ? AND products.deleted_at IS NULL
    `;
    params = [idOrSlug];
  }

  const [rows] = await pool.query(query, params);
  if (rows.length === 0) throw new AppError('محصول یافت نشد', 404);
  const product = rows[0];

  if (!product.slug) {
    const baseSlug = slugify(product.name);
    const uniqueSlug = await generateUniqueSlug(baseSlug, product.id);
    await pool.query('UPDATE products SET slug = ? WHERE id = ?', [uniqueSlug, product.id]);
    product.slug = uniqueSlug;
    logger.info(`🔄 Slug برای محصول ${product.id} تولید شد: ${uniqueSlug}`);
  }

  const [ratingResult] = await pool.query(
    `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews 
     FROM reviews WHERE product_id = ? AND deleted_at IS NULL AND is_approved = 1`,
    [product.id]
  );
  
  const totalStock = await calculateTotalStock(product.id);

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
    [product.id]
  );

  const [discounts] = await pool.query(
    `SELECT * FROM featured_products 
     WHERE product_id = ? AND type = 'discount' AND deleted_at IS NULL
     AND (end_time IS NULL OR end_time > UNIX_TIMESTAMP(NOW()) * 1000)`,
    [product.id]
  );

  const variationsWithDiscount = variations.map(v => {
    const result = getVariationFinalPrice(v.price, discounts, v.id);
    return {
      ...v,
      original_price: result.originalPrice,
      final_price: result.finalPrice,
      discount_applied: result.discountApplied,
      discount_percent: result.discountPercent,
    };
  });

  const cheapest = pickBestVariation(variationsWithDiscount);

  const displayPrice = cheapest ? cheapest.final_price : 0;
  const originalPrice = cheapest ? cheapest.original_price : 0;
  const discountPercent = cheapest ? cheapest.discount_percent : 0;
  const isDiscounted = cheapest ? cheapest.discount_applied : false;

  return {
    ...product,
    stock: totalStock,
    total_stock: totalStock,
    display_price: displayPrice,
    original_price: originalPrice,
    discount_percent: discountPercent,
    is_discounted: isDiscounted,
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
      discount_percent: cheapest.discount_percent,
    } : null,
    variations: variationsWithDiscount,
    category: product.category_name || 'متفرقه',
    averageRating: Number(ratingResult[0]?.avgRating) || 0,
    totalReviews: Number(ratingResult[0]?.totalReviews) || 0,
    custom_attributes: product.custom_attributes || {},
  };
};

// ============================================================
// ✅ createProduct
// ============================================================
const createProduct = async (productData, file) => {
  const { 
    name, description, category_id, 
    brand, model, weight, dimensions, custom_attributes,
    meta_title, meta_description, meta_keywords,
    slug
  } = productData;

  const slugStr = String(slug || '').trim();

  if (!name) throw new AppError('نام محصول الزامی است', 400);

  const image_url = file ? `/uploads/${file.filename}` : null;
  
  let customAttrs = null;
  if (custom_attributes && typeof custom_attributes === 'object') {
    customAttrs = JSON.stringify(custom_attributes);
  }

  let finalSlug;
  if (slugStr) {
    const cleanSlug = slugStr.toLowerCase().replace(/\s+/g, '-');
    finalSlug = await generateUniqueSlug(cleanSlug);
  } else {
    const baseSlug = slugify(name);
    finalSlug = await generateUniqueSlug(baseSlug);
  }

  const [result] = await pool.query(
    `INSERT INTO products 
     (name, description, price, stock, image_url, category_id, 
      brand, model, weight, dimensions, custom_attributes, slug,
      meta_title, meta_description, meta_keywords) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, description, 0, 0, image_url, category_id || null,
      brand || null, model || null, weight || null, dimensions || null, customAttrs, finalSlug,
      meta_title || null, meta_description || null, meta_keywords || null
    ]
  );
  
  logger.info(`➕ محصول جدید اضافه شد: ${name} (ID: ${result.insertId}, Slug: ${finalSlug})`);
  
  const totalStock = await calculateTotalStock(result.insertId);
  
  return { 
    id: result.insertId, 
    slug: finalSlug,
    name, 
    description, 
    price: 0,
    display_price: 0,
    stock: totalStock,
    total_stock: totalStock,
    image_url, 
    category_id,
    brand, model, weight, dimensions,
    custom_attributes: custom_attributes || {},
    meta_title, meta_description, meta_keywords,
    cheapest_variation: null,
    averageRating: 0,
    totalReviews: 0,
  };
};

// ============================================================
// ✅ updateProduct
// ============================================================
const updateProduct = async (id, productData, file) => {
  const fields = [];
  const params = [];

  const [current] = await pool.query(
    'SELECT image_url, name, slug, price, stock FROM products WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (current.length === 0) throw new AppError('محصول یافت نشد', 404);

  let oldName = current[0].name;

  if (productData.name !== undefined) {
    fields.push('name = ?');
    params.push(productData.name);
    if (productData.name !== oldName && !productData.slug) {
      const baseSlug = slugify(productData.name);
      const uniqueSlug = await generateUniqueSlug(baseSlug, id);
      fields.push('slug = ?');
      params.push(uniqueSlug);
    }
  }

  if (productData.slug !== undefined) {
    const newSlug = String(productData.slug).trim();
    if (newSlug === '') {
      throw new AppError('اسلاگ نمی‌تواند خالی باشد', 400);
    }
    const [duplicate] = await pool.query(
      'SELECT id FROM products WHERE slug = ? AND id != ? AND deleted_at IS NULL',
      [newSlug, id]
    );
    if (duplicate.length > 0) {
      throw new AppError('این اسلاگ قبلاً توسط محصول دیگری استفاده شده است', 400);
    }
    fields.push('slug = ?');
    params.push(newSlug);
  }

  if (productData.meta_title !== undefined) {
    fields.push('meta_title = ?');
    params.push(productData.meta_title || null);
  }
  if (productData.meta_description !== undefined) {
    fields.push('meta_description = ?');
    params.push(productData.meta_description || null);
  }
  if (productData.meta_keywords !== undefined) {
    fields.push('meta_keywords = ?');
    params.push(productData.meta_keywords || null);
  }

  if (productData.description !== undefined) {
    fields.push('description = ?');
    params.push(productData.description);
  }
  if (productData.category_id !== undefined) {
    fields.push('category_id = ?');
    params.push(productData.category_id || null);
  }
  if (productData.brand !== undefined) {
    fields.push('brand = ?');
    params.push(productData.brand || null);
  }
  if (productData.model !== undefined) {
    fields.push('model = ?');
    params.push(productData.model || null);
  }
  if (productData.weight !== undefined) {
    fields.push('weight = ?');
    params.push(productData.weight || null);
  }
  if (productData.dimensions !== undefined) {
    fields.push('dimensions = ?');
    params.push(productData.dimensions || null);
  }
  if (productData.price !== undefined) {
    const priceNum = parseFloat(productData.price);
    if (!isNaN(priceNum) && priceNum >= 0) {
      fields.push('price = ?');
      params.push(Math.round(priceNum));
    }
  }
  if (productData.stock !== undefined) {
    const stockNum = parseInt(productData.stock);
    if (!isNaN(stockNum) && stockNum >= 0) {
      fields.push('stock = ?');
      params.push(stockNum);
    }
  }
  if (productData.custom_attributes !== undefined) {
    let customAttrs = null;
    if (productData.custom_attributes && typeof productData.custom_attributes === 'object') {
      customAttrs = JSON.stringify(productData.custom_attributes);
    }
    fields.push('custom_attributes = ?');
    params.push(customAttrs);
  }
  if (file) {
    const image_url = `/uploads/${file.filename}`;
    fields.push('image_url = ?');
    params.push(image_url);
  }

  if (fields.length === 0) {
    throw new AppError('هیچ فیلدی برای ویرایش ارسال نشده است', 400);
  }

  const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);
  await pool.query(query, params);

  if (file && current[0].image_url) {
    const oldPath = path.join(__dirname, '..', current[0].image_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  logger.info(`✏️ محصول ${id} ویرایش شد`);
  
  const [updated] = await pool.query('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
  const totalStock = await calculateTotalStock(id);
  
  const [ratingResult] = await pool.query(
    `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews 
     FROM reviews WHERE product_id = ? AND deleted_at IS NULL AND is_approved = 1`,
    [id]
  );

  return {
    ...updated[0],
    stock: totalStock,
    total_stock: totalStock,
    custom_attributes: updated[0].custom_attributes || {},
    averageRating: Number(ratingResult[0]?.avgRating) || 0,
    totalReviews: Number(ratingResult[0]?.totalReviews) || 0,
  };
};

// ===== deleteProduct =====
const deleteProduct = async (id) => {
  const [product] = await pool.query('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
  if (product.length === 0) throw new AppError('محصول یافت نشد', 404);
  await pool.query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [id]);
  logger.info(`🗑️ محصول ${id} به سطل زباله منتقل شد`);
};

// ===== restoreProduct =====
const restoreProduct = async (id) => {
  const [product] = await pool.query('SELECT id FROM products WHERE id = ? AND deleted_at IS NOT NULL', [id]);
  if (product.length === 0) throw new AppError('محصول در سطل زباله یافت نشد', 404);
  await pool.query('UPDATE products SET deleted_at = NULL WHERE id = ?', [id]);
  logger.info(`♻️ محصول ${id} بازیابی شد`);
};

// ===== forceDeleteProduct =====
const forceDeleteProduct = async (id) => {
  const [product] = await pool.query('SELECT image_url FROM products WHERE id = ? AND deleted_at IS NOT NULL', [id]);
  if (product.length === 0) throw new AppError('محصول در سطل زباله یافت نشد', 404);
  if (product[0].image_url) {
    const oldPath = path.join(__dirname, '..', product[0].image_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  logger.info(`💀 محصول ${id} برای همیشه حذف شد`);
};

// ===== getTrashedProducts =====
const getTrashedProducts = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  );
  return Promise.all(rows.map(async (p) => {
    const totalStock = await calculateTotalStock(p.id);
    const [ratingResult] = await pool.query(
      `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews 
       FROM reviews WHERE product_id = ? AND deleted_at IS NULL AND is_approved = 1`,
      [p.id]
    );
    return { 
      ...p, 
      stock: totalStock, 
      total_stock: totalStock, 
      custom_attributes: p.custom_attributes || {},
      averageRating: Number(ratingResult[0]?.avgRating) || 0,
      totalReviews: Number(ratingResult[0]?.totalReviews) || 0,
    };
  }));
};

// ===== getSimilarProducts =====
const getSimilarProducts = async (id) => {
  const [productRows] = await pool.query('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
  if (productRows.length === 0) throw new AppError('محصول یافت نشد', 404);
  const product = productRows[0];
  let similarProducts = [];

  if (product.category_id) {
    const [rows] = await pool.query(
      `SELECT * FROM products 
       WHERE category_id = ? AND id != ? AND deleted_at IS NULL 
       ORDER BY id DESC LIMIT 6`,
      [product.category_id, id]
    );
    similarProducts = rows;
  }

  if (similarProducts.length === 0) {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id != ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 6',
      [id]
    );
    similarProducts = rows;
  }
  return Promise.all(similarProducts.map(async (p) => {
    const totalStock = await calculateTotalStock(p.id);
    const [ratingResult] = await pool.query(
      `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews 
       FROM reviews WHERE product_id = ? AND deleted_at IS NULL AND is_approved = 1`,
      [p.id]
    );
    return { 
      ...p, 
      stock: totalStock, 
      total_stock: totalStock, 
      custom_attributes: p.custom_attributes || {},
      averageRating: Number(ratingResult[0]?.avgRating) || 0,
      totalReviews: Number(ratingResult[0]?.totalReviews) || 0,
    };
  }));
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  forceDeleteProduct,
  getTrashedProducts,
  getSimilarProducts,
  calculateTotalStock,
};