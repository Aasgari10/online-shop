// backend/middleware/errorHandler.js
console.log('⚠️ [errorHandler] در حال بارگذاری...');

const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  console.log(`❌ [errorHandler] خطا برای ${req.method} ${req.url}:`, err.message);
  console.log(`❌ [errorHandler] Stack:`, err.stack);
  logger.error(`❌ ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'اطلاعات ورودی نامعتبر است',
      errors: err.errors,
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'توکن منقضی شده است',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'حجم فایل نباید بیشتر از ۵ مگابایت باشد',
    });
  }

  console.log(`❌ [errorHandler] خطای پیش‌بینی‌نشده:`, err.message);
  return res.status(500).json({
    success: false,
    message: 'خطای داخلی سرور',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};

module.exports = { errorHandler, AppError };
console.log('✅ [errorHandler] بارگذاری کامل شد');