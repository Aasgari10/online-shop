// backend/middleware/authMiddleware.js
console.log('🔐 [authMiddleware] در حال بارگذاری...');

const logger = require("../utils/logger");
const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('⚠️ JWT_SECRET از env خوانده نشد! استفاده از مقدار پیش‌فرض موقت.');
    return 'temporary-secret-key-for-debugging-only';
  }
  return secret;
};

const authenticate = (req, res, next) => {
  console.log(`🔐 [authMiddleware] درخواست: ${req.method} ${req.url}`);
  logger.info('🔍 [authenticate] ===== بررسی احراز هویت =====');
  logger.info('🔍 [authenticate] req.path:', req.path);
  logger.info('🔍 [authenticate] req.method:', req.method);
  
  try {
    const token = req.cookies.token;

    if (!token) {
      console.log(`❌ [authMiddleware] توکن ارائه نشده است برای ${req.url}`);
      logger.info('❌ [authenticate] توکن ارائه نشده است');
      throw new AppError('دسترسی غیرمجاز. توکن ارائه نشده است.', 401);
    }

    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    console.log(`✅ [authMiddleware] کاربر ${decoded.userId} (نقش: ${decoded.role}) احراز هویت شد`);
    logger.info(`✅ [authenticate] کاربر ${decoded.userId} (نقش: ${decoded.role}) احراز هویت شد`);
    next();
  } catch (error) {
    console.error(`❌ [authMiddleware] خطا در احراز هویت برای ${req.url}:`, error.message);
    logger.error(`❌ [authenticate] خطا در احراز هویت: ${error.message}`);
    next(error);
  }
};

module.exports = authenticate;
console.log('✅ [authMiddleware] بارگذاری کامل شد');