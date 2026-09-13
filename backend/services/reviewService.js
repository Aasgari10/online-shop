const logger = require("../utils/logger");
// backend/services/reviewService.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// دریافت تنظیمات تایید خودکار (از pages و site_settings)
// ============================================================
const getAutoApproveSetting = async () => {
  // ابتدا از pages دریافت کن
  const [pageRows] = await pool.query(
    "SELECT JSON_EXTRACT(content_json, '$.auto_approve_reviews') as auto_approve FROM pages WHERE slug = 'site-settings'"
  );
  if (pageRows.length > 0 && pageRows[0].auto_approve !== null) {
    return pageRows[0].auto_approve === 1 || pageRows[0].auto_approve === true;
  }
  
  // در غیر این صورت از site_settings دریافت کن
  const [rows] = await pool.query(
    "SELECT `value` FROM site_settings WHERE `key` = 'auto_approve_reviews'"
  );
  if (rows.length > 0) {
    return rows[0].value === '1' || rows[0].value === 'true';
  }
  
  return false;
};

// ============================================================
// به‌روزرسانی تنظیمات تایید خودکار
// ============================================================
const updateAutoApproveSetting = async (value) => {
  // ۱. ذخیره در pages
  const [pageRows] = await pool.query(
    "SELECT content_json FROM pages WHERE slug = 'site-settings'"
  );
  let contentJson = {};
  if (pageRows.length > 0 && pageRows[0].content_json) {
    try {
      contentJson = typeof pageRows[0].content_json === 'string' 
        ? JSON.parse(pageRows[0].content_json) 
        : pageRows[0].content_json;
    } catch (e) {
      contentJson = {};
    }
  }
  
  contentJson.auto_approve_reviews = value ? 1 : 0;
  
  if (pageRows.length > 0) {
    await pool.query(
      "UPDATE pages SET content_json = ? WHERE slug = 'site-settings'",
      [JSON.stringify(contentJson)]
    );
  } else {
    await pool.query(
      "INSERT INTO pages (slug, title, content_json) VALUES (?, ?, ?)",
      ['site-settings', 'تنظیمات سایت', JSON.stringify(contentJson)]
    );
  }
  
  // ۲. ذخیره در site_settings برای هماهنگی
  await pool.query(
    "INSERT INTO site_settings (`key`, `value`, `group`, `description`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    ['auto_approve_reviews', value ? '1' : '0', 'reviews', 'تایید خودکار نظرات']
  );
  
  logger.info(`⚙️ تنظیمات تایید خودکار نظرات به ${value ? 'فعال' : 'غیرفعال'} تغییر یافت`);
};

// ============================================================
// دریافت نظرات یک محصول (با ریپلای‌ها)
// ============================================================
const getProductReviews = async (productId) => {
  const [reviews] = await pool.query(
    `SELECT r.*, u.name as user_name 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     WHERE r.product_id = ? AND r.deleted_at IS NULL AND r.is_approved = 1 AND r.parent_id IS NULL
     ORDER BY r.created_at DESC`,
    [productId]
  );

  for (const review of reviews) {
    const [replies] = await pool.query(
      `SELECT r.*, u.name as user_name, u.role as user_role
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.parent_id = ? AND r.deleted_at IS NULL AND r.is_approved = 1
       ORDER BY r.created_at ASC`,
      [review.id]
    );
    review.replies = replies;
  }

  const [ratingResult] = await pool.query(
    `SELECT AVG(rating) as avgRating, COUNT(*) as totalReviews 
     FROM reviews 
     WHERE product_id = ? 
       AND deleted_at IS NULL 
       AND is_approved = 1 
       AND parent_id IS NULL 
       AND rating > 0`,
    [productId]
  );

  return {
    reviews,
    averageRating: Number(ratingResult[0]?.avgRating) || 0,
    totalReviews: Number(ratingResult[0]?.totalReviews) || 0,
  };
};

