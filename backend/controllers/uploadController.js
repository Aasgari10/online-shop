// backend/controllers/uploadController.js
const logger = require("../utils/logger");
const { AppError } = require('../middleware/errorHandler');

/**
 * آپلود یک فایل تصویری و برگرداندن مسیر آن
 * فایل در req.file قرار دارد (توسط multer)
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('هیچ فایلی ارسال نشده است', 400);
    }

    // مسیر فایل ذخیره‌شده
    const filePath = `/uploads/${req.file.filename}`;
    
    logger.info(`📤 فایل با موفقیت آپلود شد: ${filePath}`);
    
    res.json({
      success: true,
      message: 'فایل با موفقیت آپلود شد',
      image_url: filePath,
    });
  } catch (error) {
    logger.error('❌ خطا در آپلود فایل:', error);
    next(error);
  }
};

module.exports = { uploadFile };