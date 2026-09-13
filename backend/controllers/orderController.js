// backend/controllers/orderController.js
const logger = require("../utils/logger");
const orderService = require('../services/orderService');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * ثبت سفارش جدید
 * ✅ کاملاً مستقل از discountAmount ارسالی از فرانت‌اند
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { items, addressId, discountCodeId } = req.body; // ❌ discountAmount حذف شد

    logger.info('🔍 [orderController] ===== درخواست ثبت سفارش =====');
    logger.info('🔍 [orderController] addressId:', addressId);
    logger.info('🔍 [orderController] discountCodeId:', discountCodeId);

    if (!addressId) {
      throw new AppError('لطفاً آدرس تحویل را انتخاب کنید', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('سبد خرید خالی است', 400);
    }

    // ✅ اعتبارسنجی discountCodeId - اگر نامعتبر بود، null کن
    let finalDiscountCodeId = null;
    if (discountCodeId) {
      const [discount] = await pool.query(
        'SELECT id FROM discount_codes WHERE id = ? AND deleted_at IS NULL AND is_active = 1',
        [discountCodeId]
      );
      if (discount.length > 0) {
        finalDiscountCodeId = discountCodeId;
        logger.info(`✅ [orderController] کد تخفیف ${discountCodeId} معتبر است`);
      } else {
        logger.warn(`⚠️ [orderController] کد تخفیف ${discountCodeId} نامعتبر است. نادیده گرفته شد.`);
      }
    }

    // ✅ سرویس خودش همه چیز را محاسبه می‌کند
    const result = await orderService.createOrder(
      userId,
      items,
      addressId,
      finalDiscountCodeId
    );

    logger.info('✅ [orderController] سفارش با موفقیت ثبت شد:', result.orderId);

    res.status(201).json({
      success: true,
      message: 'سفارش با موفقیت ثبت شد. لطفاً پرداخت را تکمیل کنید.',
      orderId: result.orderId,
      totalPrice: result.totalPrice,
      itemsCount: result.itemsCount,
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    console.error('❌ [orderController] خطا در ثبت سفارش:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.', 500));
  }
};

/**
 * اعمال کد تخفیف به سفارش موجود
 */
const applyDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { code } = req.body;

    logger.info(`🔍 [orderController] اعمال کد تخفیف به سفارش ${id}`);
    logger.info(`🔍 [orderController] کد: ${code}`);

    if (!code) {
      throw new AppError('لطفاً کد تخفیف را وارد کنید', 400);
    }

    const result = await orderService.applyDiscountToOrder(id, code, userId);

    res.json({
      success: true,
      message: 'کد تخفیف با موفقیت اعمال شد',
      data: {
        discountAmount: result.discountAmount,
        newTotal: result.newTotal,
        discount: result.discount,
      }
    });
  } catch (error) {
    console.error(`❌ [orderController] خطا در اعمال کد تخفیف به سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در اعمال کد تخفیف', 500));
  }
};

/**
 * تأیید پرداخت (کاهش موجودی واقعی و افزایش تعداد استفاده کد)
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`🔍 [orderController] تأیید پرداخت سفارش ${id}`);
    await orderService.confirmPayment(id);

    res.json({
      success: true,
      message: 'پرداخت با موفقیت تأیید شد و موجودی به‌روزرسانی شد',
    });
  } catch (error) {
    console.error(`❌ [orderController] خطا در تأیید پرداخت سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در تأیید پرداخت', 500));
  }
};

/**
 * لغو سفارش (برای کاربر)
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`🔍 [orderController] لغو سفارش ${id}`);
    await orderService.cancelReservation(id);

    res.json({
      success: true,
      message: 'سفارش با موفقیت لغو شد',
    });
  } catch (error) {
    console.error(`❌ [orderController] خطا در لغو سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در لغو سفارش', 500));
  }
};

/**
 * به‌روزرسانی وضعیت سفارش (برای ادمین)
 */
