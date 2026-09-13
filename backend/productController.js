// backend/controllers/productController.js
const logger = require("../utils/logger");
const productService = require('../services/productService');

const getProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, sort, page, limit, minRating, star } = req.query;
    const result = await productService.getProducts({
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
      minRating,
      star,
    });
    
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) { 
    next(error); 
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.file);
    res.status(201).json({ success: true, message: 'محصول با موفقیت اضافه شد', data: product });
  } catch (error) {
    console.error('❌ [createProduct] خطا:', error);
    
    // ✅ مدیریت خطاهای مربوط به سطل زباله و تکراری بودن slug
    if (error.statusCode === 409 && error.message.includes('سطل زباله')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body, req.file);
    res.json({ success: true, message: 'محصول با موفقیت ویرایش شد', data: product });
  } catch (error) {
    console.error('❌ [updateProduct] خطا:', error);
    
    if (error.statusCode === 409 && error.message.includes('سطل زباله')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.json({ success: true, message: 'محصول با موفقیت به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

const restoreProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.restoreProduct(id);
    res.json({ success: true, message: 'محصول با موفقیت بازیابی شد' });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const forceDeleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await productService.forceDeleteProduct(id);
    res.json({ success: true, message: 'محصول برای همیشه حذف شد' });
  } catch (error) { next(error); }
};

const getTrashedProducts = async (req, res, next) => {
  try {
    const products = await productService.getTrashedProducts();
    
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
};

const getSimilarProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const products = await productService.getSimilarProducts(id);
    
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
};

const getCategories = (req, res) => {
  const categories = productService.getCategories();
  res.json({ success: true, data: categories });
};

logger.info('✅ [productController] همه توابع تعریف شدند');

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  forceDeleteProduct,
  getTrashedProducts,
  getSimilarProducts,
  getCategories,
};