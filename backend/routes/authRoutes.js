const logger = require("../utils/logger");
// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, logout } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

// ✅ اعتبارسنجی ثبت‌نام با Escape
const validateRegister = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('نام باید بین ۲ تا ۱۰۰ کاراکتر باشد'),
  body('email')
    .trim()
    .escape()
    .isEmail()
    .normalizeEmail()
    .withMessage('ایمیل معتبر نیست'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
];

// ✅ اعتبارسنجی ورود
const validateLogin = [
  body('email')
    .trim()
    .escape()
    .isEmail()
    .normalizeEmail()
    .withMessage('ایمیل معتبر نیست'),
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
];

router.post('/auth/register', validateRegister, register);
router.post('/auth/login', validateLogin, login);
router.post('/auth/logout', authenticate, logout);

module.exports = router;