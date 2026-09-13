const logger = require("../utils/logger");
// backend/services/addressService.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// دریافت لیست آدرس‌های کاربر
// ============================================================
const getUserAddresses = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, province, city, address, postal_code, phone, receiver_name, is_default, created_at 
     FROM addresses 
     WHERE user_id = ? AND deleted_at IS NULL 
     ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows;
};

// ============================================================
// دریافت یک آدرس با شناسه
// ============================================================
const getAddressById = async (addressId, userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM addresses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [addressId, userId]
  );
  if (rows.length === 0) {
    throw new AppError('آدرس یافت نشد', 404);
  }
  return rows[0];
};

// ============================================================
// افزودن آدرس جدید
// ============================================================
const createAddress = async (userId, data) => {
  const { province, city, address, postal_code, phone, receiver_name, is_default } = data;

  if (!province || !city || !address) {
    throw new AppError('استان، شهر و آدرس الزامی هستند', 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // اگر این آدرس پیش‌فرض است، سایر آدرس‌ها را غیرپیش‌فرض کن
    if (is_default) {
      await connection.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    const [result] = await connection.query(
      `INSERT INTO addresses 
       (user_id, province, city, address, postal_code, phone, receiver_name, is_default) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        province.trim(),
        city.trim(),
        address.trim(),
        postal_code?.trim() || null,
        phone?.trim() || null,
        receiver_name?.trim() || null,
        is_default ? true : false,
      ]
    );

    // اگر اولین آدرس کاربر است، آن را پیش‌فرض کن
    if (!is_default) {
      const [count] = await connection.query(
        'SELECT COUNT(*) as total FROM addresses WHERE user_id = ? AND deleted_at IS NULL',
        [userId]
      );
      if (count[0].total === 1) {
        await connection.query(
          'UPDATE addresses SET is_default = TRUE WHERE id = ?',
          [result.insertId]
        );
      }
    }

    await connection.commit();
    logger.info(`📌 آدرس جدید برای کاربر ${userId} اضافه شد (ID: ${result.insertId})`);

    return {
      id: result.insertId,
      province,
      city,
      address,
      postal_code,
      phone,
      receiver_name,
      is_default: is_default || false,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// ویرایش آدرس
// ============================================================
const updateAddress = async (addressId, userId, data) => {
  const { province, city, address, postal_code, phone, receiver_name, is_default } = data;

  const [existing] = await pool.query(
    'SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [addressId, userId]
  );
  if (existing.length === 0) {
    throw new AppError('آدرس یافت نشد', 404);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (is_default && !existing[0].is_default) {
      await connection.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = ? AND id != ?',
        [userId, addressId]
      );
    }

    await connection.query(
      `UPDATE addresses SET 
        province = ?, city = ?, address = ?, postal_code = ?, 
        phone = ?, receiver_name = ?, is_default = ? 
       WHERE id = ? AND user_id = ?`,
      [
        province.trim(),
        city.trim(),
        address.trim(),
        postal_code?.trim() || null,
        phone?.trim() || null,
        receiver_name?.trim() || null,
        is_default ? true : false,
        addressId,
        userId,
      ]
    );

    await connection.commit();
    logger.info(`✏️ آدرس ${addressId} توسط کاربر ${userId} ویرایش شد`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// حذف آدرس (نرم)
// ============================================================
const deleteAddress = async (addressId, userId) => {
  const [address] = await pool.query(
    'SELECT id, is_default FROM addresses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [addressId, userId]
  );
  if (address.length === 0) {
    throw new AppError('آدرس یافت نشد', 404);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE addresses SET deleted_at = NOW() WHERE id = ?',
      [addressId]
    );

    if (address[0].is_default) {
      const [another] = await connection.query(
        'SELECT id FROM addresses WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
        [userId]
      );
      if (another.length > 0) {
        await connection.query(
          'UPDATE addresses SET is_default = TRUE WHERE id = ?',
          [another[0].id]
        );
      }
    }

    await connection.commit();
    logger.info(`🗑️ آدرس ${addressId} توسط کاربر ${userId} حذف شد`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// تنظیم آدرس پیش‌فرض
// ============================================================
const setDefaultAddress = async (addressId, userId) => {
  const [address] = await pool.query(
    'SELECT id FROM addresses WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [addressId, userId]
  );
  if (address.length === 0) {
    throw new AppError('آدرس یافت نشد', 404);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE addresses SET is_default = FALSE WHERE user_id = ?',
      [userId]
    );
    await connection.query(
      'UPDATE addresses SET is_default = TRUE WHERE id = ?',
      [addressId]
    );

    await connection.commit();
    logger.info(`⭐ آدرس ${addressId} به‌عنوان پیش‌فرض کاربر ${userId} تنظیم شد`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};