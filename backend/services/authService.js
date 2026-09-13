// backend/services/authService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middleware/errorHandler');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('⚠️ JWT_SECRET از env خوانده نشد! استفاده از مقدار پیش‌فرض موقت.');
    return 'temporary-secret-key-for-debugging-only';
  }
  return secret;
};

const registerUser = async (name, email, password) => {
  const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existingUsers.length > 0) {
    throw new AppError('این ایمیل قبلاً ثبت شده است', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashedPassword]
  );

  const userId = result.insertId;
  const token = jwt.sign(
    { userId, email, role: 'user' },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info(`👤 کاربر جدید ثبت‌نام کرد: ${email} (ID: ${userId})`);

  return {
    token,
    user: { id: userId, name, email, role: 'user' },
  };
};

const loginUser = async (email, password) => {
  const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    throw new AppError('ایمیل یا رمز عبور اشتباه است', 401);
  }

  const user = users[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('ایمیل یا رمز عبور اشتباه است', 401);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  logger.info(`🔑 کاربر وارد شد: ${email} (ID: ${user.id})`);

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

module.exports = { registerUser, loginUser };