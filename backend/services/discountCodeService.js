// backend/services/discountCodeService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * تبدیل تاریخ به فرمت MySQL DATETIME
 */
const formatDateForMySQL = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0');
};

// ==================== توابع اصلی ====================

const getDiscountCodes = async () => {
  console.log('📥 [getDiscountCodes] شروع دریافت کدهای تخفیف');
  const [rows] = await pool.query(
    `SELECT dc.*, 
            (SELECT COUNT(DISTINCT product_id) FROM product_discount_code WHERE discount_code_id = dc.id) as product_count
     FROM discount_codes dc
     WHERE dc.deleted_at IS NULL
     ORDER BY dc.id DESC`
  );
  console.log(`✅ [getDiscountCodes] ${rows.length} کد تخفیف دریافت شد`);
  return rows;
};

const getDiscountCodeById = async (id) => {
  console.log(`📥 [getDiscountCodeById] دریافت کد تخفیف با ID: ${id}`);
  const [rows] = await pool.query(
    `SELECT * FROM discount_codes WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  if (rows.length === 0) throw new AppError('کد تخفیف یافت نشد', 404);
  console.log(`✅ [getDiscountCodeById] کد تخفیف ${id} دریافت شد`);
  return rows[0];
};

const getProductsForDiscountCode = async (discountCodeId) => {
  console.log(`📥 [getProductsForDiscountCode] دریافت محصولات کد تخفیف ${discountCodeId}`);
  const [rows] = await pool.query(
    `SELECT product_id, variation_id FROM product_discount_code WHERE discount_code_id = ?`,
    [discountCodeId]
  );
  console.log(`✅ [getProductsForDiscountCode] ${rows.length} محصول/ترکیب دریافت شد`);
  return rows;
};

/**
 * ✅ ایجاد کد تخفیف (اصلاح‌شده با بررسی سطل زباله و پیام خطای اختصاصی)
 */
const createDiscountCode = async (data) => {
  console.log('📥 [createDiscountCode] ===== شروع ایجاد کد تخفیف =====');
  console.log('📥 [createDiscountCode] داده دریافتی:', JSON.stringify(data, null, 2));

  const { 
    code, discount_type, discount_value, start_date, end_date, 
    usage_limit, product_ids, max_discount_amount, variation_ids 
  } = data;

  if (!code || !discount_type || !discount_value || !start_date) {
    throw new AppError('کد، نوع تخفیف، مقدار و تاریخ شروع الزامی است', 400);
  }

  const trimmedCode = code.trim().toUpperCase();

  // ✅ ۱. بررسی وجود کد در سطل زباله
  const [trashed] = await pool.query(
    'SELECT id FROM discount_codes WHERE code = ? AND deleted_at IS NOT NULL',
    [trimmedCode]
  );
  if (trashed.length > 0) {
    throw new AppError(
      `کد تخفیف "${trimmedCode}" قبلاً استفاده شده است و هم‌اکنون در سطل زباله قرار دارد. لطفاً ابتدا آن را بازیابی کنید یا به‌طور دائمی حذف کنید.`,
      409
    );
  }

  // ✅ ۲. بررسی تکراری بودن در کدهای فعال
  const [existing] = await pool.query(
    'SELECT id FROM discount_codes WHERE code = ? AND deleted_at IS NULL',
    [trimmedCode]
  );
  if (existing.length > 0) {
    throw new AppError(`کد تخفیف "${trimmedCode}" قبلاً وجود دارد.`, 409);
  }

  const formattedStart = formatDateForMySQL(start_date);
  const formattedEnd = end_date ? formatDateForMySQL(end_date) : null;

  if (!formattedStart) {
    throw new AppError('تاریخ شروع نامعتبر است', 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('📝 [createDiscountCode] درج کد تخفیف در جدول discount_codes');
    const [result] = await connection.query(
      `INSERT INTO discount_codes 
       (code, discount_type, discount_value, start_date, end_date, usage_limit, max_discount_amount, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trimmedCode,
        discount_type,
        discount_value,
        formattedStart,
        formattedEnd,
        usage_limit || null,
        max_discount_amount || null,
        true
      ]
    );
    const discountCodeId = result.insertId;
    console.log(`✅ [createDiscountCode] کد تخفیف با ID ${discountCodeId} ایجاد شد`);

    // ذخیره محصولات/ترکیبات مجاز
    if (product_ids && product_ids.length > 0) {
      console.log(`📝 [createDiscountCode] ذخیره ${product_ids.length} محصول/ترکیب`);
      const values = [];
      
      for (const productId of product_ids) {
        const productVariations = (variation_ids && variation_ids[productId]) 
          ? variation_ids[productId] 
          : [];

        console.log(`🔍 [createDiscountCode] محصول ${productId} - ترکیبات انتخاب‌شده:`, productVariations);

        if (productVariations.length > 0) {
          for (const variationId of productVariations) {
            const [valid] = await connection.query(
              'SELECT id FROM product_variations WHERE id = ? AND product_id = ?',
              [variationId, productId]
            );
            if (valid.length === 0) {
              console.error(`❌ [createDiscountCode] ترکیب ${variationId} برای محصول ${productId} معتبر نیست`);
              throw new AppError(`ترکیب ${variationId} برای محصول ${productId} معتبر نیست`, 400);
            }
            values.push([discountCodeId, productId, variationId]);
          }
        } else {
          console.log(`🔍 [createDiscountCode] محصول ${productId} - بدون ترکیب (کل محصول مجاز)`);
          values.push([discountCodeId, productId, null]);
        }
      }

      if (values.length > 0) {
        console.log(`📝 [createDiscountCode] درج ${values.length} رکورد در product_discount_code`);
        await connection.query(
          `INSERT INTO product_discount_code (discount_code_id, product_id, variation_id) VALUES ?`,
          [values]
        );
        console.log(`✅ [createDiscountCode] ${values.length} رکورد در product_discount_code درج شد`);
      }
    }

    await connection.commit();
    console.log(`✅ [createDiscountCode] کد تخفیف ${trimmedCode} با موفقیت ایجاد شد (ID: ${discountCodeId})`);
    logger.info(`🎫 کد تخفیف جدید ایجاد شد: ${trimmedCode} (ID: ${discountCodeId})`);
    return { id: discountCodeId, ...data };
  } catch (error) {
    await connection.rollback();
    console.error(`❌ [createDiscountCode] خطا:`, error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * ✅ ویرایش کد تخفیف (اصلاح‌شده با بررسی سطل زباله و پیام خطای اختصاصی)
 */
const updateDiscountCode = async (id, data) => {
  console.log(`📥 [updateDiscountCode] ===== شروع ویرایش کد تخفیف ${id} =====`);
  console.log('📥 [updateDiscountCode] داده دریافتی:', JSON.stringify(data, null, 2));

  const { 
    code, discount_type, discount_value, start_date, end_date, 
    usage_limit, is_active, product_ids, max_discount_amount, variation_ids 
  } = data;

  const [existing] = await pool.query(
    'SELECT id FROM discount_codes WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (existing.length === 0) {
    throw new AppError('کد تخفیف یافت نشد', 404);
  }

  if (code) {
    const trimmedCode = code.trim().toUpperCase();
    
    // ✅ ۱. بررسی وجود کد در سطل زباله (به جز خود آیتم)
    const [trashed] = await pool.query(
      'SELECT id FROM discount_codes WHERE code = ? AND id != ? AND deleted_at IS NOT NULL',
      [trimmedCode, id]
    );
    if (trashed.length > 0) {
      throw new AppError(
        `کد تخفیف "${trimmedCode}" قبلاً استفاده شده است و هم‌اکنون در سطل زباله قرار دارد. لطفاً ابتدا آن را بازیابی کنید یا به‌طور دائمی حذف کنید.`,
        409
      );
    }
    
    // ✅ ۲. بررسی تکراری بودن در کدهای فعال
    const [duplicate] = await pool.query(
      'SELECT id FROM discount_codes WHERE code = ? AND id != ? AND deleted_at IS NULL',
      [trimmedCode, id]
    );
    if (duplicate.length > 0) {
      throw new AppError(`کد تخفیف "${trimmedCode}" قبلاً وجود دارد.`, 409);
    }
  }

  const formattedStart = start_date ? formatDateForMySQL(start_date) : undefined;
  const formattedEnd = end_date ? formatDateForMySQL(end_date) : null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log(`📝 [updateDiscountCode] به‌روزرسانی جدول discount_codes برای ID ${id}`);
    await connection.query(
      `UPDATE discount_codes SET 
        code = COALESCE(?, code),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        start_date = COALESCE(?, start_date),
        end_date = ?,
        usage_limit = ?,
        max_discount_amount = COALESCE(?, max_discount_amount),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [code, discount_type, discount_value, formattedStart, formattedEnd, usage_limit || null, max_discount_amount || null, is_active, id]
    );
    console.log(`✅ [updateDiscountCode] discount_codes به‌روزرسانی شد`);

    // به‌روزرسانی محصولات/ترکیبات مجاز
    if (product_ids !== undefined) {
      console.log(`📝 [updateDiscountCode] حذف رکوردهای قبلی product_discount_code برای ID ${id}`);
      await connection.query(
        'DELETE FROM product_discount_code WHERE discount_code_id = ?',
        [id]
      );
      console.log(`✅ [updateDiscountCode] رکوردهای قبلی حذف شدند`);

      if (product_ids && product_ids.length > 0) {
        console.log(`📝 [updateDiscountCode] درج ${product_ids.length} محصول/ترکیب جدید`);
        const values = [];
        
        for (const productId of product_ids) {
          const productVariations = (variation_ids && variation_ids[productId]) 
            ? variation_ids[productId] 
            : [];

          console.log(`🔍 [updateDiscountCode] محصول ${productId} - ترکیبات انتخاب‌شده:`, productVariations);

          if (productVariations.length > 0) {
            for (const variationId of productVariations) {
              const [valid] = await connection.query(
                'SELECT id FROM product_variations WHERE id = ? AND product_id = ?',
                [variationId, productId]
              );
              if (valid.length === 0) {
                console.error(`❌ [updateDiscountCode] ترکیب ${variationId} برای محصول ${productId} معتبر نیست`);
                throw new AppError(`ترکیب ${variationId} برای محصول ${productId} معتبر نیست`, 400);
              }
              values.push([id, productId, variationId]);
            }
          } else {
            console.log(`🔍 [updateDiscountCode] محصول ${productId} - بدون ترکیب (کل محصول مجاز)`);
            values.push([id, productId, null]);
          }
        }

        if (values.length > 0) {
          console.log(`📝 [updateDiscountCode] درج ${values.length} رکورد در product_discount_code`);
          await connection.query(
            `INSERT INTO product_discount_code (discount_code_id, product_id, variation_id) VALUES ?`,
            [values]
          );
          console.log(`✅ [updateDiscountCode] ${values.length} رکورد در product_discount_code درج شد`);
        }
      }
    }

    await connection.commit();
    console.log(`✅ [updateDiscountCode] کد تخفیف ${id} با موفقیت ویرایش شد`);
    logger.info(`✏️ کد تخفیف ${id} ویرایش شد`);
    return { id, ...data };
  } catch (error) {
    await connection.rollback();
    console.error(`❌ [updateDiscountCode] خطا:`, error);
    throw error;
  } finally {
    connection.release();
  }
};

const softDeleteDiscountCode = async (id) => {
  console.log(`📥 [softDeleteDiscountCode] حذف نرم کد تخفیف ${id}`);
  const [existing] = await pool.query(
    'SELECT id FROM discount_codes WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (existing.length === 0) throw new AppError('کد تخفیف یافت نشد', 404);
  await pool.query('UPDATE discount_codes SET deleted_at = NOW() WHERE id = ?', [id]);
  console.log(`✅ [softDeleteDiscountCode] کد تخفیف ${id} به سطل زباله منتقل شد`);
  logger.info(`🗑️ کد تخفیف ${id} به سطل زباله منتقل شد`);
};

const restoreDiscountCode = async (id) => {
  console.log(`📥 [restoreDiscountCode] بازیابی کد تخفیف ${id}`);
  const [existing] = await pool.query(
    'SELECT id, code FROM discount_codes WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  if (existing.length === 0) throw new AppError('کد تخفیف در سطل زباله یافت نشد', 404);
  
  // ✅ بررسی تکراری نبودن کد در کدهای فعال
  const [duplicate] = await pool.query(
    'SELECT id FROM discount_codes WHERE code = ? AND deleted_at IS NULL',
    [existing[0].code]
  );
  if (duplicate.length > 0) {
    throw new AppError(
      `کد تخفیف "${existing[0].code}" هم‌اکنون در سیستم وجود دارد. لطفاً ابتدا آن را حذف کنید یا کد را تغییر دهید.`,
      409
    );
  }
  
  await pool.query('UPDATE discount_codes SET deleted_at = NULL WHERE id = ?', [id]);
  console.log(`✅ [restoreDiscountCode] کد تخفیف ${id} بازیابی شد`);
  logger.info(`♻️ کد تخفیف ${id} بازیابی شد`);
};

const forceDeleteDiscountCode = async (id) => {
  console.log(`📥 [forceDeleteDiscountCode] حذف دائمی کد تخفیف ${id}`);
  const [existing] = await pool.query(
    'SELECT id FROM discount_codes WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  if (existing.length === 0) {
    throw new AppError('کد تخفیف در سطل زباله یافت نشد', 404);
  }
  
  // ✅ بررسی وجود سفارشات پرداخت‌شده با این کد تخفیف (اختیاری - برای یکپارچگی)
  const [paidOrders] = await pool.query(
    'SELECT id FROM orders WHERE discount_code_id = ? AND status = "پرداخت شده" AND deleted_at IS NULL',
    [id]
  );
  if (paidOrders.length > 0) {
    // فقط هشدار لاگ می‌دهیم اما اجازه حذف می‌دهیم (چون snapshot داریم)
    console.warn(`⚠️ [forceDeleteDiscountCode] کد ${id} در ${paidOrders.length} سفارش پرداخت‌شده استفاده شده است.`);
  }
  
  await pool.query('DELETE FROM product_discount_code WHERE discount_code_id = ?', [id]);
  await pool.query('DELETE FROM discount_codes WHERE id = ?', [id]);
  
  console.log(`✅ [forceDeleteDiscountCode] کد تخفیف ${id} برای همیشه حذف شد`);
  logger.info(`💀 کد تخفیف ${id} برای همیشه حذف شد`);
};

const getTrashedDiscountCodes = async () => {
  console.log('📥 [getTrashedDiscountCodes] دریافت کدهای تخفیف سطل زباله');
  const [rows] = await pool.query(
    `SELECT dc.*, 
            (SELECT COUNT(*) FROM product_discount_code WHERE discount_code_id = dc.id) as product_count
     FROM discount_codes dc
     WHERE dc.deleted_at IS NOT NULL
     ORDER BY dc.deleted_at DESC`
  );
  console.log(`✅ [getTrashedDiscountCodes] ${rows.length} کد تخفیف در سطل زباله`);
  return rows;
};

/**
 * ✅ اعتبارسنجی کد تخفیف (با محاسبه سقف تخفیف)
 */
const validateDiscountCode = async (code, items, totalAmount) => {
  console.log(`📥 [validateDiscountCode] ===== شروع اعتبارسنجی کد ${code} =====`);
  console.log(`📥 [validateDiscountCode] تعداد آیتم‌ها: ${items?.length || 0}`);
  console.log(`📥 [validateDiscountCode] totalAmount: ${totalAmount}`);

  try {
    // ۱. پیدا کردن کد تخفیف
    const [rows] = await pool.query(
      `SELECT * FROM discount_codes 
       WHERE code = ? AND deleted_at IS NULL AND is_active = TRUE 
         AND (usage_limit IS NULL OR used_count < usage_limit)
         AND start_date <= NOW() 
         AND (end_date IS NULL OR end_date >= NOW())`,
      [code]
    );
    if (rows.length === 0) {
      console.error(`❌ [validateDiscountCode] کد تخفیف ${code} نامعتبر یا منقضی شده است`);
      throw new AppError('کد تخفیف نامعتبر یا منقضی شده است', 400);
    }
    const discount = rows[0];
    console.log(`✅ [validateDiscountCode] کد تخفیف ${discount.id} معتبر است`);

    // ۲. دریافت محصولات/ترکیبات مجاز
    const [allowed] = await pool.query(
      `SELECT product_id, variation_id FROM product_discount_code WHERE discount_code_id = ?`,
      [discount.id]
    );
    console.log(`🔍 [validateDiscountCode] ${allowed.length} رکورد مجاز برای کد تخفیف ${discount.id}`);

    // ساخت allowedMap
    const allowedMap = {};
    allowed.forEach(row => {
      if (row.variation_id === null) {
        allowedMap[`${row.product_id}-all`] = true;
      } else {
        const key = `${row.product_id}-${row.variation_id}`;
        allowedMap[key] = true;
      }
    });
    console.log(`🔍 [validateDiscountCode] allowedMap:`, allowedMap);

    // ۴. بررسی آیتم‌های سبد خرید
    let applicableItems = [];
    let applicableTotal = 0;

    for (const item of items) {
      const productId = item.product_id || item.id;
      const variationId = item.variation_id || null;
      const key = `${productId}-${variationId === null ? 'all' : variationId}`;
      
      const isApplicable = allowedMap[key] === true;
      
      console.log(`🔍 [validateDiscountCode] محصول ${productId} (ترکیب: ${variationId || 'همه'}) - ${isApplicable ? '✅ مشمول' : '❌ غیرمشمول'}`);

      if (isApplicable) {
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 1;
        applicableItems.push(item);
        applicableTotal += itemPrice * itemQuantity;
      }
    }

    if (applicableItems.length === 0) {
      console.error(`❌ [validateDiscountCode] هیچ محصولی در سبد خرید مشمول این کد تخفیف نیست`);
      throw new AppError('این کد تخفیف برای محصولات سبد خرید شما معتبر نیست', 400);
    }

    console.log(`✅ [validateDiscountCode] ${applicableItems.length} آیتم مشمول تخفیف با مجموع ${applicableTotal}`);

    // ۵. محاسبه تخفیف
    let discountAmount = 0;
    if (discount.discount_type === 'percent') {
      discountAmount = applicableTotal * (discount.discount_value / 100);
    } else {
      discountAmount = Math.min(discount.discount_value, applicableTotal);
    }
    discountAmount = Math.round(discountAmount);
    console.log(`💰 [validateDiscountCode] تخفیف محاسبه‌شده: ${discountAmount}`);

    // ۶. اعمال سقف تخفیف
    if (discount.max_discount_amount !== null && discountAmount > discount.max_discount_amount) {
      console.log(`⚠️ [validateDiscountCode] تخفیف ${discountAmount} بیشتر از سقف ${discount.max_discount_amount} است. اعمال سقف...`);
      discountAmount = discount.max_discount_amount;
    }

    console.log(`✅ [validateDiscountCode] تخفیف نهایی: ${discountAmount}`);
    console.log(`📤 [validateDiscountCode] ===== پایان اعتبارسنجی =====`);

    return {
      discountCodeId: discount.id,
      discountAmount: discountAmount,
      applicableItems,
      applicableTotal,
      discount,
    };
  } catch (error) {
    console.error('❌ [validateDiscountCode] خطا:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('خطا در اعتبارسنجی کد تخفیف', 500);
  }
};

const incrementUsedCount = async (discountCodeId) => {
  console.log(`📥 [incrementUsedCount] افزایش تعداد استفاده کد ${discountCodeId}`);
  try {
    const [result] = await pool.query(
      'UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?',
      [discountCodeId]
    );
    console.log(`✅ [incrementUsedCount] تعداد استفاده کد ${discountCodeId} افزایش یافت. affectedRows: ${result.affectedRows}`);
    return result;
  } catch (error) {
    console.error(`❌ [incrementUsedCount] خطا در افزایش تعداد استفاده کد ${discountCodeId}:`, error);
    throw error;
  }
};

module.exports = {
  getDiscountCodes,
  getDiscountCodeById,
  getProductsForDiscountCode,
  createDiscountCode,
  updateDiscountCode,
  softDeleteDiscountCode,
  restoreDiscountCode,
  forceDeleteDiscountCode,
  getTrashedDiscountCodes,
  validateDiscountCode,
  incrementUsedCount,
};