// backend/routes/adminRoutes.js
const logger = require("../utils/logger");
logger.info('🔵 [adminRoutes] شروع بارگذاری...');

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const { body } = require('express-validator');
const { uploadSingle } = require('../config/multer');
const pool = require('../config/db');

// ===== کنترلرها =====
logger.info('🔵 [adminRoutes] بارگذاری adminController...');
const adminController = require('../controllers/adminController');

logger.info('🔵 [adminRoutes] بارگذاری categoryController...');
const categoryController = require('../controllers/categoryController');

logger.info('🔵 [adminRoutes] بارگذاری bannerController...');
const bannerController = require('../controllers/bannerController');

logger.info('🔵 [adminRoutes] بارگذاری featuredController...');
const featuredController = require('../controllers/featuredController');

logger.info('🔵 [adminRoutes] بارگذاری orderController...');
const orderController = require('../controllers/orderController');

logger.info('🔵 [adminRoutes] بارگذاری reviewController...');
const reviewController = require('../controllers/reviewController');

logger.info('🔵 [adminRoutes] بارگذاری productController...');
const productController = require('../controllers/productController');

logger.info('🔵 [adminRoutes] بارگذاری ticketController...');
const ticketController = require('../controllers/ticketController');

logger.info('🔵 [adminRoutes] بارگذاری userController...');
const {
  getAllUsers,
  deleteUser,
  restoreUser,
  forceDeleteUser,
  getTrashedUsers,
  updateUserRole,
} = require('../controllers/userController');

logger.info('✅ [adminRoutes] همه کنترلرها با موفقیت بارگذاری شدند');

// ===== اعتبارسنجی پاسخ تیکت =====
const validateReply = [
  body('message')
    .trim()
    .escape()
    .isLength({ min: 1, max: 5000 })
    .withMessage('پیام پاسخ باید بین ۱ تا ۵۰۰۰ کاراکتر باشد'),
];

// ===== همه مسیرها نیاز به احراز هویت و ادمین بودن دارند =====
router.use(authenticate, isAdmin);

// ============================================================
// 📊 داشبورد
// ============================================================
router.get('/stats', adminController.getStats);

// ============================================================
// 👥 کاربران
// ============================================================
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);

// سطل زباله کاربران
router.get('/trash/users', getTrashedUsers);
router.put('/trash/users/:id/restore', restoreUser);
router.delete('/trash/users/:id/force', forceDeleteUser);

// ============================================================
// 📂 دسته‌بندی‌ها
// ============================================================
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// سطل زباله دسته‌بندی‌ها
router.get('/categories/trash', categoryController.getTrashedCategories);
router.put('/categories/:id/restore', categoryController.restoreCategory);
router.delete('/categories/:id/force', categoryController.forceDeleteCategory);

// ============================================================
// 🖼️ بنرها
// ============================================================
router.get('/banners', bannerController.getBanners);
router.post('/banners', uploadSingle, bannerController.createBanner);
router.put('/banners/:id', uploadSingle, bannerController.updateBanner);
router.delete('/banners/:id', bannerController.softDeleteBanner);

// سطل زباله بنرها
router.get('/trash/banners', bannerController.getTrashedBanners);
router.put('/trash/banners/:id/restore', bannerController.restoreBanner);
router.delete('/trash/banners/:id/force', bannerController.forceDeleteBanner);

// ============================================================
// ⭐ محصولات ویژه (Featured)
// ============================================================
router.get('/featured', featuredController.getFeaturedProducts);
router.post('/featured', featuredController.addFeatured);
router.put('/featured/:id', featuredController.updateFeatured);
router.delete('/featured/:id', featuredController.softDeleteFeatured);

// سطل زباله محصولات ویژه
router.get('/trash/featured', featuredController.getTrashedFeatured);
router.put('/trash/featured/:id/restore', featuredController.restoreFeatured);
router.delete('/trash/featured/:id/force', featuredController.forceDeleteFeatured);

// ============================================================
// 📦 محصولات (سطل زباله)
// ============================================================
router.get('/trash/products', productController.getTrashedProducts);
router.put('/trash/products/:id/restore', productController.restoreProduct);
router.delete('/trash/products/:id/force', productController.forceDeleteProduct);

// ============================================================
// 💬 نظرات
// ============================================================
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:reviewId', reviewController.softDeleteReview);

// سطل زباله نظرات
router.get('/trash/reviews', reviewController.getTrashedReviews);
router.put('/trash/reviews/:reviewId/restore', reviewController.restoreReview);
router.delete('/trash/reviews/:reviewId/force', reviewController.forceDeleteReview);

// ============================================================
// 📋 سفارشات
// ============================================================
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.delete('/orders/:id', adminController.deleteOrder);

