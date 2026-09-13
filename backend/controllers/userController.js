const logger = require("../utils/logger");
// backend/controllers/userController.js
const userService = require('../services/userService');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ===== توابع عمومی =====
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = await userService.getProfile(userId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = await userService.getOrders(userId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ===== مدیریت کاربران (ادمین) =====
const getAllUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

// ✅ Soft Delete (انتقال به سطل زباله)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [user] = await pool.query('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (user.length === 0) throw new AppError('کاربر یافت نشد', 404);
    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
    logger.info(`🗑️ کاربر ${id} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'کاربر به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

// ♻️ بازیابی کاربر
const restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [user] = await pool.query('SELECT id FROM users WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    if (user.length === 0) throw new AppError('کاربر در سطل زباله یافت نشد', 404);
    await pool.query('UPDATE users SET deleted_at = NULL WHERE id = ?', [id]);
    logger.info(`♻️ کاربر ${id} بازیابی شد`);
    res.json({ success: true, message: 'کاربر با موفقیت بازیابی شد' });
  } catch (error) { next(error); }
};

// 💀 حذف دائمی
const forceDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [user] = await pool.query('SELECT id FROM users WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    if (user.length === 0) throw new AppError('کاربر در سطل زباله یافت نشد', 404);
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    logger.info(`💀 کاربر ${id} برای همیشه حذف شد`);
    res.json({ success: true, message: 'کاربر برای همیشه حذف شد' });
  } catch (error) { next(error); }
};

// 🗑️ دریافت کاربران سطل زباله
const getTrashedUsers = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, deleted_at FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      throw new AppError('نقش نامعتبر است', 400);
    }
    const [user] = await pool.query('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (user.length === 0) throw new AppError('کاربر یافت نشد', 404);
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    logger.info(`🔄 نقش کاربر ${id} به "${role}" تغییر یافت`);
    res.json({ success: true, message: 'نقش کاربر با موفقیت تغییر یافت' });
  } catch (error) { next(error); }
};

module.exports = {
  getProfile,
  getOrders,
  getAllUsers,
  deleteUser,
  restoreUser,
  forceDeleteUser,
  getTrashedUsers,
  updateUserRole,
};