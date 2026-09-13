const logger = require("../utils/logger");
// backend/routes/attributeRoutes.js
const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attributeController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// ============================================================
// ✅ مسیرهای عمومی (فروشگاه - بدون احراز هویت)
// ============================================================

// دریافت همه رنگ‌ها (عمومی)
router.get('/colors', attributeController.getColors);

// دریافت ویژگی‌های اختصاصی یک محصول (عمومی)
router.get('/products/:productId/custom-attributes', attributeController.getProductCustomAttributes);

// ❌ مسیر variations حذف شد (به productRoutes منتقل شد)

// ============================================================
// ✅ مسیرهای ادمین (نیاز به احراز هویت و نقش ادمین)
// ============================================================

// مدیریت رنگ‌های محصول
router.post('/admin/products/:productId/colors', authenticate, isAdmin, attributeController.addProductColor);
router.delete('/admin/products/:productId/colors/:attributeValueId', authenticate, isAdmin, attributeController.removeProductColor);

// مدیریت ویژگی‌های اختصاصی محصول
router.put('/admin/products/:productId/custom-attributes', authenticate, isAdmin, attributeController.updateProductCustomAttributes);

// مدیریت ترکیبات (Variations)
router.post('/admin/products/:productId/variations/dynamic', authenticate, isAdmin, attributeController.createDynamicVariation);
router.put('/admin/variations/:variationId', authenticate, isAdmin, attributeController.updateVariation);
router.delete('/admin/variations/:variationId', authenticate, isAdmin, attributeController.deleteVariation);
router.delete('/admin/variations/batch', authenticate, isAdmin, attributeController.deleteVariationsBatch);

module.exports = router;