// سطل زباله سفارشات
router.get('/trash/orders', orderController.getTrashedOrders);
router.put('/trash/orders/:id/restore', orderController.restoreOrder);
router.delete('/trash/orders/:id/force', orderController.forceDeleteOrder);

// ============================================================
// 🎫 تیکت‌ها (اصلاح‌شده)
// ============================================================
router.get('/tickets', ticketController.getAllTickets);
router.post('/tickets/:ticketId/reply', validateReply, ticketController.adminReplyToTicket);
router.delete('/tickets/:ticketId', ticketController.softDeleteTicket);

// سطل زباله تیکت‌ها
router.get('/trash/tickets', ticketController.getTrashedTickets);
router.put('/trash/tickets/:ticketId/restore', ticketController.restoreTicket);
router.delete('/trash/tickets/:ticketId/force', ticketController.forceDeleteTicket);

// ============================================================
// 🧪 مسیرهای دیباگ، تست و ابزارها (فقط ادمین)
// ============================================================

// ۱. مسیر دیباگ برای بررسی وضعیت سفارش
router.get('/debug-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    logger.info(`🧪 [Debug] بررسی سفارش ${orderId}`);

    const [order] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [reservations] = await pool.query('SELECT * FROM reservations WHERE order_id = ?', [orderId]);
    const [nowResult] = await pool.query('SELECT NOW() as server_time');
    const [allReservations] = await pool.query('SELECT * FROM reservations');

    res.json({
      success: true,
      data: {
        order: order[0] || null,
        reservations: reservations,
        allReservations: allReservations,
        server_time: nowResult[0],
        timezone: process.env.TZ,
      }
    });
  } catch (error) {
    console.error('❌ [Debug] خطا:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ۲. مسیر تست دستی برای پاکسازی رزروهای منقضی
const { cleanupExpiredReservations } = require('../services/orderService');

router.post('/force-cleanup-expired', async (req, res) => {
  try {
    logger.info('🧪 [ForceCleanup] درخواست دستی پاکسازی رزروهای منقضی...');
    await cleanupExpiredReservations();
    res.json({ 
      success: true, 
      message: 'پاکسازی دستی رزروهای منقضی با موفقیت انجام شد' 
    });
  } catch (error) {
    console.error('❌ [ForceCleanup] خطا:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ۳. مسیر لغو دستی یک سفارش خاص
router.put('/force-cancel-order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    logger.info(`🧹 [ForceCancel] لغو دستی سفارش ${orderId}`);

    const [order] = await pool.query(
      'SELECT id, status FROM orders WHERE id = ? AND deleted_at IS NULL',
      [orderId]
    );
    if (order.length === 0) {
      return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });
    }

    if (order[0].status === 'پرداخت شده') {
      return res.status(400).json({ success: false, message: 'سفارش قبلاً پرداخت شده است' });
    }

    if (order[0].status === 'لغو شده') {
      return res.status(400).json({ success: false, message: 'سفارش قبلاً لغو شده است' });
    }

    await pool.query('DELETE FROM reservations WHERE order_id = ?', [orderId]);
    await pool.query("UPDATE orders SET status = 'لغو شده' WHERE id = ?", [orderId]);

    logger.info(`✅ [ForceCancel] سفارش ${orderId} با موفقیت لغو شد`);
    res.json({ 
      success: true, 
      message: `سفارش ${orderId} با موفقیت لغو شد` 
    });
  } catch (error) {
    console.error('❌ [ForceCancel] خطا:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ۴. مسیر ایجاد سفارش تست با تایمر ۱ دقیقه
router.post('/test-create-order', async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info(`🧪 [TestOrder] ایجاد سفارش تست برای کاربر ${userId} با تایمر ۱ دقیقه`);

    const [products] = await pool.query(
      'SELECT id, name, price, stock FROM products WHERE stock > 0 AND deleted_at IS NULL LIMIT 1'
    );
    if (products.length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ محصول موجودی یافت نشد' });
    }
    const product = products[0];

    const [addresses] = await pool.query(
      'SELECT id FROM addresses WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
      [userId]
    );
    if (addresses.length === 0) {
      return res.status(400).json({ success: false, message: 'لطفاً ابتدا یک آدرس ثبت کنید' });
    }
    const addressId = addresses[0].id;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const totalPrice = product.price * 1;
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, address_id, total_price, status) VALUES (?, ?, ?, ?)',
        [userId, addressId, totalPrice, 'در انتظار پرداخت']
      );
      const orderId = orderResult.insertId;

      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, product.id, 1, product.price]
      );

      await connection.query(
        `INSERT INTO reservations (order_id, product_id, quantity, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 MINUTE))`,
        [orderId, product.id, 1]
      );

      await connection.commit();

      logger.info(`✅ [TestOrder] سفارش تست ${orderId} با تایمر ۱ دقیقه ایجاد شد`);

      res.json({
        success: true,
        message: 'سفارش تست با تایمر ۱ دقیقه ایجاد شد',
        data: {
          orderId: orderId,
          product: product.name,
          price: totalPrice,
          expires_in: '1 دقیقه'
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ [TestOrder] خطا:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ۵. مسیر تست مستقیم تغییر وضعیت (برای رفع خطای ENUM)
router.put('/test-update-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    logger.info(`🧪 [TestStatus] تغییر وضعیت سفارش ${orderId} به "${status}"`);

    const validStatuses = ['در انتظار پرداخت', 'پرداخت شده', 'ارسال شده', 'تحویل داده شده', 'لغو شده'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `وضعیت نامعتبر است. مقادیر مجاز: ${validStatuses.join(', ')}` 
      });
    }

    const [order] = await pool.query(
      'SELECT id FROM orders WHERE id = ? AND deleted_at IS NULL',
      [orderId]
    );
    if (order.length === 0) {
      return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });
    }

    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی' });
    }
    
    logger.info(`✅ [TestStatus] سفارش ${orderId} به "${status}" تغییر یافت`);
    res.json({ 
      success: true, 
      message: `سفارش ${orderId} به "${status}" تغییر یافت` 
    });
  } catch (error) {
    console.error('❌ [TestStatus] خطا:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// 🐛 ۶. مسیر دیباگ برای بررسی کد تخفیف
// ============================================================
router.get('/debug-discount-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    logger.info(`🧪 [Debug] بررسی کد تخفیف: ${code}`);
    
    const [rows] = await pool.query(
      'SELECT * FROM discount_codes WHERE code = ? AND deleted_at IS NULL',
      [code]
    );
    
    if (rows.length === 0) {
      return res.json({ success: false, message: 'کد تخفیف یافت نشد' });
    }
    
    const discount = rows[0];
    
    // دریافت سفارشاتی که از این کد استفاده کرده‌اند
    const [orders] = await pool.query(
      'SELECT id, total_price, discount_amount, created_at FROM orders WHERE discount_code_id = ? ORDER BY created_at DESC',
      [discount.id]
    );
    
    res.json({
      success: true,
      data: {
        discount,
        orders,
        usedCount: orders.length,
      }
    });
  } catch (error) {
    console.error('❌ [Debug] خطا:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// 🐛 ۷. مسیر دیباگ برای محاسبه دقیق تخفیف‌ها (جدید)
// ============================================================
router.get('/debug-order-calculation', async (req, res) => {
  try {
    const { productId, discountCode, variationId } = req.query;
    
    logger.info(`🧪 [Debug-Calc] شروع محاسبه تخفیف‌ها`);
    logger.info(`🧪 [Debug-Calc] productId: ${productId}, discountCode: ${discountCode}, variationId: ${variationId}`);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId الزامی است' });
    }

    // ۱. دریافت محصول
    const [product] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND deleted_at IS NULL',
      [productId]
    );
    if (!product.length) {
      return res.status(404).json({ success: false, message: 'محصول یافت نشد' });
    }
    const productData = product[0];
    let originalPrice = parseFloat(productData.price) || 0;

    // ۲. اگر variationId وجود دارد، قیمت ترکیب را دریافت کن
    let variationPrice = null;
    if (variationId) {
      const [variation] = await pool.query(
        'SELECT price, stock FROM product_variations WHERE id = ? AND product_id = ?',
        [variationId, productId]
      );
      if (variation.length > 0 && variation[0].price !== null) {
        variationPrice = parseFloat(variation[0].price) || 0;
        originalPrice = variationPrice;
        logger.info(`🧪 [Debug-Calc] قیمت ترکیب ${variationId}: ${originalPrice}`);
      }
    }

    // ۳. دریافت تخفیف ویژه
    let featuredDiscount = 0;
    let priceAfterFeatured = originalPrice;
    let featuredData = null;

    let featuredQuery = `
      SELECT * FROM featured_products 
      WHERE product_id = ? AND type = 'discount' AND deleted_at IS NULL
      AND (end_time IS NULL OR end_time > UNIX_TIMESTAMP(NOW()) * 1000)
    `;
    let featuredParams = [productId];

    if (variationId) {
      featuredQuery += ` AND (variation_id = ? OR variation_id IS NULL)`;
      featuredParams.push(variationId);
    }

    const [featured] = await pool.query(featuredQuery, featuredParams);
    
    if (featured.length > 0) {
      // اولویت با تخفیف مخصوص ترکیب
      let selectedFeatured = featured.find(f => f.variation_id === parseInt(variationId));
      if (!selectedFeatured) {
        selectedFeatured = featured.find(f => f.variation_id === null);
      }
      if (selectedFeatured) {
        featuredData = selectedFeatured;
        const percent = parseFloat(selectedFeatured.discount_percent) || 0;
        featuredDiscount = Math.round(originalPrice * (percent / 100));
        priceAfterFeatured = originalPrice - featuredDiscount;
        logger.info(`🧪 [Debug-Calc] تخفیف ویژه: ${percent}% = ${featuredDiscount} تومان`);
      }
    }

    // ۴. دریافت کد تخفیف
    let discountCodeData = null;
    let discountAmount = 0;
    let finalPrice = priceAfterFeatured;

    if (discountCode) {
      const [codeRows] = await pool.query(
        `SELECT * FROM discount_codes 
         WHERE code = ? AND deleted_at IS NULL AND is_active = 1
         AND (usage_limit IS NULL OR used_count < usage_limit)
         AND start_date <= NOW() 
         AND (end_date IS NULL OR end_date >= NOW())`,
        [discountCode]
      );
      
      if (codeRows.length > 0) {
        discountCodeData = codeRows[0];
        
        // محاسبه تخفیف کد
        if (discountCodeData.discount_type === 'percent') {
          discountAmount = Math.round(priceAfterFeatured * (discountCodeData.discount_value / 100));
        } else {
          discountAmount = Math.min(parseFloat(discountCodeData.discount_value) || 0, priceAfterFeatured);
        }
        discountAmount = Math.round(discountAmount);
        
        // اعمال سقف تخفیف
        if (discountCodeData.max_discount_amount !== null && discountAmount > parseFloat(discountCodeData.max_discount_amount)) {
          logger.info(`🧪 [Debug-Calc] اعمال سقف تخفیف: ${discountAmount} -> ${discountCodeData.max_discount_amount}`);
          discountAmount = Math.round(parseFloat(discountCodeData.max_discount_amount));
        }
        
        finalPrice = Math.max(0, priceAfterFeatured - discountAmount);
        logger.info(`🧪 [Debug-Calc] تخفیف کد: ${discountAmount} تومان`);
      } else {
        logger.info(`🧪 [Debug-Calc] کد تخفیف ${discountCode} نامعتبر است`);
      }
    }

    // ۵. خروجی
    const response = {
      success: true,
      data: {
        product: {
          id: productData.id,
          name: productData.name,
          original_price: originalPrice,
          price: productData.price,
        },
        variation: variationId ? {
          id: variationId,
          price: variationPrice,
        } : null,
        featured: featuredData ? {
          id: featuredData.id,
          discount_percent: featuredData.discount_percent,
          discount_amount: featuredDiscount,
          end_time: featuredData.end_time,
        } : null,
        discountCode: discountCodeData ? {
          id: discountCodeData.id,
          code: discountCodeData.code,
          discount_type: discountCodeData.discount_type,
          discount_value: discountCodeData.discount_value,
          max_discount_amount: discountCodeData.max_discount_amount,
          calculated_discount: discountAmount,
        } : null,
        summary: {
          originalPrice: originalPrice,
          featuredDiscount: featuredDiscount,
          priceAfterFeatured: priceAfterFeatured,
          discountCodeAmount: discountAmount,
          finalPrice: finalPrice,
          // نمایش اختلاف برای دیباگ
          diff: originalPrice - finalPrice,
          totalDiscount: (originalPrice - finalPrice),
        }
      }
    };

    logger.info(`🧪 [Debug-Calc] نتیجه نهایی:`, response.data.summary);
    res.json(response);

  } catch (error) {
    console.error('❌ [Debug-Calc] خطا:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================================
// 🐛 ۸. مسیر دیباگ برای مشاهده محتوای orderService و validateDiscountCode
// ============================================================
router.get('/debug-service-code', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const orderServicePath = path.join(__dirname, '../services/orderService.js');
    const discountServicePath = path.join(__dirname, '../services/discountCodeService.js');
    
    const orderServiceContent = fs.readFileSync(orderServicePath, 'utf8');
    const discountServiceContent = fs.readFileSync(discountServicePath, 'utf8');
    
    // فقط بخش‌های مربوط به تخفیف را نشان بده
    const extractSection = (content, keyword) => {
      const lines = content.split('\n');
      const result = [];
      let inSection = false;
      let braceCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(keyword) && !inSection) {
          inSection = true;
          braceCount = 0;
        }
        if (inSection) {
          result.push(line);
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
          if (braceCount === 0 && line.includes('}')) {
            break;
          }
        }
      }
      return result.join('\n');
    };
    
    res.json({
      success: true,
      data: {
        orderService_createOrder: extractSection(orderServiceContent, 'const createOrder ='),
        discountService_validateDiscountCode: extractSection(discountServiceContent, 'const validateDiscountCode ='),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

logger.info('✅ [adminRoutes] همه مسیرها تعریف شدند');
module.exports = router;

logger.info('✅ [adminRoutes] بارگذاری کامل شد');