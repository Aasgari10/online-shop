// backend/controllers/authController.js
const logger = require("../utils/logger");
const { validationResult } = require('express-validator');
const { registerUser, loginUser } = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    const { name, email, password } = req.body;
    const result = await registerUser(name, email, password);
    
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(201).json({
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد',
      user: result.user,
    });
  } catch (error) {
    console.error('❌ [register] خطا:', error);
    // ✅ مدیریت خطاهای مربوط به سطل زباله و تکراری بودن ایمیل
    if (error.statusCode === 409 && error.message.includes('سطل زباله')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.message === 'این ایمیل قبلاً ثبت شده است') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      success: true,
      message: 'ورود موفقیت‌آمیز بود',
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'خروج موفق' });
};

module.exports = { register, login, logout };