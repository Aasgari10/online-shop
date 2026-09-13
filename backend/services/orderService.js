// backend/services/orderService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const discountCodeService = require('./discountCodeService');

const safeJsonStringify = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch (e) {
      return null;
    }
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const generateTrackingCode = async () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  let code = `HM-${year}${month}${day}-${random}`;
  
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    const [rows] = await pool.query('SELECT id FROM orders WHERE tracking_code = ?', [code]);
    if (rows.length === 0) {
      exists = false;
    } else {
      const newRandom = Math.random().toString(36).substring(2, 8).toUpperCase();
      code = `HM-${year}${month}${day}-${newRandom}`;
      attempts++;
    }
  }
  return code;
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

// ============================================================
// ✅ createOrder اصلاح‌شده: قیمت اصلی از دیتابیس خوانده می‌شود
// ============================================================
const createOrder = async (userId, items, addressId, discountCodeId = null) => {
  logger.info('🔍 [orderService] شروع ثبت سفارش برای کاربر:', userId);
  
  if (!items || items.length === 0) {
    throw new AppError('سبد خرید خالی است', 400);
  }

  if (!addressId) {
    throw new AppError('لطفاً آدرس تحویل را انتخاب کنید', 400);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [address] = await connection.query(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [addressId, userId]
    );
    if (address.length === 0) {
      throw new AppError('آدرس انتخاب‌شده یافت نشد', 404);
    }

    let totalPrice = 0;
    const orderItems = [];
    const orderItemsForValidation = [];

    // ===== مرحله ۱: محاسبه قیمت هر آیتم (با تخفیف ویژه) =====
    for (const item of items) {
      const [product] = await connection.query(
        'SELECT id, name, price FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
        [item.id]
      );
      if (product.length === 0) {
        throw new AppError(`محصول با شناسه ${item.id} یافت نشد یا حذف شده است`, 404);
      }
      const productData = product[0];

      let availableStock = 0;
      const variationId = item.variation_id || null;
      let basePrice = parseFloat(productData.price) || 0;

      if (variationId) {
        const [variation] = await connection.query(
          'SELECT stock, price FROM product_variations WHERE id = ? AND product_id = ? FOR UPDATE',
          [variationId, item.id]
        );
        if (variation.length === 0) {
          throw new AppError(`ترکیب موردنظر برای محصول "${productData.name}" یافت نشد`, 404);
        }
        availableStock = Number(variation[0].stock) || 0;
        if (variation[0].price !== null) {
          basePrice = parseFloat(variation[0].price) || 0;
        }
        console.log(`🔍 [DEBUG] قیمت اصلی ترکیب ${variationId}: ${basePrice}`);
      } else {
        const [variationsResult] = await connection.query(
          'SELECT SUM(stock) as total FROM product_variations WHERE product_id = ?',
          [item.id]
        );
        availableStock = Number(variationsResult[0]?.total) || 0;
        console.log(`🔍 [DEBUG] قیمت اصلی محصول: ${basePrice}`);
      }

      if (availableStock < item.quantity) {
        throw new AppError(
          `موجودی محصول "${productData.name}" کافی نیست. موجودی: ${availableStock}`,
          400
        );
      }

      const discounts = await getDiscountsForProduct(item.id, variationId);
      const priceResult = getVariationFinalPrice(
        basePrice,
        discounts,
        variationId
      );
      const finalPrice = priceResult.finalPrice;
      const originalPrice = priceResult.originalPrice;

      console.log(`🔍 [DEBUG] قیمت اصلی: ${basePrice}, تخفیف ویژه: ${priceResult.discountPercent}% → قیمت نهایی: ${finalPrice}`);

      let attributeValuesJson = null;
      let colorValueId = item.color_value_id || null;
      let sizeValueId = item.size_value_id || null;

      if (variationId) {
        const [variation] = await connection.query(
          'SELECT attribute_values_json, color_value_id, size_value_id FROM product_variations WHERE id = ?',
          [variationId]
        );
        if (variation.length > 0) {
          if (variation[0].attribute_values_json) {
            attributeValuesJson = variation[0].attribute_values_json;
            if (typeof attributeValuesJson === 'object') {
              attributeValuesJson = JSON.stringify(attributeValuesJson);
            }
          }
          if (!colorValueId && variation[0].color_value_id) {
            colorValueId = variation[0].color_value_id;
          }
          if (!sizeValueId && variation[0].size_value_id) {
            sizeValueId = variation[0].size_value_id;
          }
        }
      }

      if (!attributeValuesJson && item.attribute_values_json) {
        attributeValuesJson = safeJsonStringify(item.attribute_values_json);
      }

      const itemTotalPrice = finalPrice * item.quantity;
      totalPrice += itemTotalPrice;

      orderItems.push({
        id: item.id,
        quantity: item.quantity,
        price: finalPrice,
        original_price: originalPrice,
        name: productData.name,
        color_value_id: colorValueId,
        size_value_id: sizeValueId,
        variation_id: variationId,
        attribute_values_json: attributeValuesJson,
        discount_applied: priceResult.discountApplied,
        discount_percent: priceResult.discountPercent,
      });

      orderItemsForValidation.push({
        product_id: item.id,
        variation_id: variationId,
        quantity: item.quantity,
        price: finalPrice,
      });
    }

    console.log(`🔍 [DEBUG] ===== مجموع قیمت بعد از تخفیف ویژه: ${totalPrice} =====`);

    // ===== مرحله ۲: محاسبه تخفیف کد =====
    let finalTotalPrice = totalPrice;
    let discountAmount = 0;
    let discountSnapshot = null;
    let discountCodeText = null;
    let discountTypeSnapshot = null;
    let discountValueSnapshot = null;

    if (discountCodeId) {
      try {
        const [discountRow] = await connection.query(
          'SELECT code, discount_type, discount_value FROM discount_codes WHERE id = ?',
          [discountCodeId]
        );
        if (discountRow.length > 0) {
          const discount = discountRow[0];
          
          const validationResult = await discountCodeService.validateDiscountCode(
            discount.code,
            orderItemsForValidation,
            totalPrice
          );
          
          discountAmount = validationResult.discountAmount;
          finalTotalPrice = Math.max(0, totalPrice - discountAmount);
          
          discountCodeText = discount.code;
          discountTypeSnapshot = discount.discount_type;
          discountValueSnapshot = discount.discount_value;
          discountSnapshot = JSON.stringify({
            code: discount.code,
            discount_type: discount.discount_type,
            discount_value: discount.discount_value,
            discount_amount: discountAmount,
          });
          
          logger.info(`✅ [orderService] تخفیف کد ${discount.code} با مبلغ ${discountAmount} اعمال شد`);
        }
      } catch (error) {
        logger.warn(`⚠️ [orderService] خطا در اعمال کد تخفیف: ${error.message}`);
        discountCodeId = null;
        discountAmount = 0;
      }
    }

    // ===== مرحله ۳: ثبت سفارش =====
    const trackingCode = await generateTrackingCode();

    const [orderResult] = await connection.query(
      `INSERT INTO orders 
       (user_id, address_id, total_price, status, tracking_code, 
        discount_code_id, discount_amount, is_admin_read,
        discount_code_snapshot, discount_code_text, discount_type_snapshot, discount_value_snapshot) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, addressId, finalTotalPrice, 'در انتظار پرداخت', trackingCode,
        discountCodeId || null, discountAmount || 0, false,
        discountSnapshot, discountCodeText, discountTypeSnapshot, discountValueSnapshot
      ]
    );
    const orderId = orderResult.insertId;

    // ===== مرحله ۴: ذخیره آیتم‌های سفارش و رزرو =====
    for (const item of orderItems) {
      await connection.query(
        `INSERT INTO order_items 
         (order_id, product_id, quantity, price, original_price, 
          color_value_id, size_value_id, variation_id, attribute_values_json) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.quantity,
          item.price,
          item.original_price,
          item.color_value_id,
          item.size_value_id,
          item.variation_id,
          item.attribute_values_json
        ]
      );

      await connection.query(
        `INSERT INTO reservations (order_id, product_id, quantity, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
        [orderId, item.id, item.quantity]
      );
    }

    await connection.commit();

    logger.info(`✅ سفارش جدید ثبت شد (ID: ${orderId}) توسط کاربر ${userId} - کد پیگیری: ${trackingCode}`);

    return {
      orderId,
      totalPrice: finalTotalPrice,
      itemsCount: orderItems.length,
      trackingCode,
      discountAmount,
    };
  } catch (error) {
    await connection.rollback();
    console.error('❌ خطا در ثبت سفارش:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.', 500);
  } finally {
    connection.release();
  }
};

// ===== اعمال کد تخفیف به سفارش موجود =====
const applyDiscountToOrder = async (orderId, code, userId) => {
  console.log(`📥 [applyDiscountToOrder] ===== شروع اعمال کد تخفیف ${code} به سفارش ${orderId} =====`);
  
  try {
    const [order] = await pool.query(
      'SELECT id, user_id, total_price, status, discount_code_id FROM orders WHERE id = ? AND deleted_at IS NULL',
      [orderId]
    );
    if (order.length === 0) {
      console.error(`❌ [applyDiscountToOrder] سفارش ${orderId} یافت نشد`);
      throw new AppError('سفارش یافت نشد', 404);
    }
    if (order[0].user_id !== userId) {
      console.error(`❌ [applyDiscountToOrder] کاربر ${userId} دسترسی به سفارش ${orderId} ندارد`);
      throw new AppError('دسترسی غیرمجاز', 403);
    }
    if (order[0].status !== 'در انتظار پرداخت') {
      console.error(`❌ [applyDiscountToOrder] سفارش ${orderId} در وضعیت ${order[0].status} است`);
      throw new AppError('فقط سفارش‌های در انتظار پرداخت قابل تغییر هستند', 400);
    }
    if (order[0].discount_code_id) {
      console.error(`❌ [applyDiscountToOrder] سفارش ${orderId} قبلاً کد تخفیف دارد`);
      throw new AppError('این سفارش قبلاً کد تخفیف دارد', 400);
    }

    const [items] = await pool.query(
      `SELECT product_id, variation_id, quantity, price 
       FROM order_items 
       WHERE order_id = ?`,
      [orderId]
    );
    console.log(`🔍 [applyDiscountToOrder] ${items.length} آیتم در سفارش ${orderId}`);

    let validationResult;
    try {
      validationResult = await discountCodeService.validateDiscountCode(
        code,
        items,
        order[0].total_price
      );
    } catch (error) {
      console.error('❌ [applyDiscountToOrder] خطا در اعتبارسنجی کد تخفیف:', error);
      throw new AppError(error.message || 'کد تخفیف نامعتبر است', 400);
    }

    const { discountCodeId, discountAmount, applicableItems, discount } = validationResult;
    const newTotal = Math.max(0, order[0].total_price - discountAmount);

    console.log(`💰 [applyDiscountToOrder] مبلغ تخفیف: ${discountAmount}, قیمت جدید: ${newTotal}`);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      await connection.query(
        `UPDATE orders SET 
          discount_code_id = ?, 
          discount_amount = ?, 
          total_price = ?,
          discount_code_text = ?,
          discount_type_snapshot = ?,
          discount_value_snapshot = ?,
          discount_code_snapshot = ?
         WHERE id = ?`,
        [
          discountCodeId, 
          discountAmount, 
          newTotal,
          discount.code,
          discount.discount_type,
          discount.discount_value,
          JSON.stringify({
            code: discount.code,
            discount_type: discount.discount_type,
            discount_value: discount.discount_value,
            discount_amount: discountAmount,
          }),
          orderId
        ]
      );
      await connection.commit();
      console.log(`✅ [applyDiscountToOrder] کد تخفیف ${code} با مبلغ ${discountAmount} به سفارش ${orderId} اعمال شد`);
    } catch (error) {
      await connection.rollback();
      console.error(`❌ [applyDiscountToOrder] خطا:`, error);
      throw new AppError('خطا در اعمال کد تخفیف', 500);
    } finally {
      connection.release();
    }

    return {
      discountAmount,
      newTotal,
      discount,
    };
  } catch (error) {
    console.error('❌ [applyDiscountToOrder] خطا:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('خطا در اعمال کد تخفیف', 500);
  }
};

// ===== تأیید پرداخت =====
const confirmPayment = async (orderId) => {
  logger.info(`🔍 [orderService] تأیید پرداخت سفارش ${orderId}`);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [order] = await connection.query(
      'SELECT id, status, user_id, discount_code_id FROM orders WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
      [orderId]
    );
    if (order.length === 0) {
      throw new AppError('سفارش یافت نشد', 404);
    }
    if (order[0].status === 'پرداخت شده') {
      throw new AppError('سفارش قبلاً پرداخت شده است', 400);
    }
    if (order[0].status === 'لغو شده') {
      throw new AppError('سفارش لغو شده است و قابل پرداخت نیست', 400);
    }

    const [items] = await connection.query(
      `SELECT order_items.product_id, order_items.quantity, order_items.variation_id,
              p.name as product_name
       FROM order_items
       JOIN products p ON order_items.product_id = p.id
       WHERE order_items.order_id = ?`,
      [orderId]
    );

    for (const item of items) {
      if (item.variation_id) {
        const [variation] = await connection.query(
          'SELECT stock FROM product_variations WHERE id = ? AND product_id = ? FOR UPDATE',
          [item.variation_id, item.product_id]
        );
        if (variation.length === 0) {
          throw new AppError(`ترکیب مربوط به محصول "${item.product_name}" یافت نشد`, 404);
        }
        if (variation[0].stock < item.quantity) {
          await connection.query(
            "UPDATE orders SET status = 'لغو شده' WHERE id = ?",
            [orderId]
          );
          throw new AppError(
            `موجودی ترکیب محصول "${item.product_name}" کافی نیست. موجودی: ${variation[0].stock}`,
            400
          );
        }
        await connection.query(
          'UPDATE product_variations SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [item.quantity, item.variation_id, item.quantity]
        );
      } else {
        const [product] = await connection.query(
          'SELECT stock FROM products WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
          [item.product_id]
        );
        if (product.length === 0) {
          throw new AppError(`محصول "${item.product_name}" یافت نشد`, 404);
        }
        if (product[0].stock < item.quantity) {
          await connection.query(
            "UPDATE orders SET status = 'لغو شده' WHERE id = ?",
            [orderId]
          );
          throw new AppError(
            `موجودی محصول "${item.product_name}" کافی نیست. موجودی: ${product[0].stock}`,
            400
          );
        }
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [item.quantity, item.product_id, item.quantity]
        );
      }
    }

    await connection.query(
      "UPDATE orders SET status = 'پرداخت شده', is_admin_read = false WHERE id = ?",
      [orderId]
    );

    await connection.query(
      'DELETE FROM reservations WHERE order_id = ?',
      [orderId]
    );

    const discountCodeId = order[0].discount_code_id;
    if (discountCodeId) {
      try {
        await discountCodeService.incrementUsedCount(discountCodeId);
      } catch (err) {
        console.error(`❌ [orderService] خطا در افزایش تعداد استفاده کد تخفیف ${discountCodeId}:`, err);
      }
    }

    await connection.commit();
    logger.info(`✅ پرداخت سفارش ${orderId} با موفقیت تأیید شد (is_admin_read = false)`);
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error(`❌ خطا در تأیید پرداخت سفارش ${orderId}:`, error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('خطا در تأیید پرداخت', 500);
  } finally {
    connection.release();
  }
};

// ===== لغو رزرو سفارش =====
const cancelReservation = async (orderId) => {
  logger.info(`🔍 [CancelReservation] شروع لغو رزرو سفارش ${orderId}`);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [order] = await connection.query(
      'SELECT id, status FROM orders WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
      [orderId]
    );
    if (order.length === 0) {
      throw new AppError('سفارش یافت نشد', 404);
    }
    
    if (order[0].status === 'پرداخت شده') {
      throw new AppError('سفارش پرداخت شده است و نمی‌توان آن را لغو کرد', 400);
    }

    if (order[0].status === 'لغو شده') {
      return;
    }

    await connection.query('DELETE FROM reservations WHERE order_id = ?', [orderId]);
    await connection.query("UPDATE orders SET status = 'لغو شده' WHERE id = ?", [orderId]);

    await connection.commit();
    logger.info(`✅ [CancelReservation] رزرو سفارش ${orderId} با موفقیت لغو شد`);
  } catch (error) {
    await connection.rollback();
    console.error(`❌ [CancelReservation] خطا در لغو رزرو سفارش ${orderId}:`, error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('خطا در لغو سفارش', 500);
  } finally {
    connection.release();
  }
};

// ===== پاکسازی رزروهای منقضی‌شده =====
const cleanupExpiredReservations = async () => {
  logger.info('🔍 [Cleanup] شروع پاکسازی رزروهای منقضی‌شده...');
  try {
    const [expiredReservations] = await pool.query(
      `SELECT r.order_id, r.expires_at, o.status, o.id
       FROM reservations r
       INNER JOIN orders o ON r.order_id = o.id
       WHERE r.expires_at < NOW() 
         AND o.deleted_at IS NULL
         AND o.status NOT IN ('لغو شده', 'پرداخت شده')`
    );

    if (expiredReservations && expiredReservations.length > 0) {
      const orderIds = expiredReservations.map(r => r.order_id);
      const placeholders = orderIds.map(() => '?').join(',');

      await pool.query(`DELETE FROM reservations WHERE order_id IN (${placeholders})`, orderIds);
      await pool.query(
        `UPDATE orders SET status = 'لغو شده' WHERE id IN (${placeholders}) AND status NOT IN ('لغو شده', 'پرداخت شده')`,
        orderIds
      );
    }

    const [pendingOrdersWithoutReservation] = await pool.query(
      `SELECT o.id, o.created_at
       FROM orders o
       LEFT JOIN reservations r ON o.id = r.order_id
       WHERE o.status = 'در انتظار پرداخت'
         AND o.deleted_at IS NULL
         AND (r.id IS NULL OR r.expires_at < NOW())
         AND o.created_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`
    );

    if (pendingOrdersWithoutReservation && pendingOrdersWithoutReservation.length > 0) {
      const orderIds = pendingOrdersWithoutReservation.map(o => o.id);
      const placeholders = orderIds.map(() => '?').join(',');
      await pool.query(`UPDATE orders SET status = 'لغو شده' WHERE id IN (${placeholders})`, orderIds);
    }

    logger.info(`✅ [Cleanup] پاکسازی کامل شد`);
  } catch (error) {
    console.error('❌ [Cleanup] خطا در پاکسازی رزروهای منقضی‌شده:', error);
  }
};

// ===== به‌روزرسانی وضعیت سفارش =====
const updateOrderStatus = async (orderId, status) => {
  const [result] = await pool.query(
    'UPDATE orders SET status = ? WHERE id = ? AND deleted_at IS NULL',
    [status, orderId]
  );
  if (result.affectedRows === 0) {
    throw new AppError('سفارش یافت نشد یا حذف شده است', 404);
  }
  return true;
};

// ============================================================
// ✅ دریافت جزئیات سفارش (اصلاح‌شده برای رنگ‌های سفارشی)
// ============================================================
const getOrderById = async (orderId, userId, userRole) => {
  const [orderRows] = await pool.query(
    `SELECT o.*, 
            a.province, a.city, a.address, a.postal_code, a.phone, a.receiver_name,
            u.name as user_name, u.email as user_email,
            (SELECT expires_at FROM reservations WHERE order_id = o.id LIMIT 1) as expires_at
     FROM orders o
     LEFT JOIN addresses a ON o.address_id = a.id
     JOIN users u ON o.user_id = u.id
     WHERE o.id = ? AND o.deleted_at IS NULL`,
    [orderId]
  );
  if (orderRows.length === 0) {
    throw new AppError('سفارش یافت نشد', 404);
  }
  const order = orderRows[0];

  if (order.user_id !== userId && userRole !== 'admin') {
    throw new AppError('دسترسی غیرمجاز', 403);
  }

  // ✅ اصلاح: دریافت آیتم‌های سفارش با استخراج رنگ از attribute_values_json
  const [items] = await pool.query(
    `SELECT 
      oi.*, 
      p.name as product_name, 
      p.image_url,
      cv.value as color_name,
      sv.value as size_name,
      fp.original_price as original_price,
      oi.attribute_values_json
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN attribute_values cv ON oi.color_value_id = cv.id
     LEFT JOIN attribute_values sv ON oi.size_value_id = sv.id
     LEFT JOIN featured_products fp ON fp.product_id = oi.product_id AND fp.type = 'discount' AND fp.deleted_at IS NULL
     WHERE oi.order_id = ?`,
    [orderId]
  );

  // ✅ استخراج نام رنگ از attribute_values_json برای آیتم‌هایی که color_value_id ندارند
  const itemsWithColor = items.map(item => {
    let finalColorName = item.color_name || null;
    
    // اگر color_name وجود ندارد، از attribute_values_json استخراج کن
    if (!finalColorName && item.attribute_values_json) {
      try {
        const attrs = typeof item.attribute_values_json === 'string'
          ? JSON.parse(item.attribute_values_json)
          : item.attribute_values_json;
        
        if (attrs && attrs['1']) {
          // مقدار کلید 1 می‌تواند نام رنگ یا id باشد
          const colorValue = attrs['1'];
          // اگر عددی بود، یعنی id است و از جدول attribute_values باید خوانده شود
          // اما چون در این مرحله فقط کوئری انجام شده، اگر color_name وجود ندارد، احتمالاً رنگ سفارشی است
          finalColorName = colorValue;
        }
      } catch (e) {
        // ignore
      }
    }

    return {
      ...item,
      color_name: finalColorName,
    };
  });

  return { ...order, items: itemsWithColor };
};

// ===== دریافت سفارشات کاربر (اصلاح‌شده برای رنگ‌های سفارشی) =====
const getUserOrders = async (userId) => {
  const [orders] = await pool.query(
    `SELECT o.id, o.total_price, o.status, o.created_at, o.tracking_code,
            (SELECT expires_at FROM reservations WHERE order_id = o.id LIMIT 1) as expires_at
     FROM orders o
     WHERE o.user_id = ? AND o.deleted_at IS NULL
     ORDER BY o.created_at DESC`,
    [userId]
  );

  for (const order of orders) {
    const [items] = await pool.query(
      `SELECT 
        oi.*, 
        p.name as product_name,
        cv.value as color_name,
        sv.value as size_name,
        oi.attribute_values_json
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       LEFT JOIN attribute_values cv ON oi.color_value_id = cv.id
       LEFT JOIN attribute_values sv ON oi.size_value_id = sv.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    // ✅ استخراج نام رنگ از attribute_values_json
    const itemsWithColor = items.map(item => {
      let finalColorName = item.color_name || null;
      
      if (!finalColorName && item.attribute_values_json) {
        try {
          const attrs = typeof item.attribute_values_json === 'string'
            ? JSON.parse(item.attribute_values_json)
            : item.attribute_values_json;
          
          if (attrs && attrs['1']) {
            finalColorName = attrs['1'];
          }
        } catch (e) {
          // ignore
        }
      }

      return {
        ...item,
        color_name: finalColorName,
      };
    });

    order.items = itemsWithColor;
  }

  return orders;
};

