const logger = require("../utils/logger");
// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const reportController = require('../controllers/reportController');

// همه مسیرها نیاز به احراز هویت و ادمین بودن دارند
router.use(authenticate, isAdmin);

// دریافت گزارش فروش بر اساس بازه زمانی
router.get('/sales', reportController.getSalesReport);

module.exports = router;