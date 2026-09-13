const logger = require("../utils/logger");
// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// ===== مسیرهای عمومی (بدون احراز هویت) =====
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

// ===== مسیرهای ادمین =====
router.post('/admin/categories', authenticate, isAdmin, categoryController.createCategory);
router.put('/admin/categories/:id', authenticate, isAdmin, categoryController.updateCategory);
router.delete('/admin/categories/:id', authenticate, isAdmin, categoryController.deleteCategory);

// ===== مسیرهای سطل زباله (ادمین) =====
router.get('/admin/categories/trash', authenticate, isAdmin, categoryController.getTrashedCategories);
router.put('/admin/categories/:id/restore', authenticate, isAdmin, categoryController.restoreCategory);
router.delete('/admin/categories/:id/force', authenticate, isAdmin, categoryController.forceDeleteCategory);

module.exports = router;