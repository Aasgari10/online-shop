const logger = require("../utils/logger");
// backend/controllers/categoryController.js
const categoryService = require('../services/categoryService');

// ===== دریافت همه دسته‌بندی‌های فعال =====
const getAllCategories = async (req, res, next) => {
  try {
    logger.info('🔥🔥🔥 [categoryController] getAllCategories اجرا شد');
    const data = await categoryService.getAllCategories();
    logger.info(`🔥 تعداد دسته‌بندی‌های برگشتی: ${data.length}`);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ خطا در getAllCategories:', error);
    next(error);
  }
};

// ===== دریافت دسته‌بندی‌های سطل زباله =====
const getTrashedCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getTrashedCategories();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ===== دریافت یک دسته‌بندی با شناسه =====
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await categoryService.getCategoryById(id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ===== ایجاد دسته‌بندی جدید =====
const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const data = await categoryService.createCategory(name);
    res.status(201).json({ success: true, message: 'دسته‌بندی با موفقیت ایجاد شد', data });
  } catch (error) { next(error); }
};

// ===== ویرایش دسته‌بندی =====
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const data = await categoryService.updateCategory(id, name);
    res.json({ success: true, message: 'دسته‌بندی با موفقیت ویرایش شد', data });
  } catch (error) { next(error); }
};

// ===== حذف نرم (انتقال به سطل زباله) =====
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.json({ success: true, message: 'دسته‌بندی و محصولات مرتبط به سطل زباله منتقل شدند' });
  } catch (error) { next(error); }
};

// ===== بازیابی از سطل زباله =====
const restoreCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.restoreCategory(id);
    res.json({ success: true, message: 'دسته‌بندی و محصولات مرتبط با موفقیت بازیابی شدند' });
  } catch (error) { next(error); }
};

// ===== حذف دائمی =====
const forceDeleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.forceDeleteCategory(id);
    res.json({ success: true, message: 'دسته‌بندی و محصولات مرتبط برای همیشه حذف شدند' });
  } catch (error) { next(error); }
};

// ============================================================
// 📦 خروجی ماژول
// ============================================================
logger.info('✅ [categoryController] همه توابع تعریف شدند');

module.exports = {
  getAllCategories,
  getTrashedCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  forceDeleteCategory,
};

logger.info('✅ [categoryController] بارگذاری کامل شد');