// ============================================================
// دریافت نظرات در انتظار تایید (فقط نظرات اصلی با is_approved=0 و deleted_at=NULL)
// ============================================================
const getPendingReviews = async () => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name as user_name, p.name as product_name 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     JOIN products p ON r.product_id = p.id 
     WHERE r.deleted_at IS NULL AND r.is_approved = 0 AND r.parent_id IS NULL
     ORDER BY r.created_at DESC`
  );
  return rows;
};

// ============================================================
// ثبت نظر جدید (rating=0 مجاز است)
// ============================================================
const createReview = async (userId, productId, rating, comment, parentId = null) => {
  if (rating === undefined || rating === null || rating < 0 || rating > 5) {
    throw new AppError('امتیاز باید بین ۰ تا ۵ باشد', 400);
  }

  if (!comment || comment.trim() === '') {
    throw new AppError('متن نظر نمی‌تواند خالی باشد', 400);
  }

  const [product] = await pool.query(
    'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL',
    [productId]
  );
  if (product.length === 0) {
    throw new AppError('محصول یافت نشد', 404);
  }

  if (parentId) {
    const [parent] = await pool.query(
      'SELECT id FROM reviews WHERE id = ? AND deleted_at IS NULL AND is_approved = 1',
      [parentId]
    );
    if (parent.length === 0) {
      throw new AppError('نظر والد یافت نشد یا تأیید نشده است', 404);
    }
  }

  let isApproved;
  if (parentId) {
    isApproved = 1;
  } else {
    const autoApprove = await getAutoApproveSetting();
    isApproved = autoApprove ? 1 : 0;
  }

  const [result] = await pool.query(
    `INSERT INTO reviews (user_id, product_id, rating, comment, is_approved, parent_id) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, productId, rating, comment.trim(), isApproved, parentId || null]
  );

  const [user] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
  
  const statusText = isApproved ? 'تأیید خودکار' : 'در انتظار تأیید';
  logger.info(`⭐ نظر جدید برای محصول ${productId} توسط کاربر ${userId} ثبت شد (وضعیت: ${statusText})${parentId ? ` (پاسخ به نظر ${parentId})` : ''}`);

  return {
    id: result.insertId,
    user_id: userId,
    user_name: user[0]?.name || 'کاربر',
    rating,
    comment: comment.trim(),
    is_approved: !!isApproved,
    parent_id: parentId || null,
    created_at: new Date().toISOString(),
  };
};

// ============================================================
// ویرایش نظر (فقط نظرات اصلی، نه ریپلای)
// ============================================================
const updateReview = async (userId, reviewId, rating, comment) => {
  const [review] = await pool.query(
    'SELECT * FROM reviews WHERE id = ? AND user_id = ? AND deleted_at IS NULL AND parent_id IS NULL',
    [reviewId, userId]
  );
  if (review.length === 0) {
    throw new AppError('نظر یافت نشد یا شما دسترسی ندارید یا این نظر یک ریپلای است', 404);
  }

  await pool.query(
    'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
    [rating, comment || null, reviewId]
  );
  logger.info(`✏️ نظر ${reviewId} توسط کاربر ${userId} ویرایش شد`);
};

// ============================================================
// ✅ تایید نظر (ادمین) - با حذف از لیست در انتظار
// ============================================================
const approveReview = async (reviewId) => {
  const [review] = await pool.query(
    'SELECT id FROM reviews WHERE id = ? AND deleted_at IS NULL AND is_approved = 0',
    [reviewId]
  );
  if (review.length === 0) {
    throw new AppError('نظر یافت نشد یا قبلاً تأیید شده است', 404);
  }
  
  await pool.query('UPDATE reviews SET is_approved = 1 WHERE id = ?', [reviewId]);
  logger.info(`✅ نظر ${reviewId} تأیید شد`);
  
  // برگرداندن اطلاعات نظر برای به‌روزرسانی لیست
  return { id: reviewId, is_approved: 1 };
};

