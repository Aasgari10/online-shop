// backend/config/cron.js
console.log('⏰ [cron] در حال بارگذاری...');

const logger = require("../utils/logger");
const { cleanupExpiredReservations } = require('../services/orderService');

const startCron = () => {
  console.log('⏰ [cron] startCron اجرا می‌شود...');
  setTimeout(() => {
    console.log('⏰ [cron] اجرای اولین پاکسازی...');
    logger.info('⏰ [Cron] اجرای اولین پاکسازی رزروهای منقضی‌شده...');
    cleanupExpiredReservations().catch(err => {
      console.error('❌ [cron] خطا در پاکسازی اولیه:', err);
      logger.error('❌ [Cron] خطا در پاکسازی اولیه رزروها:', err);
    });
  }, 5000);

  setInterval(async () => {
    try {
      console.log('⏰ [cron] اجرای پاکسازی دوره‌ای...');
      logger.info('⏰ [Cron] اجرای پاکسازی دوره‌ای رزروهای منقضی‌شده...');
      await cleanupExpiredReservations();
    } catch (error) {
      console.error('❌ [cron] خطا در پاکسازی دوره‌ای:', error);
      logger.error('❌ [Cron] خطا در پاکسازی رزروهای منقضی‌شده:', error);
    }
  }, 30 * 1000);

  console.log('✅ [cron] Cron job راه‌اندازی شد');
  logger.info('⏰ [Cron] Cron job برای پاکسازی رزروها راه‌اندازی شد (هر ۳۰ ثانیه)');
};

module.exports = { startCron };
console.log('✅ [cron] بارگذاری کامل شد');