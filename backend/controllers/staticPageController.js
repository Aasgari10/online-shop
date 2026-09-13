const logger = require("../utils/logger");
// backend/controllers/staticPageController.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// دریافت یک صفحه با slug (عمومی)
// ============================================================
const getPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM static_pages WHERE slug = ? AND deleted_at IS NULL AND is_active = 1',
      [slug]
    );
    if (rows.length === 0) throw new AppError('صفحه یافت نشد', 404);
    res.json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
};

// ============================================================
// دریافت همه صفحات (ادمین)
// ============================================================
const getAllPages = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM static_pages WHERE deleted_at IS NULL ORDER BY id ASC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

// ============================================================
// دریافت یک صفحه با id (ادمین)
// ============================================================
const getPageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM static_pages WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (rows.length === 0) throw new AppError('صفحه یافت نشد', 404);
    res.json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
};

// ============================================================
// ایجاد صفحه جدید (ادمین)
// ============================================================
const createPage = async (req, res, next) => {
  try {
    const { slug, title, content, meta_title, meta_description, meta_keywords, is_active } = req.body;
    
    if (!slug || !title || !content) {
      throw new AppError('اسلاگ، عنوان و محتوا الزامی است', 400);
    }

    // بررسی تکراری نبودن slug
    const [existing] = await pool.query(
      'SELECT id FROM static_pages WHERE slug = ? AND deleted_at IS NULL',
      [slug.trim()]
    );
    if (existing.length > 0) {
      throw new AppError('این اسلاگ قبلاً استفاده شده است', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO static_pages (slug, title, content, meta_title, meta_description, meta_keywords, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        slug.trim(),
        title.trim(),
        content.trim(),
        meta_title || null,
        meta_description || null,
        meta_keywords || null,
        is_active !== undefined ? is_active : 1
      ]
    );
    
    logger.info(`📄 صفحه جدید ایجاد شد: ${title} (slug: ${slug})`);
    res.status(201).json({
      success: true,
      message: 'صفحه با موفقیت ایجاد شد',
      data: { id: result.insertId }
    });
  } catch (error) { next(error); }
};

// ============================================================
// ویرایش صفحه (ادمین)
// ============================================================
const updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slug, title, content, meta_title, meta_description, meta_keywords, is_active } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM static_pages WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('صفحه یافت نشد', 404);

    // بررسی تکراری نبودن slug (به جز خود صفحه)
    if (slug) {
      const [duplicate] = await pool.query(
        'SELECT id FROM static_pages WHERE slug = ? AND id != ? AND deleted_at IS NULL',
        [slug.trim(), id]
      );
      if (duplicate.length > 0) {
        throw new AppError('این اسلاگ قبلاً استفاده شده است', 400);
      }
    }

    await pool.query(
      `UPDATE static_pages SET
        slug = ?, title = ?, content = ?,
        meta_title = ?, meta_description = ?, meta_keywords = ?,
        is_active = ?
       WHERE id = ?`,
      [
        slug.trim(),
        title.trim(),
        content.trim(),
        meta_title || null,
        meta_description || null,
        meta_keywords || null,
        is_active !== undefined ? is_active : 1,
        id
      ]
    );
    
    logger.info(`✏️ صفحه ${id} ویرایش شد`);
    res.json({ success: true, message: 'صفحه با موفقیت ویرایش شد' });
  } catch (error) { next(error); }
};

// ============================================================
// حذف نرم (انتقال به سطل زباله)
// ============================================================
const softDeletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM static_pages WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('صفحه یافت نشد', 404);
    
    await pool.query('UPDATE static_pages SET deleted_at = NOW() WHERE id = ?', [id]);
    logger.info(`🗑️ صفحه ${id} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'صفحه به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

// ============================================================
// بازیابی از سطل زباله
// ============================================================
const restorePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM static_pages WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('صفحه در سطل زباله یافت نشد', 404);
    
    await pool.query('UPDATE static_pages SET deleted_at = NULL WHERE id = ?', [id]);
    logger.info(`♻️ صفحه ${id} بازیابی شد`);
    res.json({ success: true, message: 'صفحه بازیابی شد' });
  } catch (error) { next(error); }
};

// ============================================================
// حذف دائمی
// ============================================================
const forceDeletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM static_pages WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('صفحه در سطل زباله یافت نشد', 404);
    
    await pool.query('DELETE FROM static_pages WHERE id = ?', [id]);
    logger.info(`💀 صفحه ${id} برای همیشه حذف شد`);
    res.json({ success: true, message: 'صفحه برای همیشه حذف شد' });
  } catch (error) { next(error); }
};

// ============================================================
// دریافت صفحات سطل زباله
// ============================================================
const getTrashedPages = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM static_pages WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

logger.info('✅ [staticPageController] همه توابع تعریف شدند');

module.exports = {
  getPageBySlug,
  getAllPages,
  getPageById,
  createPage,
  updatePage,
  softDeletePage,
  restorePage,
  forceDeletePage,
  getTrashedPages,
};