// ============================================================
// ✅ رد نظر (ادمین) - با حذف فیزیکی از جدول (یا soft delete)
// ============================================================
const rejectReview = async (reviewId) => {
  const [review] = await pool.query(
    'SELECT id FROM reviews WHERE id = ? AND deleted_at IS NULL AND is_approved = 0',
    [reviewId]
  );
  if (review.length === 0) {
    throw new AppError('نظر یافت نشد یا قبلاً تأیید/رد شده است', 404);
  }
  
  // ✅ soft delete برای حذف از لیست در انتظار
  await pool.query('UPDATE reviews SET deleted_at = NOW(), is_approved = 0 WHERE id = ?', [reviewId]);
  logger.info(`❌ نظر ${reviewId} رد و حذف شد`);
  
  return { id: reviewId, deleted_at: new Date() };
};

// ============================================================
// پاسخ به نظر (ریپلای توسط ادمین)
// ============================================================
const replyToReview = async (adminId, parentId, productId, comment) => {
  return createReview(adminId, productId, 5, comment, parentId);
};

// ============================================================
// حذف نرم (سطل زباله) - فقط نظرات اصلی
// ============================================================
const softDeleteReview = async (reviewId) => {
  const [review] = await pool.query(
    'SELECT id FROM reviews WHERE id = ? AND deleted_at IS NULL AND parent_id IS NULL',
    [reviewId]
  );
  if (review.length === 0) {
    throw new AppError('نظر یافت نشد یا این یک ریپلای است', 404);
  }
  await pool.query('UPDATE reviews SET deleted_at = NOW() WHERE id = ?', [reviewId]);
  logger.info(`🗑️ نظر ${reviewId} به سطل زباله منتقل شد`);
};

// ============================================================
// بازیابی از سطل زباله
// ============================================================
const restoreReview = async (reviewId) => {
  const [review] = await pool.query(
    'SELECT id FROM reviews WHERE id = ? AND deleted_at IS NOT NULL AND parent_id IS NULL',
    [reviewId]
  );
  if (review.length === 0) {
    throw new AppError('نظر در سطل زباله یافت نشد یا این یک ریپلای است', 404);
  }
  await pool.query('UPDATE reviews SET deleted_at = NULL WHERE id = ?', [reviewId]);
  logger.info(`♻️ نظر ${reviewId} بازیابی شد`);
};

// ============================================================
// حذف دائمی
// ============================================================
const forceDeleteReview = async (reviewId) => {
  const [review] = await pool.query(
    'SELECT id FROM reviews WHERE id = ? AND deleted_at IS NOT NULL AND parent_id IS NULL',
    [reviewId]
  );
  if (review.length === 0) {
    throw new AppError('نظر در سطل زباله یافت نشد یا این یک ریپلای است', 404);
  }
  await pool.query('DELETE FROM reviews WHERE parent_id = ?', [reviewId]);
  await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
  logger.info(`💀 نظر ${reviewId} و ریپلای‌های آن برای همیشه حذف شدند`);
};

// ============================================================
// دریافت نظرات سطل زباله (فقط نظرات اصلی)
// ============================================================
const getTrashedReviews = async () => {
  const [rows] = await pool.query(
    `SELECT r.*, u.name as user_name, p.name as product_name 
     FROM reviews r 
     JOIN users u ON r.user_id = u.id 
     JOIN products p ON r.product_id = p.id 
     WHERE r.deleted_at IS NOT NULL AND r.parent_id IS NULL
     ORDER BY r.deleted_at DESC`
  );
  return rows;
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  approveReview,
  rejectReview,
  replyToReview,
  getPendingReviews,
  updateAutoApproveSetting,
  getAutoApproveSetting,
  softDeleteReview,
  restoreReview,
  forceDeleteReview,
  getTrashedReviews,
};