const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    logger.info(`🔍 [orderController] تغییر وضعیت سفارش ${id} به ${status}`);
    await orderService.updateOrderStatus(id, status);

    res.json({
      success: true,
      message: 'وضعیت سفارش به‌روزرسانی شد',
    });
  } catch (error) {
    console.error(`❌ [orderController] خطا در تغییر وضعیت سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در تغییر وضعیت سفارش', 500));
  }
};

/**
 * دریافت جزئیات یک سفارش (با آیتم‌ها و آدرس)
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    logger.info(`🔍 [orderController] دریافت جزئیات سفارش ${id} توسط کاربر ${userId}`);

    const order = await orderService.getOrderById(id, userId, userRole);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error(`❌ [orderController] خطا در دریافت جزئیات سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در دریافت جزئیات سفارش', 500));
  }
};

// ================================================================
// ✅ علامت‌گذاری یک سفارش به عنوان خوانده‌شده توسط ادمین (تکی)
// ================================================================
const markOrderAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📖 [orderController] علامت‌گذاری سفارش ${id} به عنوان خوانده‌شده توسط ادمین`);
    await orderService.markOrderAsReadByAdmin(id);
    res.json({
      success: true,
      message: `سفارش ${id} به عنوان خوانده‌شده علامت‌گذاری شد`,
    });
  } catch (error) {
    console.error('❌ [orderController] خطا در علامت‌گذاری سفارش:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در علامت‌گذاری سفارش', 500));
  }
};

// ================================================================
// ✅ علامت‌گذاری همه سفارشات به عنوان خوانده‌شده (گروهی)
// ================================================================
const markOrdersAsRead = async (req, res, next) => {
  try {
    logger.info(`📖 [orderController] علامت‌گذاری سفارشات به عنوان خوانده‌شده توسط ادمین`);
    const count = await orderService.markOrdersAsReadByAdmin();
    res.json({
      success: true,
      message: `${count} سفارش به عنوان خوانده‌شده علامت‌گذاری شد`,
      data: { markedCount: count }
    });
  } catch (error) {
    console.error('❌ [orderController] خطا در علامت‌گذاری سفارشات:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در علامت‌گذاری سفارشات', 500));
  }
};

// ================================================================
// 🗑️ توابع سطل زباله
// ================================================================

const softDeleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`🔍 [orderController] حذف نرم سفارش ${id}`);
    await orderService.softDeleteOrder(id);
    logger.info(`🗑️ سفارش ${id} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'سفارش به سطل زباله منتقل شد' });
  } catch (error) {
    console.error(`❌ [orderController] خطا در حذف نرم سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در حذف سفارش', 500));
  }
};

const restoreOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`🔍 [orderController] بازیابی سفارش ${id}`);
    await orderService.restoreOrder(id);
    logger.info(`♻️ سفارش ${id} بازیابی شد`);
    res.json({ success: true, message: 'سفارش بازیابی شد' });
  } catch (error) {
    console.error(`❌ [orderController] خطا در بازیابی سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در بازیابی سفارش', 500));
  }
};

const forceDeleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`🔍 [orderController] حذف دائمی سفارش ${id}`);
    await orderService.forceDeleteOrder(id);
    logger.info(`💀 سفارش ${id} برای همیشه حذف شد`);
    res.json({ success: true, message: 'سفارش برای همیشه حذف شد' });
  } catch (error) {
    console.error(`❌ [orderController] خطا در حذف دائمی سفارش ${req.params.id}:`, error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در حذف دائمی سفارش', 500));
  }
};

const getTrashedOrders = async (req, res, next) => {
  try {
    logger.info('🔍 [orderController] دریافت سفارشات سطل زباله');
    const rows = await orderService.getTrashedOrders();
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('❌ [orderController] خطا در دریافت سفارشات سطل زباله:', error);
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('خطا در دریافت سفارشات سطل زباله', 500));
  }
};

module.exports = {
  createOrder,
  applyDiscount,
  confirmPayment,
  cancelOrder,
  updateOrder,
  getOrderById,
  softDeleteOrder,
  restoreOrder,
  forceDeleteOrder,
  getTrashedOrders,
  markOrderAsRead,
  markOrdersAsRead,
};