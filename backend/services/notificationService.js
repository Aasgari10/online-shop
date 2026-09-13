const logger = require("../utils/logger");
// backend/services/notificationService.js
const pool = require('../config/db');

const getAdminNotifications = async () => {
  try {
    // ۱. نظرات جدید (در انتظار تایید)
    const [pendingReviews] = await pool.query(
      `SELECT COUNT(*) as count FROM reviews 
       WHERE is_approved = 0 AND deleted_at IS NULL AND parent_id IS NULL`
    );

    // ۲. سفارشات پرداخت‌شده جدید (خوانده‌نشده توسط ادمین)
    const [newOrders] = await pool.query(
      `SELECT COUNT(*) as count FROM orders 
       WHERE status = 'پرداخت شده' 
         AND is_admin_read = false
         AND deleted_at IS NULL`
    );

    // ۳. تیکت‌های خوانده‌نشده توسط ادمین
    const [unreadTickets] = await pool.query(
      `SELECT COUNT(*) as count FROM support_tickets 
       WHERE is_read_by_admin = FALSE 
         AND deleted_at IS NULL 
         AND status != 'closed'`
    );

    const result = {
      pendingReviews: Number(pendingReviews[0]?.count) || 0,
      newOrders: Number(newOrders[0]?.count) || 0,
      unreadTickets: Number(unreadTickets[0]?.count) || 0,
      total: (Number(pendingReviews[0]?.count) || 0) + 
             (Number(newOrders[0]?.count) || 0) + 
             (Number(unreadTickets[0]?.count) || 0)
    };

    return result;
  } catch (error) {
    console.error('❌ [NotificationService] خطا در دریافت نوتیفیکیشن‌ها:', error);
    return {
      pendingReviews: 0,
      newOrders: 0,
      unreadTickets: 0,
      total: 0
    };
  }
};

module.exports = {
  getAdminNotifications
};