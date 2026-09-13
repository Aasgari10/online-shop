const logger = require("../utils/logger");
// backend/controllers/testimonialController.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// دریافت نظرات فعال (عمومی - برای صفحه اصلی)
// ============================================================
const getActiveTestimonials = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM testimonials WHERE deleted_at IS NULL AND is_active = 1 ORDER BY order_index ASC, id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { 
    console.error('❌ [getActiveTestimonials] خطا:', error);
    next(error); 
  }
};

// ============================================================
// دریافت همه نظرات (ادمین)
// ============================================================
const getAllTestimonials = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM testimonials WHERE deleted_at IS NULL ORDER BY order_index ASC, id DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { 
    console.error('❌ [getAllTestimonials] خطا:', error);
    next(error); 
  }
};

// ============================================================
// دریافت یک نظر با شناسه
// ============================================================
const getTestimonialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM testimonials WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (rows.length === 0) throw new AppError('نظر یافت نشد', 404);
    res.json({ success: true, data: rows[0] });
  } catch (error) { 
    console.error(`❌ [getTestimonialById] خطا برای ID ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// ایجاد نظر جدید (ادمین)
// ============================================================
const createTestimonial = async (req, res, next) => {
  try {
    const { name, date, rating, comment, product, is_active, order_index } = req.body;
    
    // اعتبارسنجی
    if (!name || !comment) {
      throw new AppError('نام و متن نظر الزامی است', 400);
    }

    // بررسی تکراری نبودن (اختیاری)
    const [existing] = await pool.query(
      'SELECT id FROM testimonials WHERE name = ? AND comment = ? AND deleted_at IS NULL',
      [name.trim(), comment.trim()]
    );
    if (existing.length > 0) {
      throw new AppError('این نظر قبلاً ثبت شده است', 400);
    }

    // ذخیره در دیتابیس
    const [result] = await pool.query(
      `INSERT INTO testimonials (name, date, rating, comment, product, is_active, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        date || new Date().toLocaleDateString('fa-IR'),
        rating || 5,
        comment.trim(),
        product || null,
        is_active !== undefined ? is_active : 1,
        order_index || 0
      ]
    );
    
    logger.info(`💬 نظر جدید توسط ادمین ایجاد شد: ${name} (ID: ${result.insertId})`);
    res.status(201).json({
      success: true,
      message: 'نظر با موفقیت ایجاد شد',
      data: { 
        id: result.insertId, 
        name: name.trim(), 
        rating: rating || 5, 
        comment: comment.trim(), 
        product: product || null,
        is_active: is_active !== undefined ? is_active : 1
      }
    });
  } catch (error) { 
    console.error('❌ [createTestimonial] خطا:', error);
    next(error); 
  }
};

// ============================================================
// ویرایش نظر (ادمین)
// ============================================================
const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, date, rating, comment, product, is_active, order_index } = req.body;

    // بررسی وجود نظر
    const [existing] = await pool.query(
      'SELECT id FROM testimonials WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('نظر یافت نشد', 404);

    // به‌روزرسانی
    await pool.query(
      `UPDATE testimonials SET
        name = ?, date = ?, rating = ?, comment = ?, product = ?,
        is_active = ?, order_index = ?
       WHERE id = ?`,
      [
        name.trim(),
        date || new Date().toLocaleDateString('fa-IR'),
        rating || 5,
        comment.trim(),
        product || null,
        is_active !== undefined ? is_active : 1,
        order_index || 0,
        id
      ]
    );
    logger.info(`✏️ نظر ${id} توسط ادمین ویرایش شد`);
    res.json({ success: true, message: 'نظر با موفقیت ویرایش شد' });
  } catch (error) { 
    console.error(`❌ [updateTestimonial] خطا برای ID ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// حذف نرم (انتقال به سطل زباله)
// ============================================================
const softDeleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM testimonials WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('نظر یافت نشد', 404);
    await pool.query('UPDATE testimonials SET deleted_at = NOW() WHERE id = ?', [id]);
    logger.info(`🗑️ نظر ${id} به سطل زباله منتقل شد`);
    res.json({ success: true, message: 'نظر به سطل زباله منتقل شد' });
  } catch (error) { 
    console.error(`❌ [softDeleteTestimonial] خطا برای ID ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// بازیابی از سطل زباله
// ============================================================
const restoreTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM testimonials WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('نظر در سطل زباله یافت نشد', 404);
    await pool.query('UPDATE testimonials SET deleted_at = NULL WHERE id = ?', [id]);
    logger.info(`♻️ نظر ${id} بازیابی شد`);
    res.json({ success: true, message: 'نظر بازیابی شد' });
  } catch (error) { 
    console.error(`❌ [restoreTestimonial] خطا برای ID ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// حذف دائمی
// ============================================================
const forceDeleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query(
      'SELECT id FROM testimonials WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    if (existing.length === 0) throw new AppError('نظر در سطل زباله یافت نشد', 404);
    await pool.query('DELETE FROM testimonials WHERE id = ?', [id]);
    logger.info(`💀 نظر ${id} برای همیشه حذف شد`);
    res.json({ success: true, message: 'نظر برای همیشه حذف شد' });
  } catch (error) { 
    console.error(`❌ [forceDeleteTestimonial] خطا برای ID ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// دریافت نظرات سطل زباله
// ============================================================
const getTrashedTestimonials = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM testimonials WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) { 
    console.error('❌ [getTrashedTestimonials] خطا:', error);
    next(error); 
  }
};

// ============================================================
// خروجی ماژول
// ============================================================
logger.info('✅ [testimonialController] همه توابع تعریف شدند');

module.exports = {
  getActiveTestimonials,
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  softDeleteTestimonial,
  restoreTestimonial,
  forceDeleteTestimonial,
  getTrashedTestimonials,
};

logger.info('✅ [testimonialController] بارگذاری کامل شد');