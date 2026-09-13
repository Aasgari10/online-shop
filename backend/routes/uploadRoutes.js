// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { uploadSingle } = require('../config/multer');
const { uploadFile } = require('../controllers/uploadController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

/**
 * مسیر آپلود عمومی (فقط ادمین)
 * از تنظیمات multer موجود استفاده می‌کند که تصاویر را با حداکثر ۵ مگابایت می‌پذیرد
 */
router.post('/upload', authenticate, isAdmin, uploadSingle, uploadFile);

module.exports = router;