const logger = require("../utils/logger");
// backend/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const noCache = require('../middleware/noCache');
const notificationController = require('../controllers/notificationController');

// دریافت تعداد نوتیفیکیشن‌های ادمین (فقط ادمین)
// مسیر نهایی: /api/admin/notifications
router.get('/admin/notifications', authenticate, isAdmin, noCache, notificationController.getAdminNotifications);

module.exports = router;