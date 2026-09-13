const logger = require("../utils/logger");
// backend/services/userService.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * دریافت اطلاعات کاربر
 */
const getProfile = async (userId) => {
  const [users] = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (users.length === 0) {
    throw new AppError('کاربر یافت نشد', 404);
  }
  return users[0];
};

/**
 * دریافت تاریخچه سفارشات کاربر با زمان انقضا
 */
const getOrders = async (userId) => {
  const [orders] = await pool.query(
    `SELECT o.id, o.total_price, o.status, o.created_at,
            (SELECT expires_at FROM reservations WHERE order_id = o.id LIMIT 1) as expires_at
     FROM orders o
     WHERE o.user_id = ? 
     ORDER BY o.created_at DESC`,
    [userId]
  );

  // دریافت آیتم‌های هر سفارش
  for (const order of orders) {
    const [items] = await pool.query(
      `SELECT oi.*, p.name as product_name 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;
  }

  return orders;
};

module.exports = { getProfile, getOrders };