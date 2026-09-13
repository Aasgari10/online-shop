// backend/services/cartService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ===== تابع کمکی برای محاسبه قیمت تخفیف‌خورده =====
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

// ===== دریافت سبد خرید با قیمت‌های تخفیف‌خورده =====
const getCart = async (userId) => {
  // ۱. دریافت آیتم‌های سبد خرید
  const [rows] = await pool.query(
    `SELECT c.id, c.product_id, c.variation_id, c.quantity, 
            p.name, p.price, p.image_url, p.stock as product_stock,
            pv.price as variation_price, pv.stock as variation_stock,
            pv.attribute_values_json,
            av.value as color_name,
            av2.value as size_name
     FROM cart c
     JOIN products p ON c.product_id = p.id
     LEFT JOIN product_variations pv ON c.variation_id = pv.id
     LEFT JOIN attribute_values av ON pv.color_value_id = av.id
     LEFT JOIN attribute_values av2 ON pv.size_value_id = av2.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );

  if (rows.length === 0) return [];

  // ۲. دریافت همه تخفیف‌های فعال برای محصولات موجود در سبد خرید
  const productIds = rows.map(item => item.product_id);
  const placeholders = productIds.map(() => '?').join(',');
  const [discounts] = await pool.query(
    `SELECT * FROM featured_products 
     WHERE product_id IN (${placeholders}) 
       AND type = 'discount' 
       AND deleted_at IS NULL
       AND (end_time IS NULL OR end_time > UNIX_TIMESTAMP(NOW()) * 1000)`,
    productIds
  );

  // ۳. گروه‌بندی تخفیف‌ها بر اساس product_id
  const discountsByProduct = {};
  discounts.forEach(d => {
    if (!discountsByProduct[d.product_id]) {
      discountsByProduct[d.product_id] = [];
    }
    discountsByProduct[d.product_id].push(d);
  });

  // ۴. محاسبه قیمت نهایی برای هر آیتم
  return rows.map(item => {
    const variationId = item.variation_id || null;
    const basePrice = parseFloat(item.variation_price || item.price || 0);
    const productDiscounts = discountsByProduct[item.product_id] || [];

    // محاسبه قیمت با تخفیف
    const { finalPrice, discountApplied, discountPercent, originalPrice } = 
      getVariationFinalPrice(basePrice, productDiscounts, variationId);

    return {
      id: item.product_id,
      product_id: item.product_id,
      variation_id: item.variation_id,
      cart_id: item.id,
      quantity: item.quantity,
      name: item.name,
      price: finalPrice,                // قیمت نهایی با تخفیف
      original_price: originalPrice,    // قیمت اصلی (برای نمایش)
      discount_percent: discountPercent,
      discount_applied: discountApplied,
      image_url: item.image_url,
      stock: item.variation_stock !== null ? item.variation_stock : item.product_stock,
      color_name: item.color_name,
      size_name: item.size_name,
      attribute_values_json: item.attribute_values_json,
    };
  });
};

// ===== افزودن به سبد خرید (بدون تغییر) =====
const addToCart = async (userId, productId, variationId, quantity) => {
  if (!productId) throw new AppError('شناسه محصول الزامی است', 400);
  if (!quantity || quantity < 1) quantity = 1;

  const [product] = await pool.query('SELECT id, stock FROM products WHERE id = ? AND deleted_at IS NULL', [productId]);
  if (product.length === 0) throw new AppError('محصول یافت نشد', 404);

  let stock = product[0].stock;
  if (variationId) {
    const [variation] = await pool.query('SELECT stock FROM product_variations WHERE id = ?', [variationId]);
    if (variation.length === 0) throw new AppError('ترکیب یافت نشد', 404);
    stock = variation[0].stock;
  }

  if (stock < quantity) {
    throw new AppError('موجودی کافی نیست', 400);
  }

  await pool.query(
    `INSERT INTO cart (user_id, product_id, variation_id, quantity)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [userId, productId, variationId, quantity, quantity]
  );

  return getCart(userId);
};

// ===== به‌روزرسانی تعداد (بدون تغییر) =====
const updateCartItem = async (userId, productId, variationId, quantity) => {
  if (quantity < 0) throw new AppError('تعداد نمی‌تواند منفی باشد', 400);
  
  if (quantity === 0) {
    await pool.query(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
      [userId, productId, variationId, variationId]
    );
  } else {
    await pool.query(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
      [quantity, userId, productId, variationId, variationId]
    );
  }
  return getCart(userId);
};

// ===== حذف از سبد خرید (بدون تغییر) =====
const removeFromCart = async (userId, productId, variationId) => {
  await pool.query(
    'DELETE FROM cart WHERE user_id = ? AND product_id = ? AND (variation_id = ? OR (variation_id IS NULL AND ? IS NULL))',
    [userId, productId, variationId, variationId]
  );
  return getCart(userId);
};

// ===== خالی کردن سبد خرید (بدون تغییر) =====
const clearCart = async (userId) => {
  await pool.query('DELETE FROM cart WHERE user_id = ?', [userId]);
  return [];
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};