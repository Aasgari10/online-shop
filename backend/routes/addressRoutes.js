const logger = require("../utils/logger");
// backend/routes/addressRoutes.js
logger.info('🔵 [addressRoutes] شروع بارگذاری...');

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authenticate = require('../middleware/authMiddleware');
const addressController = require('../controllers/addressController');

logger.info('🔵 [addressRoutes] addressController:', Object.keys(addressController));

// ============================================================
// همه مسیرهای آدرس نیاز به احراز هویت دارند
// ============================================================
router.use(authenticate);

// ============================================================
// اعتبارسنجی
// ============================================================
const validateAddress = [
  body('province').trim().escape().isLength({ min: 2, max: 100 }).withMessage('استان معتبر نیست'),
  body('city').trim().escape().isLength({ min: 2, max: 100 }).withMessage('شهر معتبر نیست'),
  body('address').trim().escape().isLength({ min: 5, max: 500 }).withMessage('آدرس باید بین ۵ تا ۵۰۰ کاراکتر باشد'),
  body('postal_code').optional().trim().escape().isLength({ max: 20 }).withMessage('کد پستی نامعتبر است'),
  body('phone').optional().trim().escape().isLength({ max: 20 }).withMessage('تلفن نامعتبر است'),
  body('receiver_name').optional().trim().escape().isLength({ max: 100 }).withMessage('نام گیرنده نامعتبر است'),
  body('is_default').optional().isBoolean().withMessage('مقدار پیش‌فرض باید boolean باشد'),
];

// ============================================================
// مسیرها
// ============================================================

// دریافت لیست آدرس‌های کاربر
router.get('/addresses', addressController.getUserAddresses);

// دریافت یک آدرس با شناسه
router.get('/addresses/:id', addressController.getAddressById);

// ایجاد آدرس جدید
router.post('/addresses', validateAddress, addressController.createAddress);

// ویرایش آدرس
router.put('/addresses/:id', validateAddress, addressController.updateAddress);

// حذف آدرس (نرم)
router.delete('/addresses/:id', addressController.deleteAddress);

// تنظیم آدرس پیش‌فرض
router.put('/addresses/:id/default', addressController.setDefaultAddress);

logger.info('✅ [addressRoutes] همه مسیرها تعریف شدند');

module.exports = router;

logger.info('✅ [addressRoutes] بارگذاری کامل شد');