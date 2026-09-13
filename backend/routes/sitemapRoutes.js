// backend/routes/sitemapRoutes.js
const logger = require("../utils/logger");
const express = require('express');
const router = express.Router();
const { generateSitemap } = require('../controllers/sitemapController');

// ============================================================
// مسیر نقشه سایت (بدون احراز هویت - عمومی)
// ============================================================
router.get('/sitemap.xml', generateSitemap);

module.exports = router;