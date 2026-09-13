// backend/controllers/adminController.js
const logger = require("../utils/logger");
const adminService = require('../services/adminService');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const getStats = async (req, res, next) => {
  try {
    logger.info('🟢 [getStats] درخواست دریافت آمار');
    const data = await adminService.getStats();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ============================================================
// ✅ getAllReviews اصلاح‌شده: اضافه شدن product_slug
// ============================================================
const getAllReviews = async (req, res, next) => {
  try {
    logger.info('🟢 [getAllReviews] درخواست دریافت نظرات');
    const [rows] = await pool.query(
      `SELECT r.*, u.name as user_name, p.name as product_name, p.slug as product_slug
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       JOIN products p ON r.product_id = p.id 
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

// ============================================================
// ✅ getAllOrders اصلاح‌شده با is_admin_read
// ============================================================
const getAllOrders = async (req, res, next) => {
  try {
    logger.info('🟢 [getAllOrders] درخواست دریافت سفارشات');
    
    const [rows] = await pool.query(
      `SELECT o.*, u.name as user_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.deleted_at IS NULL
       ORDER BY o.created_at DESC`
    );

    const ordersWithDetails = await Promise.all(rows.map(async (order) => {
      const [items] = await pool.query(
        `SELECT 
          oi.*, 
          p.name as product_name,
          cv.value as color_name,
          sv.value as size_name,
          fp.original_price as original_price
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         LEFT JOIN attribute_values cv ON oi.color_value_id = cv.id
         LEFT JOIN attribute_values sv ON oi.size_value_id = sv.id
         LEFT JOIN featured_products fp ON fp.product_id = oi.product_id AND fp.type = 'discount' AND fp.deleted_at IS NULL
         WHERE oi.order_id = ?`,
        [order.id]
      );

      let originalTotalPrice = 0;
      let hasDiscount = false;
      
      items.forEach(item => {
        const price = item.price || 0;
        const originalPrice = item.original_price || price;
        originalTotalPrice += originalPrice * item.quantity;
        if (originalPrice > price) hasDiscount = true;
      });

      return {
        ...order,
        items,
        original_total_price: originalTotalPrice > 0 ? originalTotalPrice : null,
        has_discount: hasDiscount,
      };
    }));

    res.json({ success: true, data: ordersWithDetails });
  } catch (error) { 
    console.error('❌ [adminController] خطا در getAllOrders:', error);
    next(error); 
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    logger.info(`🟢 [updateOrderStatus] درخواست تغییر وضعیت سفارش ${id} به "${status}"`);

    const validStatuses = ['در انتظار پرداخت', 'پرداخت شده', 'ارسال شده', 'تحویل داده شده', 'لغو شده'];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError(`وضعیت نامعتبر است. مقادیر مجاز: ${validStatuses.join(', ')}`, 400);
    }

    await adminService.updateOrderStatus(id, status);
    res.json({ success: true, message: 'وضعیت سفارش به‌روزرسانی شد' });
  } catch (error) {
    if (error.code === 'ER_DATA_TOO_LONG' || error.sqlMessage?.includes('Data truncated')) {
      return next(new AppError('مقدار وضعیت با مقادیر مجاز در دیتابیس همخوانی ندارد. لطفاً مقدار صحیح را وارد کنید.', 400));
    }
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    logger.info(`🟢 [deleteOrder] درخواست حذف سفارش ${req.params.id}`);
    const { id } = req.params;
    const [order] = await pool.query('SELECT id FROM orders WHERE id = ? AND deleted_at IS NULL', [id]);
    if (order.length === 0) throw new AppError('سفارش یافت نشد', 404);
    await pool.query('UPDATE orders SET deleted_at = NOW() WHERE id = ?', [id]);
    logger.info(`🗑️ سفارش ${id} توسط ادمین ${req.user.userId} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'سفارش به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

logger.info('🟢 [adminController] تمام توابع تعریف شدند');

module.exports = {
  getStats,
  getAllReviews,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
};

logger.info('✅ [adminController] بارگذاری کامل شد');