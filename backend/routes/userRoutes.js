const logger = require("../utils/logger");
// backend/routes/userRoutes.js
logger.info('🔵 [userRoutes] شروع بارگذاری...');

const express = require('express');
const router = express.Router();
const { getProfile, getOrders } = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');

logger.info('🔵 [userRoutes] کنترلرها بارگذاری شدند');

// مسیر دریافت پروفایل کاربر
router.get('/profile', authenticate, getProfile);

// مسیر دریافت تاریخچه سفارشات کاربر
router.get('/orders', authenticate, getOrders);

logger.info('✅ [userRoutes] همه مسیرها تعریف شدند');

module.exports = router;
