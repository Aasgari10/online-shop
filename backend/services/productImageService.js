// backend/services/productImageService.js
const logger = require("../utils/logger");
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const fs = require('fs');
const path = require('path');

// ============================================================
// دریافت تصاویر محصول (شامل تصویر اصلی)
// ============================================================
const getProductImages = async (productId) => {
  // ۱. دریافت تصاویر گالری
  const [rows] = await pool.query(
    'SELECT id, product_id, image_url, order_index, created_at FROM product_images WHERE product_id = ? ORDER BY order_index ASC, id ASC',
    [productId]
  );

  // ۲. دریافت تصویر اصلی محصول
  const [product] = await pool.query(
    'SELECT image_url FROM products WHERE id = ? AND deleted_at IS NULL',
    [productId]
  );
  const mainImageUrl = product.length > 0 ? product[0].image_url : null;

  // ۳. اگر تصویر اصلی وجود ندارد، فقط گالری را برگردان
  if (!mainImageUrl) {
    return rows;
  }

  // ۴. بررسی وجود تصویر اصلی در گالری (با مقایسه URL)
  const mainExists = rows.some(row => row.image_url === mainImageUrl);

  // ۵. اگر تصویر اصلی در گالری نیست، آن را به‌عنوان اولین آیتم اضافه کن
  if (!mainExists) {
    return [
      {
        id: 0, // شناسه ویژه برای تصویر اصلی
        product_id: parseInt(productId),
        image_url: mainImageUrl,
        order_index: 0,
        created_at: null,
        is_legacy: true, // نشانه‌ای که این تصویر از فیلد قدیمی است
      },
      ...rows,
    ];
  }

  return rows;
};

// ============================================================
// افزودن تصویر جدید
// ============================================================
const addProductImage = async (productId, imageUrl, orderIndex = null) => {
  if (orderIndex === null) {
    const [result] = await pool.query(
      'SELECT MAX(order_index) as maxOrder FROM product_images WHERE product_id = ?',
      [productId]
    );
    orderIndex = (result[0]?.maxOrder || 0) + 1;
  }

  const [insertResult] = await pool.query(
    'INSERT INTO product_images (product_id, image_url, order_index) VALUES (?, ?, ?)',
    [productId, imageUrl, orderIndex]
  );

  logger.info(`🖼️ تصویر جدید برای محصول ${productId} اضافه شد (ID: ${insertResult.insertId})`);
  return { id: insertResult.insertId, product_id: productId, image_url: imageUrl, order_index: orderIndex };
};

// ============================================================
// حذف یک تصویر (غیرقابل حذف برای تصویر اصلی)
// ============================================================
const deleteProductImage = async (imageId, productId) => {
  // ❌ جلوگیری از حذف تصویر اصلی (id=0)
  if (imageId === 0) {
    throw new AppError('تصویر اصلی قابل حذف نیست', 400);
  }

  const [rows] = await pool.query(
    'SELECT image_url FROM product_images WHERE id = ? AND product_id = ?',
    [imageId, productId]
  );
  if (rows.length === 0) {
    throw new AppError('تصویر یافت نشد', 404);
  }

  await pool.query('DELETE FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId]);

  const imagePath = path.join(__dirname, '..', rows[0].image_url);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
    logger.info(`🗑️ فایل تصویر حذف شد: ${rows[0].image_url}`);
  }

  logger.info(`🗑️ تصویر ${imageId} از محصول ${productId} حذف شد`);
  return true;
};

// ============================================================
// تغییر ترتیب تصاویر (غیرقابل تغییر برای تصویر اصلی)
// ============================================================
const reorderProductImages = async (productId, imageOrders) => {
  // ❌ جلوگیری از تغییر ترتیب تصویر اصلی (id=0)
  const filteredOrders = imageOrders.filter(item => item.id !== 0);
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of filteredOrders) {
      await connection.query(
        'UPDATE product_images SET order_index = ? WHERE id = ? AND product_id = ?',
        [item.order_index, item.id, productId]
      );
    }
    await connection.commit();
    logger.info(`🔄 ترتیب تصاویر محصول ${productId} به‌روزرسانی شد`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ============================================================
// حذف تمام تصاویر یک محصول
// ============================================================
const deleteAllProductImages = async (productId) => {
  const [rows] = await pool.query(
    'SELECT image_url FROM product_images WHERE product_id = ?',
    [productId]
  );
  await pool.query('DELETE FROM product_images WHERE product_id = ?', [productId]);

  for (const row of rows) {
    const imagePath = path.join(__dirname, '..', row.image_url);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  logger.info(`🗑️ تمام تصاویر محصول ${productId} حذف شدند (${rows.length} فایل)`);
};

module.exports = {
  getProductImages,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  deleteAllProductImages,
};