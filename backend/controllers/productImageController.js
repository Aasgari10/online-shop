const logger = require("../utils/logger");
// backend/controllers/productImageController.js
const productImageService = require('../services/productImageService');
const { AppError } = require('../middleware/errorHandler');

// دریافت تصاویر محصول
const getProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const images = await productImageService.getProductImages(productId);
    res.json({ success: true, data: images });
  } catch (error) { next(error); }
};

// آپلود یک تصویر (پشتیبانی از آپلود چندگانه در یک تابع جدا)
const uploadProductImage = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!req.file) throw new AppError('لطفاً یک تصویر انتخاب کنید', 400);
    const imageUrl = `/uploads/${req.file.filename}`;
    const result = await productImageService.addProductImage(productId, imageUrl);
    res.status(201).json({ success: true, message: 'تصویر اضافه شد', data: result });
  } catch (error) { next(error); }
};

// آپلود چند تصویر همزمان
const uploadMultipleProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!req.files || req.files.length === 0) {
      throw new AppError('لطفاً حداقل یک تصویر انتخاب کنید', 400);
    }

    const results = [];
    for (const file of req.files) {
      const imageUrl = `/uploads/${file.filename}`;
      const result = await productImageService.addProductImage(productId, imageUrl);
      results.push(result);
    }

    res.status(201).json({
      success: true,
      message: `${results.length} تصویر با موفقیت اضافه شد`,
      data: results,
    });
  } catch (error) { next(error); }
};

// حذف تصویر
const deleteProductImage = async (req, res, next) => {
  try {
    const { imageId, productId } = req.params;
    await productImageService.deleteProductImage(parseInt(imageId), parseInt(productId));
    res.json({ success: true, message: 'تصویر با موفقیت حذف شد' });
  } catch (error) { next(error); }
};

// تغییر ترتیب
const reorderProductImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageOrders } = req.body;
    if (!imageOrders || !Array.isArray(imageOrders) || imageOrders.length === 0) {
      throw new AppError('لیست ترتیب تصاویر نامعتبر است', 400);
    }
    await productImageService.reorderProductImages(productId, imageOrders);
    res.json({ success: true, message: 'ترتیب تصاویر به‌روزرسانی شد' });
  } catch (error) { next(error); }
};

module.exports = {
  getProductImages,
  uploadProductImage,
  uploadMultipleProductImages,
  deleteProductImage,
  reorderProductImages,
};