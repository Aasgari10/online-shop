const logger = require("../utils/logger");
// backend/controllers/reviewController.js
const { validationResult } = require('express-validator');
const reviewService = require('../services/reviewService');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// دریافت نظرات یک محصول
// ============================================================
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const data = await reviewService.getProductReviews(productId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ============================================================
// ثبت نظر جدید (با پشتیبانی از parentId برای ریپلای)
// ============================================================
const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    const userId = req.user.userId;
    const { productId } = req.params;
    const { rating, comment, parentId } = req.body;

    // اگر comment وجود ندارد یا فقط فضای خالی است، خطا بده
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, errors: ['متن نظر نمی‌تواند خالی باشد'] });
    }

    // rating را با مقدار 0 ذخیره می‌کنیم (در صورت عدم ارسال، 0 می‌شود)
    const finalRating = (rating !== undefined && rating !== null) ? parseInt(rating) : 0;
    if (isNaN(finalRating) || finalRating < 0 || finalRating > 5) {
      return res.status(400).json({ success: false, errors: ['امتیاز باید بین ۰ تا ۵ باشد'] });
    }

    const data = await reviewService.createReview(userId, productId, finalRating, comment.trim(), parentId || null);
    res.status(201).json({
      success: true,
      message: data.is_approved ? 'نظر شما با موفقیت ثبت شد' : 'نظر شما با موفقیت ثبت شد و در انتظار تأیید است',
      data
    });
  } catch (error) { next(error); }
};

// ============================================================
// ویرایش نظر
// ============================================================
const updateReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const [review] = await pool.query(
      'SELECT user_id FROM reviews WHERE id = ? AND deleted_at IS NULL',
      [reviewId]
    );
    if (review.length === 0) {
      throw new AppError('نظر یافت نشد', 404);
    }
    if (review[0].user_id !== userId && userRole !== 'admin') {
      throw new AppError('شما اجازه ویرایش این نظر را ندارید', 403);
    }

    await reviewService.updateReview(userId, reviewId, rating, comment);
    res.json({ success: true, message: 'نظر با موفقیت ویرایش شد' });
  } catch (error) { next(error); }
};

// ============================================================
// تایید نظر (ادمین)
// ============================================================
const approveReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await reviewService.approveReview(reviewId);
    res.json({ success: true, message: 'نظر با موفقیت تأیید شد' });
  } catch (error) { next(error); }
};

// ============================================================
// رد نظر (ادمین)
// ============================================================
const rejectReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await reviewService.rejectReview(reviewId);
    res.json({ success: true, message: 'نظر با موفقیت رد شد' });
  } catch (error) { next(error); }
};

// ============================================================
// دریافت نظرات در انتظار تایید (ادمین)
// ============================================================
const getPendingReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getPendingReviews();
    res.json({ success: true, data: reviews });
  } catch (error) { next(error); }
};

// ============================================================
// دریافت تنظیمات تایید خودکار
// ============================================================
const getSettings = async (req, res, next) => {
  try {
    const autoApprove = await reviewService.getAutoApproveSetting();
    res.json({ success: true, data: { auto_approve_reviews: autoApprove } });
  } catch (error) { next(error); }
};

// ============================================================
// به‌روزرسانی تنظیمات تایید خودکار
// ============================================================
const updateSettings = async (req, res, next) => {
  try {
    const { auto_approve_reviews } = req.body;
    await reviewService.updateAutoApproveSetting(auto_approve_reviews);
    res.json({ success: true, message: 'تنظیمات با موفقیت به‌روزرسانی شد' });
  } catch (error) { next(error); }
};

// ============================================================
// حذف نرم (سطل زباله) - فقط برای نظرات اصلی (ادمین یا مالک)
// ============================================================
const softDeleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const [review] = await pool.query(
      'SELECT user_id FROM reviews WHERE id = ? AND deleted_at IS NULL',
      [reviewId]
    );
    if (review.length === 0) {
      throw new AppError('نظر یافت نشد', 404);
    }
    if (review[0].user_id !== userId && userRole !== 'admin') {
      throw new AppError('شما اجازه حذف این نظر را ندارید', 403);
    }

    await reviewService.softDeleteReview(reviewId);
    res.json({ success: true, message: 'نظر به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

// ============================================================
// بازیابی از سطل زباله (ادمین)
// ============================================================
const restoreReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await reviewService.restoreReview(reviewId);
    res.json({ success: true, message: 'نظر بازیابی شد' });
  } catch (error) { next(error); }
};

// ============================================================
// حذف دائمی (ادمین)
// ============================================================
const forceDeleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    await reviewService.forceDeleteReview(reviewId);
    res.json({ success: true, message: 'نظر برای همیشه حذف شد' });
  } catch (error) { next(error); }
};

// ============================================================
// دریافت نظرات سطل زباله (ادمین)
// ============================================================
const getTrashedReviews = async (req, res, next) => {
  try {
    const rows = await reviewService.getTrashedReviews();
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

logger.info('✅ [reviewController] همه توابع تعریف شدند');

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  approveReview,
  rejectReview,
  getPendingReviews,
  getSettings,
  updateSettings,
  softDeleteReview,
  restoreReview,
  forceDeleteReview,
  getTrashedReviews,
};

logger.info('✅ [reviewController] بارگذاری کامل شد');