// ===== علامت‌گذاری سفارش به عنوان خوانده‌شده توسط ادمین (تکی) =====
const markOrderAsReadByAdmin = async (orderId) => {
  logger.info(`📖 [orderService] علامت‌گذاری سفارش ${orderId} به عنوان خوانده‌شده توسط ادمین`);
  const [result] = await pool.query(
    `UPDATE orders SET is_admin_read = true 
     WHERE id = ? AND status = 'پرداخت شده' AND is_admin_read = false`,
    [orderId]
  );
  if (result.affectedRows === 0) {
    throw new AppError('سفارش یافت نشد یا قبلاً خوانده شده است', 404);
  }
  logger.info(`✅ سفارش ${orderId} به عنوان خوانده‌شده علامت‌گذاری شد`);
  return result.affectedRows;
};

// ===== علامت‌گذاری همه سفارشات به عنوان خوانده‌شده (گروهی) =====
const markOrdersAsReadByAdmin = async () => {
  logger.info('📖 [orderService] علامت‌گذاری همه سفارشات پرداخت‌شده به عنوان خوانده‌شده توسط ادمین');
  const [result] = await pool.query(
    `UPDATE orders SET is_admin_read = true 
     WHERE status = 'پرداخت شده' AND is_admin_read = false`
  );
  logger.info(`✅ ${result.affectedRows} سفارش به عنوان خوانده‌شده علامت‌گذاری شد`);
  return result.affectedRows;
};

