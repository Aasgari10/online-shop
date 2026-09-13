const logger = require("../utils/logger");
// backend/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProductReviews,
  createReview,
  updateReview,
  approveReview,
  rejectReview,
  getPendingReviews,
  getSettings,
  updateSettings,
  softDeleteReview,
} = require('../controllers/reviewController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// ✅ اعتبارسنجی: rating می‌تواند 0 باشد (اختیاری) و comment باید حداقل یک کاراکتر داشته باشد
const validateReview = [
  body('comment')
    .trim()
    .escape()
    .isLength({ min: 1, max: 1000 })
    .withMessage('متن نظر نمی‌تواند خالی باشد و حداکثر ۱۰۰۰ کاراکتر است'),
  body('rating')
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 5 })
    .withMessage('امتیاز باید بین ۰ تا ۵ باشد'),
];

const validateUpdateReview = [
  body('comment')
    .trim()
    .escape()
    .isLength({ min: 1, max: 1000 })
    .withMessage('متن نظر نمی‌تواند خالی باشد و حداکثر ۱۰۰۰ کاراکتر است'),
  body('rating')
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 5 })
    .withMessage('امتیاز باید بین ۰ تا ۵ باشد'),
];

// ============================================================
// مسیرهای عمومی
// ============================================================
router.get('/products/:productId/reviews', getProductReviews);

// ============================================================
// مسیرهای نیاز به احراز هویت (کاربران)
// ============================================================
router.post('/products/:productId/reviews', authenticate, validateReview, createReview);
router.put('/reviews/:reviewId', authenticate, validateUpdateReview, updateReview);
router.delete('/reviews/:reviewId', authenticate, softDeleteReview);

// ============================================================
// مسیرهای مدیریت (فقط ادمین)
// ============================================================

// تنظیمات تایید خودکار
router.get('/admin/settings', authenticate, isAdmin, getSettings);
router.put('/admin/settings', authenticate, isAdmin, updateSettings);

// مدیریت نظرات در انتظار
router.get('/admin/reviews/pending', authenticate, isAdmin, getPendingReviews);
router.put('/admin/reviews/:reviewId/approve', authenticate, isAdmin, approveReview);
router.put('/admin/reviews/:reviewId/reject', authenticate, isAdmin, rejectReview);

module.exports = router;