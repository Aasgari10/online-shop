// backend/services/categoryService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ===== دریافت همه دسته‌بندی‌های فعال =====
const getAllCategories = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC'
  );
  return rows;
};

// ===== دریافت دسته‌بندی‌های سطل زباله =====
const getTrashedCategories = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  );
  return rows;
};

// ===== دریافت دسته‌بندی با شناسه =====
const getCategoryById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (rows.length === 0) throw new AppError('دسته‌بندی یافت نشد', 404);
  return rows[0];
};

// ===== ایجاد دسته‌بندی جدید (✅ اصلاح‌شده) =====
const createCategory = async (name) => {
  if (!name || name.trim() === '') {
    throw new AppError('نام دسته‌بندی الزامی است', 400);
  }
  
  const trimmedName = name.trim();
  
  // بررسی تکراری نبودن نام
  const [existing] = await pool.query(
    'SELECT id FROM categories WHERE name = ? AND deleted_at IS NULL',
    [trimmedName]
  );
  if (existing.length > 0) {
    throw new AppError('این دسته‌بندی قبلاً وجود دارد', 409);
  }
  
  // ✅ اصلاح: اضافه کردن keywords با مقدار NULL
  const [result] = await pool.query(
    'INSERT INTO categories (name, keywords) VALUES (?, ?)',
    [trimmedName, null]
  );
  
  logger.info(`📂 دسته‌بندی جدید ایجاد شد: ${trimmedName} (ID: ${result.insertId})`);
  return { id: result.insertId, name: trimmedName };
};

// ===== ویرایش دسته‌بندی =====
const updateCategory = async (id, newName) => {
  if (!newName || newName.trim() === '') {
    throw new AppError('نام دسته‌بندی الزامی است', 400);
  }
  
  const trimmedName = newName.trim();
  
  const [existing] = await pool.query(
    'SELECT id FROM categories WHERE name = ? AND id != ? AND deleted_at IS NULL',
    [trimmedName, id]
  );
  if (existing.length > 0) {
    throw new AppError('این نام قبلاً توسط دسته‌بندی دیگری استفاده شده است', 409);
  }
  
  const [result] = await pool.query(
    'UPDATE categories SET name = ? WHERE id = ? AND deleted_at IS NULL',
    [trimmedName, id]
  );
  if (result.affectedRows === 0) throw new AppError('دسته‌بندی یافت نشد', 404);
  
  logger.info(`✏️ دسته‌بندی ${id} به "${trimmedName}" تغییر یافت`);
  return { id, name: trimmedName };
};

// ===== حذف نرم =====
const deleteCategory = async (id) => {
  logger.info(`🔥 [categoryService] deleteCategory - شروع برای id: ${id}`);
  
  const [products] = await pool.query(
    'SELECT id FROM products WHERE category_id = ? AND deleted_at IS NULL',
    [id]
  );
  
  if (products.length > 0) {
    await pool.query(
      'UPDATE products SET deleted_at = NOW() WHERE category_id = ? AND deleted_at IS NULL',
      [id]
    );
    logger.info(`🔥 ${products.length} محصول soft delete شد`);
  }
  
  const [result] = await pool.query(
    'UPDATE categories SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (result.affectedRows === 0) {
    throw new AppError('دسته‌بندی یافت نشد یا قبلاً حذف شده است', 404);
  }
  
  logger.info(`🗑️ دسته‌بندی ${id} به سطل زباله منتقل شد`);
  return true;
};

// ===== بازیابی =====
const restoreCategory = async (id) => {
  const [category] = await pool.query(
    'SELECT id FROM categories WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  if (category.length === 0) {
    throw new AppError('دسته‌بندی در سطل زباله یافت نشد', 404);
  }
  
  await pool.query('UPDATE categories SET deleted_at = NULL WHERE id = ?', [id]);
  await pool.query(
    'UPDATE products SET deleted_at = NULL WHERE category_id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  
  logger.info(`♻️ دسته‌بندی ${id} و محصولات مرتبط بازیابی شدند`);
};

// ===== حذف دائمی =====
const forceDeleteCategory = async (id) => {
  const [category] = await pool.query(
    'SELECT id FROM categories WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  if (category.length === 0) {
    throw new AppError('دسته‌بندی در سطل زباله یافت نشد', 404);
  }
  
  await pool.query('DELETE FROM products WHERE category_id = ?', [id]);
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  
  logger.info(`💀 دسته‌بندی ${id} و محصولات مرتبط برای همیشه حذف شدند`);
};

module.exports = {
  getAllCategories,
  getTrashedCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  forceDeleteCategory,
};