// ===== دریافت تعداد سفارشات خوانده‌نشده =====
const getUnreadOrdersCount = async () => {
  const [result] = await pool.query(
    `SELECT COUNT(*) as count FROM orders 
     WHERE status = 'پرداخت شده' AND is_admin_read = false AND deleted_at IS NULL`
  );
  return Number(result[0]?.count) || 0;
};

// ===== حذف نرم سفارش =====
const softDeleteOrder = async (orderId) => {
  const [order] = await pool.query('SELECT id FROM orders WHERE id = ? AND deleted_at IS NULL', [orderId]);
  if (order.length === 0) throw new AppError('سفارش یافت نشد', 404);
  await pool.query('UPDATE orders SET deleted_at = NOW() WHERE id = ?', [orderId]);
};

// ===== بازیابی سفارش از سطل زباله =====
const restoreOrder = async (orderId) => {
  const [order] = await pool.query('SELECT id FROM orders WHERE id = ? AND deleted_at IS NOT NULL', [orderId]);
  if (order.length === 0) throw new AppError('سفارش در سطل زباله یافت نشد', 404);
  await pool.query('UPDATE orders SET deleted_at = NULL WHERE id = ?', [orderId]);
};

// ===== حذف دائمی سفارش =====
const forceDeleteOrder = async (orderId) => {
  const [order] = await pool.query('SELECT id FROM orders WHERE id = ? AND deleted_at IS NOT NULL', [orderId]);
  if (order.length === 0) throw new AppError('سفارش در سطل زباله یافت نشد', 404);
  await pool.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
  await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
};

// ===== دریافت سفارشات سطل زباله =====
const getTrashedOrders = async () => {
  const [rows] = await pool.query(
    `SELECT o.*, u.name as user_name 
     FROM orders o 
     JOIN users u ON o.user_id = u.id 
     WHERE o.deleted_at IS NOT NULL 
     ORDER BY o.deleted_at DESC`
  );
  return rows;
};

module.exports = {
  createOrder,
  applyDiscountToOrder,
  confirmPayment,
  cancelReservation,
  cleanupExpiredReservations,
  updateOrderStatus,
  getOrderById,
  getUserOrders,
  softDeleteOrder,
  restoreOrder,
  forceDeleteOrder,
  getTrashedOrders,
  markOrderAsReadByAdmin,
  markOrdersAsReadByAdmin,
  getUnreadOrdersCount,
};