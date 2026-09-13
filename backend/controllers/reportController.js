const logger = require("../utils/logger");
// backend/controllers/reportController.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, status, categoryId } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('لطفاً تاریخ شروع و پایان را وارد کنید', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // ============================================================
    // ۱. ساخت شرط WHERE پویا
    // ============================================================
    let whereClause = `o.created_at BETWEEN ? AND ? AND o.deleted_at IS NULL`;
    const params = [start, end];

    if (status && status !== 'همه') {
      whereClause += ` AND o.status = ?`;
      params.push(status);
    }

    let categoryJoin = '';
    let categoryWhere = '';
    if (categoryId && categoryId !== 'همه') {
      categoryJoin = `
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
      `;
      categoryWhere = ` AND p.category_id = ?`;
      params.push(parseInt(categoryId));
    }

    // ============================================================
    // ۲. آمار کلی
    // ============================================================
    let statsQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as totalOrders,
        SUM(o.total_price) as totalSales,
        AVG(o.total_price) as averageOrderValue,
        COUNT(DISTINCT o.user_id) as totalCustomers
      FROM orders o
      ${categoryJoin}
      WHERE ${whereClause} ${categoryWhere}
        AND o.status != 'لغو شده'
    `;
    const [statsResult] = await pool.query(statsQuery, params);

    // ============================================================
    // ۳. لیست سفارشات (با اطلاعات کد تخفیف)
    // ============================================================
    let ordersQuery = `
      SELECT 
        o.id,
        o.user_id,
        o.tracking_code,
        o.total_price,
        o.status,
        o.created_at,
        o.discount_amount,
        u.name as user_name,
        u.email as user_email,
        a.province,
        a.city,
        a.address,
        a.phone,
        a.receiver_name,
        dc.code as discount_code,
        dc.discount_type as discount_type,
        dc.discount_value as discount_value
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN discount_codes dc ON o.discount_code_id = dc.id
      ${categoryJoin}
      WHERE ${whereClause} ${categoryWhere}
        AND o.status != 'لغو شده'
      ORDER BY o.created_at DESC
    `;
    const [orders] = await pool.query(ordersQuery, params);

    // دریافت آیتم‌های هر سفارش
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await pool.query(
        `SELECT 
          oi.*, 
          p.name as product_name,
          cv.value as color_name,
          sv.value as size_name,
          fp.original_price as original_price,
          oi.attribute_values_json
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         LEFT JOIN attribute_values cv ON oi.color_value_id = cv.id
         LEFT JOIN attribute_values sv ON oi.size_value_id = sv.id
         LEFT JOIN featured_products fp ON fp.product_id = oi.product_id AND fp.type = 'discount' AND fp.deleted_at IS NULL
         WHERE oi.order_id = ?`,
        [order.id]
      );
      return { ...order, items };
    }));

    // ============================================================
    // ۴. فروش به تفکیک روز
    // ============================================================
    let dailySalesQuery = `
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as orders,
        SUM(o.total_price) as sales
      FROM orders o
      ${categoryJoin}
      WHERE ${whereClause} ${categoryWhere}
        AND o.status != 'لغو شده'
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `;
    const [dailySales] = await pool.query(dailySalesQuery, params);

    // ============================================================
    // ۵. محصولات پرفروش
    // ============================================================
    let topProductsQuery = `
      SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as totalQuantity,
        SUM(oi.quantity * oi.price) as totalRevenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE ${whereClause}
        AND o.status != 'لغو شده'
        ${categoryId && categoryId !== 'همه' ? `AND p.category_id = ?` : ''}
      GROUP BY p.id, p.name
      ORDER BY totalQuantity DESC
      LIMIT 10
    `;
    let topParams = [...params];
    if (categoryId && categoryId !== 'همه') {
      topParams.push(parseInt(categoryId));
    }
    const [topProducts] = await pool.query(topProductsQuery, topParams);

    // ============================================================
    // ۶. توزیع وضعیت
    // ============================================================
    let statusDistributionQuery = `
      SELECT 
        o.status,
        COUNT(*) as count
      FROM orders o
      ${categoryJoin}
      WHERE ${whereClause} ${categoryWhere}
      GROUP BY o.status
    `;
    const [statusDistribution] = await pool.query(statusDistributionQuery, params);

    // ============================================================
    // ۷. تعداد کل محصولات فروخته شده
    // ============================================================
    let totalItemsQuery = `
      SELECT SUM(oi.quantity) as totalItems
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE ${whereClause}
        AND o.status != 'لغو شده'
        ${categoryId && categoryId !== 'همه' ? `AND p.category_id = ?` : ''}
    `;
    let totalItemsParams = [...params];
    if (categoryId && categoryId !== 'همه') {
      totalItemsParams.push(parseInt(categoryId));
    }
    const [totalItemsResult] = await pool.query(totalItemsQuery, totalItemsParams);

    // ============================================================
    // ۸. پاسخ نهایی (بدون attributeTypes و attributeValues)
    // ============================================================
    const summary = {
      totalOrders: Number(statsResult[0]?.totalOrders) || 0,
      totalSales: Number(statsResult[0]?.totalSales) || 0,
      averageOrderValue: Number(statsResult[0]?.averageOrderValue) || 0,
      totalCustomers: Number(statsResult[0]?.totalCustomers) || 0,
      totalItems: Number(totalItemsResult[0]?.totalItems) || 0,
    };

    res.json({
      success: true,
      data: {
        summary,
        orders: ordersWithItems,
        dailySales,
        topProducts,
        statusDistribution,
        period: { startDate, endDate },
        filters: { status: status || 'همه', categoryId: categoryId || 'همه' },
        // ✅ attributeTypes و attributeValues حذف شدند
      },
    });
  } catch (error) {
    console.error('❌ [reportController] خطا:', error);
    next(error);
  }
};

module.exports = { getSalesReport };