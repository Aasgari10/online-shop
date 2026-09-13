// backend/controllers/staticPageController.js
const logger = require("../utils/logger");
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
// ✅ ایجاد صفحه جدید (اصلاح‌شده با بررسی سطل زباله برای slug)
// ============================================================
const createPage = async (req, res, next) => {
  try {
    const { slug, title, content, meta_title, meta_description, meta_keywords, is_active } = req.body;
    
    if (!slug || !title || !content) {
      throw new AppError('اسلاگ، عنوان و محتوا الزامی است', 400);
    }

    const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');

    // ✅ ۱. بررسی وجود slug در سطل زباله
    const [trashed] = await pool.query(
      'SELECT id FROM static_pages WHERE slug = ? AND deleted_at IS NOT NULL',
      [trimmedSlug]
    );
    if (trashed.length > 0) {
      throw new AppError(
        `اسلاگ "${trimmedSlug}" قبلاً برای یک صفحه استاتیک استفاده شده است که هم‌اکنون در سطل زباله قرار دارد. لطفاً ابتدا آن را بازیابی کنید یا به‌طور دائمی حذف کنید.`,
        409
      );
    }

    // ✅ ۲. بررسی تکراری بودن در صفحات فعال
    const [existing] = await pool.query(
      'SELECT id FROM static_pages WHERE slug = ? AND deleted_at IS NULL',
      [trimmedSlug]
    );
    if (existing.length > 0) {
      throw new AppError('این اسلاگ قبلاً استفاده شده است', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO static_pages (slug, title, content, meta_title, meta_description, meta_keywords, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        trimmedSlug,
        title.trim(),
        content.trim(),
        meta_title || null,
        meta_description || null,
        meta_keywords || null,
        is_active !== undefined ? is_active : 1
      ]
    );
    
    logger.info(`📄 صفحه استاتیک جدید ایجاد شد: ${title} (slug: ${trimmedSlug})`);
    res.status(201).json({
      success: true,
      message: 'صفحه با موفقیت ایجاد شد',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('❌ [createPage] خطا:', error);
    if (error.statusCode === 409 && error.message.includes('سطل زباله')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ============================================================
// ✅ ویرایش صفحه (اصلاح‌شده با بررسی سطل زباله برای slug)
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

    if (slug) {
      const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
      
      // ✅ ۱. بررسی وجود slug در سطل زباله (به جز خود صفحه)
      const [trashed] = await pool.query(
        'SELECT id FROM static_pages WHERE slug = ? AND id != ? AND deleted_at IS NOT NULL',
        [trimmedSlug, id]
      );
      if (trashed.length > 0) {
        throw new AppError(
          `اسلاگ "${trimmedSlug}" قبلاً برای یک صفحه استاتیک استفاده شده است که هم‌اکنون در سطل زباله قرار دارد. لطفاً ابتدا آن را بازیابی کنید یا به‌طور دائمی حذف کنید.`,
          409
        );
      }
      
      // ✅ ۲. بررسی تکراری بودن در صفحات فعال
      const [duplicate] = await pool.query(
        'SELECT id FROM static_pages WHERE slug = ? AND id != ? AND deleted_at IS NULL',
        [trimmedSlug, id]
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
        slug ? slug.trim().toLowerCase().replace(/\s+/g, '-') : existing[0].slug,
        title.trim(),
        content.trim(),
        meta_title || null,
        meta_description || null,
        meta_keywords || null,
        is_active !== undefined ? is_active : 1,
        id
      ]
    );
    
    logger.info(`✏️ صفحه استاتیک ${id} ویرایش شد`);
    res.json({ success: true, message: 'صفحه با موفقیت ویرایش شد' });
  } catch (error) {
    console.error('❌ [updatePage] خطا:', error);
    if (error.statusCode === 409 && error.message.includes('سطل زباله')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
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
    logger.info(`🗑️ صفحه استاتیک ${id} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'صفحه به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

// ============================================================
// ✅ بازیابی از سطل زباله (با بررسی تکراری بودن slug)
// ============================================================
const restorePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT id, slug FROM static_pages WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('صفحه در سطل زباله یافت نشد', 404);
    
    // ✅ بررسی تکراری نبودن slug در صفحات فعال
    const [duplicate] = await pool.query(
      'SELECT id FROM static_pages WHERE slug = ? AND deleted_at IS NULL',
      [existing[0].slug]
    );
    if (duplicate.length > 0) {
      throw new AppError(
        `صفحه با اسلاگ "${existing[0].slug}" هم‌اکنون در سیستم وجود دارد. لطفاً ابتدا آن را حذف کنید یا اسلاگ را تغییر دهید.`,
        409
      );
    }
    
    await pool.query('UPDATE static_pages SET deleted_at = NULL WHERE id = ?', [id]);
    logger.info(`♻️ صفحه استاتیک ${id} بازیابی شد`);
    res.json({ success: true, message: 'صفحه بازیابی شد' });
  } catch (error) {
    console.error('❌ [restorePage] خطا:', error);
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
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
    logger.info(`💀 صفحه استاتیک ${id} برای همیشه حذف شد`);
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