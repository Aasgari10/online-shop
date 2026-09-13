const logger = require("../utils/logger");
// backend/routes/staticPageRoutes.js
const express = require('express');
const router = express.Router();
const staticPageController = require('../controllers/staticPageController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// ============================================================
// مسیرهای عمومی (بدون احراز هویت)
// ============================================================
router.get('/pages/:slug', staticPageController.getPageBySlug);

// ============================================================
// مسیرهای مدیریت (فقط ادمین)
// ============================================================
router.get('/admin/pages', authenticate, isAdmin, staticPageController.getAllPages);
router.get('/admin/pages/:id', authenticate, isAdmin, staticPageController.getPageById);
router.post('/admin/pages', authenticate, isAdmin, staticPageController.createPage);
router.put('/admin/pages/:id', authenticate, isAdmin, staticPageController.updatePage);
router.delete('/admin/pages/:id', authenticate, isAdmin, staticPageController.softDeletePage);

// ============================================================
// مسیرهای سطل زباله (فقط ادمین)
// ============================================================
router.get('/admin/trash/pages', authenticate, isAdmin, staticPageController.getTrashedPages);
router.put('/admin/trash/pages/:id/restore', authenticate, isAdmin, staticPageController.restorePage);
router.delete('/admin/trash/pages/:id/force', authenticate, isAdmin, staticPageController.forceDeletePage);

module.exports = router;