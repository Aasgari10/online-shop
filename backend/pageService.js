// backend/services/pageService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// دریافت همه صفحات (ادمین)
// ============================================================
const getAllPages = async () => {
  logger.info('📄 [pageService] getAllPages - شروع');
  const [rows] = await pool.query(
    'SELECT * FROM pages WHERE deleted_at IS NULL ORDER BY id ASC'
  );
  logger.info(`📄 [pageService] getAllPages - ${rows.length} صفحه دریافت شد`);
  return rows;
};

// ============================================================
// دریافت یک صفحه با شناسه
// ============================================================
const getPageById = async (id) => {
  logger.info(`📄 [pageService] getPageById - شروع برای id: ${id}`);
  const [rows] = await pool.query(
    'SELECT * FROM pages WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (rows.length === 0) throw new AppError('صفحه یافت نشد', 404);
  const page = rows[0];
  if (page.content_json) {
    try {
      page.content_json = typeof page.content_json === 'string' 
        ? JSON.parse(page.content_json) 
        : page.content_json;
    } catch (e) {
      page.content_json = {};
    }
  } else {
    page.content_json = {};
  }
  logger.info(`📄 [pageService] getPageById - صفحه ${id} با موفقیت دریافت شد`);
  return page;
};

// ============================================================
// دریافت یک صفحه با slug (عمومی)
// ============================================================
const getPageBySlug = async (slug) => {
  logger.info(`📄 [pageService] getPageBySlug - شروع برای slug: "${slug}"`);
  const [rows] = await pool.query(
    'SELECT * FROM pages WHERE slug = ? AND deleted_at IS NULL AND is_active = 1',
    [slug]
  );
  if (rows.length === 0) throw new AppError('صفحه یافت نشد', 404);
  const page = rows[0];
  if (page.content_json) {
    try {
      page.content_json = typeof page.content_json === 'string' 
        ? JSON.parse(page.content_json) 
        : page.content_json;
    } catch (e) {
      page.content_json = {};
    }
  } else {
    page.content_json = {};
  }
  logger.info(`📄 [pageService] getPageBySlug - صفحه "${slug}" دریافت شد`);
  return page;
};

// ============================================================
// ✅ ایجاد صفحه جدید (اصلاح‌شده با بررسی سطل زباله برای slug)
// ============================================================
const createPage = async (data) => {
  logger.info('📄 [pageService] createPage - شروع با داده:', JSON.stringify(data, null, 2));
  
  const { title, slug, content, content_json, seo_keywords, seo_description, seo_title, is_active } = data;

  if (!title || !slug) {
    throw new AppError('عنوان و نامک (slug) الزامی است', 400);
  }

  const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');

  // ✅ ۱. بررسی وجود slug در سطل زباله
  const [trashed] = await pool.query(
    'SELECT id FROM pages WHERE slug = ? AND deleted_at IS NOT NULL',
    [trimmedSlug]
  );
  if (trashed.length > 0) {
    throw new AppError(
      `نامک (slug) "${trimmedSlug}" قبلاً برای یک صفحه استفاده شده است که هم‌اکنون در سطل زباله قرار دارد. لطفاً ابتدا آن را بازیابی کنید یا به‌طور دائمی حذف کنید.`,
      409
    );
  }

  // ✅ ۲. بررسی تکراری بودن در صفحات فعال
  const [existing] = await pool.query(
    'SELECT id FROM pages WHERE slug = ? AND deleted_at IS NULL',
    [trimmedSlug]
  );
  if (existing.length > 0) {
    throw new AppError('این نامک (slug) قبلاً استفاده شده است', 400);
  }

  const jsonData = content_json && typeof content_json === 'object' 
    ? JSON.stringify(content_json) 
    : null;

  logger.info(`📄 [pageService] createPage - seo_keywords: "${seo_keywords}"`);
  logger.info(`📄 [pageService] createPage - seo_description: "${seo_description}"`);
  logger.info(`📄 [pageService] createPage - seo_title: "${seo_title}"`);

  const [result] = await pool.query(
    `INSERT INTO pages (title, slug, content, content_json, seo_keywords, seo_description, seo_title, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      trimmedSlug,
      content || '',
      jsonData,
      seo_keywords || null,
      seo_description || null,
      seo_title || null,
      is_active !== undefined ? is_active : 1
    ]
  );

  logger.info(`📄 صفحه جدید ایجاد شد: ${title} (slug: ${trimmedSlug})`);
  logger.info(`✅ [pageService] createPage - صفحه با ID ${result.insertId} ایجاد شد`);
  
  return { id: result.insertId, title, slug: trimmedSlug };
};

// ============================================================
// ✅ ویرایش صفحه (اصلاح‌شده با بررسی سطل زباله برای slug)
// ============================================================
const updatePage = async (id, data) => {
  logger.info(`📄 [pageService] updatePage - شروع برای id: ${id}`);
  logger.info(`📄 [pageService] updatePage - داده دریافت شده:`, JSON.stringify(data, null, 2));
  
  const { title, slug, content, content_json, seo_keywords, seo_description, seo_title, is_active } = data;

  const [existing] = await pool.query(
    'SELECT id FROM pages WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (existing.length === 0) throw new AppError('صفحه یافت نشد', 404);

  if (slug) {
    const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    
    // ✅ ۱. بررسی وجود slug در سطل زباله (به جز خود صفحه)
    const [trashed] = await pool.query(
      'SELECT id FROM pages WHERE slug = ? AND id != ? AND deleted_at IS NOT NULL',
      [trimmedSlug, id]
    );
    if (trashed.length > 0) {
      throw new AppError(
        `نامک (slug) "${trimmedSlug}" قبلاً برای یک صفحه استفاده شده است که هم‌اکنون در سطل زباله قرار دارد. لطفاً ابتدا آن را بازیابی کنید یا به‌طور دائمی حذف کنید.`,
        409
      );
    }
    
    // ✅ ۲. بررسی تکراری بودن در صفحات فعال
    const [duplicate] = await pool.query(
      'SELECT id FROM pages WHERE slug = ? AND id != ? AND deleted_at IS NULL',
      [trimmedSlug, id]
    );
    if (duplicate.length > 0) {
      throw new AppError('این نامک (slug) قبلاً استفاده شده است', 400);
    }
  }

  const fields = [];
  const params = [];

  if (title !== undefined) {
    fields.push('title = ?');
    params.push(title.trim());
  }
  if (slug !== undefined) {
    fields.push('slug = ?');
    params.push(slug.trim().toLowerCase().replace(/\s+/g, '-'));
  }
  if (content !== undefined) {
    fields.push('content = ?');
    params.push(content);
  }
  if (content_json !== undefined) {
    const jsonData = typeof content_json === 'object' 
      ? JSON.stringify(content_json) 
      : content_json;
    fields.push('content_json = ?');
    params.push(jsonData);
  }
  
  logger.info(`📄 [pageService] updatePage - seo_title ورودی: "${seo_title}"`);
  logger.info(`📄 [pageService] updatePage - seo_description ورودی: "${seo_description}"`);
  logger.info(`📄 [pageService] updatePage - seo_keywords ورودی: "${seo_keywords}"`);
  
  if (seo_title !== undefined) {
    fields.push('seo_title = ?');
    params.push(seo_title || null);
    logger.info(`📄 [pageService] updatePage - seo_title تنظیم شد: "${seo_title || null}"`);
  }
  if (seo_description !== undefined) {
    fields.push('seo_description = ?');
    params.push(seo_description || null);
    logger.info(`📄 [pageService] updatePage - seo_description تنظیم شد: "${seo_description || null}"`);
  }
  if (seo_keywords !== undefined) {
    fields.push('seo_keywords = ?');
    params.push(seo_keywords || null);
    logger.info(`📄 [pageService] updatePage - seo_keywords تنظیم شد: "${seo_keywords || null}"`);
  }
  
  if (is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(is_active ? 1 : 0);
  }

  if (fields.length === 0) {
    throw new AppError('هیچ فیلدی برای ویرایش ارسال نشده است', 400);
  }

  logger.info(`📄 [pageService] updatePage - فیلدهای به‌روزرسانی: ${fields.join(', ')}`);
  logger.info(`📄 [pageService] updatePage - پارامترها:`, params);

  params.push(id);
  const query = `UPDATE pages SET ${fields.join(', ')} WHERE id = ?`;
  logger.info(`📄 [pageService] updatePage - کوئری نهایی: ${query}`);
  
  const [result] = await pool.query(query, params);
  logger.info(`📄 [pageService] updatePage - ${result.affectedRows} ردیف به‌روزرسانی شد`);

  const [updated] = await pool.query('SELECT * FROM pages WHERE id = ?', [id]);
  logger.info(`📄 [pageService] updatePage - پس از به‌روزرسانی:`);
  logger.info(`📄 [pageService] updatePage - seo_title: "${updated[0]?.seo_title}"`);
  logger.info(`📄 [pageService] updatePage - seo_description: "${updated[0]?.seo_description}"`);
  logger.info(`📄 [pageService] updatePage - seo_keywords: "${updated[0]?.seo_keywords}"`);

  logger.info(`✏️ صفحه ${id} ویرایش شد`);
  return true;
};

// ============================================================
// ✅ حذف نرم
// ============================================================
const softDeletePage = async (id) => {
  logger.info(`📄 [pageService] softDeletePage - شروع برای id: ${id}`);
  const [existing] = await pool.query(
    'SELECT id FROM pages WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  if (existing.length === 0) throw new AppError('صفحه یافت نشد', 404);
  await pool.query('UPDATE pages SET deleted_at = NOW() WHERE id = ?', [id]);
  logger.info(`🗑️ صفحه ${id} به سطل زباله منتقل شد`);
};

// ============================================================
// ✅ بازیابی از سطل زباله (با بررسی تکراری بودن slug)
// ============================================================
const restorePage = async (id) => {
  logger.info(`📄 [pageService] restorePage - شروع برای id: ${id}`);
  const [existing] = await pool.query(
    'SELECT id, slug FROM pages WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  if (existing.length === 0) throw new AppError('صفحه در سطل زباله یافت نشد', 404);
  
  // ✅ بررسی تکراری نبودن slug در صفحات فعال
  const [duplicate] = await pool.query(
    'SELECT id FROM pages WHERE slug = ? AND deleted_at IS NULL',
    [existing[0].slug]
  );
  if (duplicate.length > 0) {
    throw new AppError(
      `صفحه با نامک (slug) "${existing[0].slug}" هم‌اکنون در سیستم وجود دارد. لطفاً ابتدا آن را حذف کنید یا نامک را تغییر دهید.`,
      409
    );
  }
  
  await pool.query('UPDATE pages SET deleted_at = NULL WHERE id = ?', [id]);
  logger.info(`♻️ صفحه ${id} بازیابی شد`);
};

// ============================================================
// ✅ حذف دائمی
// ============================================================
const forceDeletePage = async (id) => {
  logger.info(`📄 [pageService] forceDeletePage - شروع برای id: ${id}`);
  const [existing] = await pool.query(
    'SELECT id FROM pages WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  if (existing.length === 0) throw new AppError('صفحه در سطل زباله یافت نشد', 404);
  await pool.query('DELETE FROM pages WHERE id = ?', [id]);
  logger.info(`💀 صفحه ${id} برای همیشه حذف شد`);
};

// ============================================================
// دریافت صفحات سطل زباله
// ============================================================
const getTrashedPages = async () => {
  logger.info('📄 [pageService] getTrashedPages - شروع');
  const [rows] = await pool.query(
    'SELECT * FROM pages WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  );
  logger.info(`📄 [pageService] getTrashedPages - ${rows.length} صفحه در سطل زباله`);
  return rows;
};

module.exports = {
  getAllPages,
  getPageById,
  getPageBySlug,
  createPage,
  updatePage,
  softDeletePage,
  restorePage,
  forceDeletePage,
  getTrashedPages,
};