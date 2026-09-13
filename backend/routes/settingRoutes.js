const logger = require("../utils/logger");
// backend/routes/settingRoutes.js
const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// ✅ مسیر عمومی (بدون احراز هویت)
router.get('/settings', settingController.getPublicSettings);

// ✅ مسیرهای ادمین
router.get('/admin/settings', authenticate, isAdmin, settingController.getAllSettings);
router.put('/admin/settings', authenticate, isAdmin, settingController.updateSettings);

module.exports = router;