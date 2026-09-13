const logger = require("../utils/logger");
// backend/services/adminService.js
logger.info('🔵 [adminService] در حال بارگذاری...');

const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

logger.info('🔵 [adminService] وابستگی‌ها بارگذاری شدند');

const getStats = async () => {
  logger.info('🟢 [getStats] اجرا');
  const [users] = await pool.query('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL');
  const [products] = await pool.query('SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL');
  const [orders] = await pool.query('SELECT COUNT(*) as total FROM orders WHERE deleted_at IS NULL');
  const [reviews] = await pool.query('SELECT COUNT(*) as total FROM reviews WHERE deleted_at IS NULL');
  const [totalSales] = await pool.query('SELECT SUM(total_price) as total FROM orders WHERE status != "لغو شده" AND deleted_at IS NULL');
  const [recentOrders] = await pool.query(
    'SELECT id, total_price, status, created_at FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5'
  );

  return {
    users: users[0]?.total || 0,
    products: products[0]?.total || 0,
    orders: orders[0]?.total || 0,
    reviews: reviews[0]?.total || 0,
    totalSales: totalSales[0]?.total || 0,
    recentOrders,
  };
};

const getAllReviews = async () => {
  logger.info('🟢 [getAllReviews] اجرا');
  const [rows] = await pool.query(
    `SELECT r.*, u.name as user_name, p.name as product_name 
     FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id 
     WHERE r.deleted_at IS NULL
     ORDER BY r.created_at DESC`
  );
  return rows;
};

const getAllOrders = async () => {
  logger.info('🟢 [getAllOrders] اجرا');
  const [rows] = await pool.query(
    `SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.deleted_at IS NULL ORDER BY o.created_at DESC`
  );
  return rows;
};

const updateOrderStatus = async (orderId, status) => {
  logger.info(`🟢 [updateOrderStatus] اجرا برای سفارش ${orderId} با وضعیت "${status}"`);

  // بررسی وجود سفارش
  const [order] = await pool.query(
    'SELECT id, status FROM orders WHERE id = ? AND deleted_at IS NULL',
    [orderId]
  );
  if (order.length === 0) {
    throw new AppError('سفارش یافت نشد', 404);
  }

  try {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    if (result.affectedRows === 0) {
      throw new AppError('خطا در به‌روزرسانی وضعیت سفارش', 500);
    }
    logger.info(`📋 وضعیت سفارش ${orderId} به "${status}" تغییر کرد`);
    return true;
  } catch (error) {
    // اگر خطای ENUM رخ داد، پیام واضح بده
    if (error.code === 'ER_DATA_TOO_LONG' || error.sqlMessage?.includes('Data truncated')) {
      throw new AppError('مقدار وضعیت در دیتابیس مجاز نیست. لطفاً از مقادیر صحیح استفاده کنید.', 400);
    }
    throw error;
  }
};

logger.info('✅ [adminService] توابع تعریف شدند');

module.exports = { getStats, getAllReviews, getAllOrders, updateOrderStatus };

logger.info('✅ [adminService] بارگذاری کامل شد');