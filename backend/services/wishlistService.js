const logger = require("../utils/logger");
// backend/services/wishlistService.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * دریافت لیست علاقه‌مندی‌های کاربر
 */
const getWishlist = async (userId) => {
  const [rows] = await pool.query(
    `SELECT p.* 
     FROM wishlist w 
     JOIN products p ON w.product_id = p.id 
     WHERE w.user_id = ? 
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
};

/**
 * اضافه کردن به علاقه‌مندی‌ها
 */
const addToWishlist = async (userId, productId) => {
  if (!productId) {
    throw new AppError('شناسه محصول الزامی است', 400);
  }

  const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [productId]);
  if (product.length === 0) {
    throw new AppError('محصول یافت نشد', 404);
  }

  const [existing] = await pool.query(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  if (existing.length > 0) {
    throw new AppError('محصول قبلاً به لیست اضافه شده است', 400);
  }

  await pool.query(
    'INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)',
    [userId, productId]
  );

  logger.info(`❤️ محصول ${productId} به لیست علاقه‌مندی‌های کاربر ${userId} اضافه شد`);
};

/**
 * حذف از علاقه‌مندی‌ها
 */
const removeFromWishlist = async (userId, productId) => {
  const [result] = await pool.query(
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  if (result.affectedRows === 0) {
    throw new AppError('محصول در لیست یافت نشد', 404);
  }
  logger.info(`💔 محصول ${productId} از لیست علاقه‌مندی‌های کاربر ${userId} حذف شد`);
};

/**
 * بررسی وجود محصول در لیست علاقه‌مندی‌ها
 */
const checkInWishlist = async (userId, productId) => {
  const [rows] = await pool.query(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return rows.length > 0;
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
};