const logger = require("../utils/logger");
// backend/middleware/noCache.js
/**
 * Middleware برای غیرفعال کردن کش مرورگر
 * با تنظیم هدرهای مناسب، مرورگر را مجبور می‌کند که همیشه پاسخ جدیدی از سرور دریافت کند
 * این middleware برای مسیرهایی که نیاز به داده‌های لحظه‌ای دارند (مثل تیکت‌ها، نوتیفیکیشن‌ها) استفاده می‌شود
 */

const noCache = (req, res, next) => {
  // تنظیم هدرهای استاندارد برای غیرفعال کردن کش
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // ادامه پردازش درخواست
  next();
};

module.exports = noCache;