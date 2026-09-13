// backend/middleware/isAdmin.js
console.log('🔐 [isAdmin] در حال بارگذاری...');

const logger = require("../utils/logger");
const { AppError } = require('./errorHandler');

const isAdmin = (req, res, next) => {
  console.log(`🔐 [isAdmin] درخواست: ${req.method} ${req.url}`);
  logger.info('🔍 [isAdmin] ===== بررسی دسترسی ادمین =====');
  logger.info('🔍 [isAdmin] req.user:', req.user);
  logger.info('🔍 [isAdmin] req.path:', req.path);
  logger.info('🔍 [isAdmin] req.method:', req.method);
  
  if (!req.user) {
    console.log(`❌ [isAdmin] کاربر احراز هویت نشده است برای ${req.url}`);
    logger.info('❌ [isAdmin] کاربر احراز هویت نشده است');
    return next(new AppError('احراز هویت نشده‌اید', 401));
  }

  logger.info('🔍 [isAdmin] req.user.role:', req.user.role);
  
  if (req.user.role !== 'admin') {
    console.log(`❌ [isAdmin] نقش کاربر "${req.user.role}" نیست، دسترسی غیرمجاز برای ${req.url}`);
    logger.info(`❌ [isAdmin] نقش کاربر "${req.user.role}" نیست، دسترسی غیرمجاز`);
    return next(new AppError('دسترسی غیرمجاز. فقط مدیران مجاز به این عملیات هستند.', 403));
  }

  console.log(`✅ [isAdmin] دسترسی ادمین تأیید شد برای ${req.url}`);
  logger.info('✅ [isAdmin] دسترسی ادمین تأیید شد');
  next();
};

module.exports = isAdmin;
console.log('✅ [isAdmin] بارگذاری کامل شد');