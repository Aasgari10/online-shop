const logger = require("../utils/logger");
// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  restoreProduct,
  forceDeleteProduct,
  getTrashedProducts,
  getSimilarProducts,
} = require('../controllers/productController');

const productImageController = require('../controllers/productImageController');
const featuredController = require('../controllers/featuredController');
const bannerController = require('../controllers/bannerController');
const testimonialController = require('../controllers/testimonialController');
const attributeController = require('../controllers/attributeController'); // ✅ اضافه شده
const { uploadSingle, uploadMultiple } = require('../config/multer');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// ============================================================
// مسیرهای عمومی (بدون احراز هویت) - برای فروشگاه
// ============================================================

// دریافت لیست محصولات
router.get('/products', getProducts);

// دریافت اطلاعات یک محصول (با شناسه یا slug)
router.get('/products/:id', getProductById);

// ✅ دریافت ترکیبات (variations) یک محصول (عمومی)
router.get('/products/:productId/variations', attributeController.getProductVariations);

// دریافت محصولات مشابه
router.get('/products/:id/similar', getSimilarProducts);

// دریافت محصولات ویژه (عمومی)
router.get('/featured', featuredController.getPublicFeaturedProducts);

// دریافت تصاویر یک محصول (عمومی)
router.get('/products/:productId/images', productImageController.getProductImages);

// دریافت بنرهای فعال (عمومی)
router.get('/banners', bannerController.getPublicBanners);

// دریافت بنرهای دوگانه (عمومی)
router.get('/banners/double', bannerController.getDoubleBanners);

// دریافت نظرات فعال برای صفحه اصلی (عمومی)
router.get('/testimonials', testimonialController.getActiveTestimonials);

// ============================================================
// مسیرهای مدیریت (فقط ادمین)
// ============================================================

// ---- مدیریت محصولات ----
router.post('/products', authenticate, isAdmin, uploadSingle, createProduct);
router.put('/products/:id', authenticate, isAdmin, uploadSingle, updateProduct);
router.delete('/products/:id', authenticate, isAdmin, deleteProduct);
router.put('/products/:id/restore', authenticate, isAdmin, restoreProduct);
router.delete('/products/:id/force', authenticate, isAdmin, forceDeleteProduct);
router.get('/admin/trash/products', authenticate, isAdmin, getTrashedProducts);

// ---- مدیریت گالری تصاویر ----
router.post('/products/:productId/images', authenticate, isAdmin, uploadSingle, productImageController.uploadProductImage);
router.post('/products/:productId/images/multiple', authenticate, isAdmin, uploadMultiple, productImageController.uploadMultipleProductImages);
router.delete('/products/:productId/images/:imageId', authenticate, isAdmin, productImageController.deleteProductImage);
router.put('/products/:productId/images/reorder', authenticate, isAdmin, productImageController.reorderProductImages);

// ---- مدیریت نظرات صفحه اصلی (ادمین) ----
router.get('/admin/testimonials', authenticate, isAdmin, testimonialController.getAllTestimonials);
router.get('/admin/testimonials/:id', authenticate, isAdmin, testimonialController.getTestimonialById);
router.post('/admin/testimonials', authenticate, isAdmin, testimonialController.createTestimonial);
router.put('/admin/testimonials/:id', authenticate, isAdmin, testimonialController.updateTestimonial);
router.delete('/admin/testimonials/:id', authenticate, isAdmin, testimonialController.softDeleteTestimonial);

// ---- مدیریت سطل زباله نظرات ----
router.get('/admin/trash/testimonials', authenticate, isAdmin, testimonialController.getTrashedTestimonials);
router.put('/admin/trash/testimonials/:id/restore', authenticate, isAdmin, testimonialController.restoreTestimonial);
router.delete('/admin/trash/testimonials/:id/force', authenticate, isAdmin, testimonialController.forceDeleteTestimonial);

module.exports = router;