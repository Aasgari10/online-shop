const logger = require("../utils/logger");
// backend/services/pageService.js
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
  logger.info(`📄 [pageService] getPageById - seo_keywords: "${page.seo_keywords}"`);
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
  logger.info(`📄 [pageService] getPageBySlug - seo_keywords: "${page.seo_keywords}"`);
  logger.info(`📄 [pageService] getPageBySlug - seo_description: "${page.seo_description}"`);
  logger.info(`📄 [pageService] getPageBySlug - seo_title: "${page.seo_title}"`);
  return page;
};

// ============================================================
// ایجاد صفحه جدید
// ============================================================
const createPage = async (data) => {
  logger.info('📄 [pageService] createPage - شروع با داده:', JSON.stringify(data, null, 2));
  
  const { title, slug, content, content_json, seo_keywords, seo_description, seo_title, is_active } = data;

  if (!title || !slug) {
    throw new AppError('عنوان و نامک (slug) الزامی است', 400);
  }

  const [existing] = await pool.query(
    'SELECT id FROM pages WHERE slug = ? AND deleted_at IS NULL',
    [slug]
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
      slug.trim().toLowerCase().replace(/\s+/g, '-'),
      content || '',
      jsonData,
      seo_keywords || null,
      seo_description || null,
      seo_title || null,
      is_active !== undefined ? is_active : 1
    ]
  );

  logger.info(`📄 صفحه جدید ایجاد شد: ${title} (slug: ${slug})`);
  logger.info(`✅ [pageService] createPage - صفحه با ID ${result.insertId} ایجاد شد`);
  
  return { id: result.insertId, title, slug };
};

// ============================================================
// ویرایش صفحه (با لاگ کامل)
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
    const [duplicate] = await pool.query(
      'SELECT id FROM pages WHERE slug = ? AND id != ? AND deleted_at IS NULL',
      [slug, id]
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
  
  // ===== فیلدهای سئو با لاگ =====
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

  // ===== دریافت مجدد صفحه برای بررسی =====
  const [updated] = await pool.query('SELECT * FROM pages WHERE id = ?', [id]);
  logger.info(`📄 [pageService] updatePage - پس از به‌روزرسانی:`);
  logger.info(`📄 [pageService] updatePage - seo_title: "${updated[0]?.seo_title}"`);
  logger.info(`📄 [pageService] updatePage - seo_description: "${updated[0]?.seo_description}"`);
  logger.info(`📄 [pageService] updatePage - seo_keywords: "${updated[0]?.seo_keywords}"`);

  logger.info(`✏️ صفحه ${id} ویرایش شد`);
  return true;
};

// ============================================================
// حذف نرم
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

const restorePage = async (id) => {
  logger.info(`📄 [pageService] restorePage - شروع برای id: ${id}`);
  const [existing] = await pool.query(
    'SELECT id FROM pages WHERE id = ? AND deleted_at IS NOT NULL',
    [id]
  );
  if (existing.length === 0) throw new AppError('صفحه در سطل زباله یافت نشد', 404);
  await pool.query('UPDATE pages SET deleted_at = NULL WHERE id = ?', [id]);
  logger.info(`♻️ صفحه ${id} بازیابی شد`);
};

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