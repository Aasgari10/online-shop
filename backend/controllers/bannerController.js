const logger = require("../utils/logger");
// backend/controllers/bannerController.js
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../middleware/errorHandler');

// ===== دریافت بنرهای دوگانه =====
const getDoubleBanners = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM banners 
       WHERE deleted_at IS NULL 
         AND is_active = 1 
         AND position = 'double' 
       ORDER BY order_index ASC, id DESC 
       LIMIT 2`
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

// ===== دریافت بنرهای فعال (عمومی) =====
const getPublicBanners = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM banners 
       WHERE deleted_at IS NULL 
         AND is_active = 1 
         AND position = 'home' 
       ORDER BY order_index ASC, id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

// ===== دریافت بنرها (ادمین) =====
const getBanners = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM banners WHERE deleted_at IS NULL ORDER BY order_index ASC, id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

// ===== ایجاد بنر (با لاگ کامل) =====
const createBanner = async (req, res, next) => {
  try {
    logger.info('🔍 [createBanner] شروع ایجاد بنر');
    logger.info('🔍 [createBanner] req.body:', req.body);
    logger.info('🔍 [createBanner] req.file:', req.file);

    const { title, link, position, order_index, is_active } = req.body;
    
    // بررسی وجود فایل
    if (!req.file) {
      console.error('❌ [createBanner] فایل ارسال نشده است');
      throw new AppError('تصویر بنر الزامی است', 400);
    }

    const image_url = `/uploads/${req.file.filename}`;
    logger.info('🔍 [createBanner] image_url:', image_url);

    // تبدیل is_active به boolean
    let isActive = true;
    if (is_active !== undefined) {
      if (typeof is_active === 'string') {
        isActive = is_active === 'true' || is_active === '1';
      } else {
        isActive = Boolean(is_active);
      }
    }

    const orderIdx = parseInt(order_index) || 0;
    const pos = position || 'home';

    logger.info(`🔍 [createBanner] title: ${title}, link: ${link}, position: ${pos}, order_index: ${orderIdx}, is_active: ${isActive}`);

    const [result] = await pool.query(
      `INSERT INTO banners (title, image_url, link, position, order_index, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title || '', image_url, link || '', pos, orderIdx, isActive]
    );

    logger.info(`✅ [createBanner] بنر با ID ${result.insertId} ایجاد شد`);
    logger.info(`🖼️ بنر جدید ایجاد شد: ${title || 'بدون عنوان'} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: 'بنر با موفقیت ایجاد شد',
      data: {
        id: result.insertId,
        title: title || '',
        image_url,
        link: link || '',
        position: pos,
        order_index: orderIdx,
        is_active: isActive,
      },
    });
  } catch (error) {
    console.error('❌ [createBanner] خطا:', error);
    next(error);
  }
};

// ===== ویرایش بنر =====
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, link, position, order_index, is_active } = req.body;
    let image_url = req.file ? `/uploads/${req.file.filename}` : null;

    logger.info(`🔍 [updateBanner] ویرایش بنر ${id}`);
    logger.info('🔍 [updateBanner] req.body:', req.body);

    const [current] = await pool.query('SELECT image_url FROM banners WHERE id = ? AND deleted_at IS NULL', [id]);
    if (current.length === 0) throw new AppError('بنر یافت نشد', 404);

    let isActive = true;
    if (is_active !== undefined) {
      if (typeof is_active === 'string') {
        isActive = is_active === 'true' || is_active === '1';
      } else {
        isActive = Boolean(is_active);
      }
    }

    const orderIdx = parseInt(order_index) || 0;
    const pos = position || 'home';

    let query = 'UPDATE banners SET title = ?, link = ?, position = ?, order_index = ?, is_active = ?';
    let params = [title || '', link || '', pos, orderIdx, isActive];
    if (image_url) {
      query += ', image_url = ?';
      params.push(image_url);
    }
    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);

    if (image_url && current[0].image_url) {
      const oldPath = path.join(__dirname, '..', current[0].image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    logger.info(`✏️ بنر ${id} ویرایش شد`);
    res.json({ success: true, message: 'بنر با موفقیت ویرایش شد' });
  } catch (error) {
    console.error('❌ [updateBanner] خطا:', error);
    next(error);
  }
};

// ===== حذف نرم =====
const softDeleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [banner] = await pool.query('SELECT id FROM banners WHERE id = ? AND deleted_at IS NULL', [id]);
    if (banner.length === 0) throw new AppError('بنر یافت نشد', 404);
    await pool.query('UPDATE banners SET deleted_at = NOW() WHERE id = ?', [id]);
    logger.info(`🗑️ بنر ${id} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'بنر به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

// ===== بازیابی =====
const restoreBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [banner] = await pool.query('SELECT id FROM banners WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    if (banner.length === 0) throw new AppError('بنر در سطل زباله یافت نشد', 404);
    await pool.query('UPDATE banners SET deleted_at = NULL WHERE id = ?', [id]);
    logger.info(`♻️ بنر ${id} بازیابی شد`);
    res.json({ success: true, message: 'بنر بازیابی شد' });
  } catch (error) { next(error); }
};

// ===== حذف دائمی =====
const forceDeleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [banner] = await pool.query('SELECT image_url FROM banners WHERE id = ? AND deleted_at IS NOT NULL', [id]);
    if (banner.length === 0) throw new AppError('بنر در سطل زباله یافت نشد', 404);
    if (banner[0].image_url) {
      const oldPath = path.join(__dirname, '..', banner[0].image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    await pool.query('DELETE FROM banners WHERE id = ?', [id]);
    logger.info(`💀 بنر ${id} برای همیشه حذف شد`);
    res.json({ success: true, message: 'بنر برای همیشه حذف شد' });
  } catch (error) { next(error); }
};

// ===== دریافت بنرهای سطل زباله =====
const getTrashedBanners = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

module.exports = {
  getPublicBanners,
  getDoubleBanners,
  getBanners,
  createBanner,
  updateBanner,
  softDeleteBanner,
  restoreBanner,
  forceDeleteBanner,
  getTrashedBanners,
};