const logger = require("../utils/logger");
// backend/routes/pageRoutes.js
const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// ✅ مسیرهای عمومی (بدون احراز هویت)
router.get('/pages/:slug', pageController.getPageBySlug);

// ✅ مسیرهای مدیریت (فقط ادمین)
router.get('/admin/pages', authenticate, isAdmin, pageController.getAllPages);
router.get('/admin/pages/:id', authenticate, isAdmin, pageController.getPageById);
router.post('/admin/pages', authenticate, isAdmin, pageController.createPage);
router.put('/admin/pages/:id', authenticate, isAdmin, pageController.updatePage);
router.delete('/admin/pages/:id', authenticate, isAdmin, pageController.softDeletePage);
router.put('/admin/trash/pages/:id/restore', authenticate, isAdmin, pageController.restorePage);
router.delete('/admin/trash/pages/:id/force', authenticate, isAdmin, pageController.forceDeletePage);
router.get('/admin/trash/pages', authenticate, isAdmin, pageController.getTrashedPages);

module.exports = router;