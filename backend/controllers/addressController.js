const logger = require("../utils/logger");
// backend/controllers/addressController.js
logger.info('🔵 [addressController] در حال بارگذاری...');

const addressService = require('../services/addressService');
const { AppError } = require('../middleware/errorHandler');

logger.info('🔵 [addressController] وابستگی‌ها بارگذاری شدند');

// ============================================================
// دریافت تمام آدرس‌های کاربر
// ============================================================
const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    logger.info(`🔍 [addressController] دریافت آدرس‌های کاربر ${userId}`);
    const addresses = await addressService.getUserAddresses(userId);
    logger.info(`✅ [addressController] ${addresses.length} آدرس برای کاربر ${userId} یافت شد`);
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('❌ [addressController] خطا در دریافت آدرس‌ها:', error);
    next(error);
  }
};

// ============================================================
// دریافت یک آدرس با شناسه
// ============================================================
const getAddressById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    logger.info(`🔍 [addressController] دریافت آدرس ${id} برای کاربر ${userId}`);
    const address = await addressService.getAddressById(id, userId);
    res.json({ success: true, data: address });
  } catch (error) {
    console.error(`❌ [addressController] خطا در دریافت آدرس ${req.params.id}:`, error);
    next(error);
  }
};

// ============================================================
// ایجاد آدرس جدید
// ============================================================
const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = req.body;
    logger.info(`🔍 [addressController] ایجاد آدرس جدید برای کاربر ${userId}:`, data);
    const address = await addressService.createAddress(userId, data);
    logger.info(`✅ [addressController] آدرس ${address.id} برای کاربر ${userId} ایجاد شد`);
    res.status(201).json({
      success: true,
      message: 'آدرس با موفقیت اضافه شد',
      data: address,
    });
  } catch (error) {
    console.error('❌ [addressController] خطا در ایجاد آدرس:', error);
    next(error);
  }
};

// ============================================================
// ویرایش آدرس
// ============================================================
const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const data = req.body;
    logger.info(`🔍 [addressController] ویرایش آدرس ${id} برای کاربر ${userId}`);
    await addressService.updateAddress(id, userId, data);
    res.json({
      success: true,
      message: 'آدرس با موفقیت ویرایش شد',
    });
  } catch (error) {
    console.error(`❌ [addressController] خطا در ویرایش آدرس ${req.params.id}:`, error);
    next(error);
  }
};

// ============================================================
// حذف آدرس (نرم)
// ============================================================
const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    logger.info(`🔍 [addressController] حذف آدرس ${id} برای کاربر ${userId}`);
    await addressService.deleteAddress(id, userId);
    res.json({
      success: true,
      message: 'آدرس با موفقیت حذف شد',
    });
  } catch (error) {
    console.error(`❌ [addressController] خطا در حذف آدرس ${req.params.id}:`, error);
    next(error);
  }
};

// ============================================================
// تنظیم آدرس پیش‌فرض
// ============================================================
const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    logger.info(`🔍 [addressController] تنظیم آدرس ${id} به‌عنوان پیش‌فرض برای کاربر ${userId}`);
    await addressService.setDefaultAddress(id, userId);
    res.json({
      success: true,
      message: 'آدرس پیش‌فرض با موفقیت تنظیم شد',
    });
  } catch (error) {
    console.error(`❌ [addressController] خطا در تنظیم آدرس پیش‌فرض ${req.params.id}:`, error);
    next(error);
  }
};

logger.info('✅ [addressController] همه توابع تعریف شدند');

module.exports = {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

logger.info('✅ [addressController] بارگذاری کامل شد');