const logger = require("../utils/logger");
// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  createOrder,
  applyDiscount,
  confirmPayment,
  cancelOrder,
  updateOrder,
  getOrderById,
  markOrderAsRead,    // ✅ جدید (تکی)
  markOrdersAsRead,   // ✅ جدید (گروهی)
} = require('../controllers/orderController');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// مسیر ثبت سفارش (با رزرو موقت)
router.post('/orders', authenticate, createOrder);

// مسیر اعمال کد تخفیف به سفارش (قبل از پرداخت)
router.post('/orders/:id/apply-discount', authenticate, applyDiscount);

// مسیر تأیید پرداخت (کاهش موجودی واقعی)
router.put('/orders/:id/confirm-payment', authenticate, confirmPayment);

// مسیر لغو سفارش (برای کاربر)
router.put('/orders/:id/cancel', authenticate, cancelOrder);

// مسیر به‌روزرسانی وضعیت سفارش (برای ادمین)
router.put('/orders/:id/status', authenticate, updateOrder);

// مسیر دریافت جزئیات یک سفارش
router.get('/orders/:id', authenticate, getOrderById);

// ✅ مسیر جدید: علامت‌گذاری یک سفارش به عنوان خوانده‌شده (تکی)
router.put('/admin/orders/:id/read', authenticate, isAdmin, markOrderAsRead);

// ✅ مسیر جدید: علامت‌گذاری همه سفارشات به عنوان خوانده‌شده (گروهی)
router.put('/admin/orders/mark-read', authenticate, isAdmin, markOrdersAsRead);

module.exports = router;