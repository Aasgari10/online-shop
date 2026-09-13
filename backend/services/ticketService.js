const logger = require("../utils/logger");
// backend/services/ticketService.js
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const getUserTickets = async (userId) => {
  logger.info(`🔍 [getUserTickets] شروع برای userId: ${userId}`);
  const [rows] = await pool.query(
    `SELECT id, user_id, subject, status, is_read_by_user, created_at, updated_at,
            (SELECT COUNT(*) FROM support_replies WHERE ticket_id = t.id) AS replies_count
     FROM support_tickets t
     WHERE user_id = ? AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [userId]
  );
  logger.info(`✅ [getUserTickets] ${rows.length} تیکت دریافت شد`);
  rows.forEach(row => {
    logger.info(`🎫 تیکت ${row.id}: user_id = ${row.user_id}, is_read = ${row.is_read_by_user}`);
  });
  return rows.map(row => ({
    ...row,
    is_read: row.is_read_by_user,
  }));
};

const getTicketDetails = async (userId, userRole, ticketId) => {
  logger.info(`🔍 [getTicketDetails] دریافت جزئیات تیکت ${ticketId} برای کاربر ${userId} (نقش: ${userRole})`);
  
  const [ticketRows] = await pool.query(
    'SELECT * FROM support_tickets WHERE id = ? AND deleted_at IS NULL',
    [ticketId]
  );
  if (ticketRows.length === 0) {
    throw new AppError('تیکت یافت نشد', 404);
  }

  const ticket = ticketRows[0];
  
  if (ticket.user_id !== userId && userRole !== 'admin') {
    throw new AppError('دسترسی غیرمجاز', 403);
  }

  if (userRole !== 'admin' && ticket.is_read_by_user === 0) {
    logger.info(`📖 [getTicketDetails] علامت‌گذاری تیکت ${ticketId} به عنوان خوانده‌شده`);
    const [result] = await pool.query(
      'UPDATE support_tickets SET is_read_by_user = 1, is_read = 1 WHERE id = ? AND user_id = ?',
      [ticketId, userId]
    );
    logger.info(`✅ [getTicketDetails] affectedRows: ${result.affectedRows}`);
    if (result.affectedRows > 0) {
      ticket.is_read_by_user = 1;
      ticket.is_read = 1;
    }
  }
  
  if (userRole === 'admin' && ticket.is_read_by_admin === 0) {
    logger.info(`📖 [getTicketDetails] علامت‌گذاری تیکت ${ticketId} توسط ادمین`);
    await pool.query(
      'UPDATE support_tickets SET is_read_by_admin = 1 WHERE id = ?',
      [ticketId]
    );
  }

  const [replies] = await pool.query(
    `SELECT r.*, u.name AS user_name, u.role
     FROM support_replies r
     JOIN users u ON r.user_id = u.id
     WHERE r.ticket_id = ?
     ORDER BY r.created_at ASC`,
    [ticketId]
  );

  return { ticket, replies };
};

const createTicket = async (userId, subject, message) => {
  if (!subject || !message) {
    throw new AppError('موضوع و پیام الزامی است', 400);
  }

  const [result] = await pool.query(
    `INSERT INTO support_tickets 
     (user_id, subject, message, is_read_by_user, is_read_by_admin, is_read) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, subject, message, true, false, true]
  );

  logger.info(`🎫 تیکت جدید توسط کاربر ${userId} ایجاد شد: ${subject}`);
  return result.insertId;
};

const replyToTicket = async (userId, ticketId, message, isAdmin = false) => {
  if (!message) {
    throw new AppError('پیام پاسخ الزامی است', 400);
  }

  const [ticket] = await pool.query(
    'SELECT id, user_id FROM support_tickets WHERE id = ? AND deleted_at IS NULL',
    [ticketId]
  );
  if (ticket.length === 0) {
    throw new AppError('تیکت یافت نشد یا حذف شده است', 404);
  }

  if (!isAdmin && ticket[0].user_id !== userId) {
    throw new AppError('شما دسترسی به این تیکت ندارید', 403);
  }

  const [statusCheck] = await pool.query(
    'SELECT status FROM support_tickets WHERE id = ?',
    [ticketId]
  );
  if (statusCheck[0].status === 'closed') {
    throw new AppError('این تیکت بسته شده است و نمی‌توان پاسخ داد', 400);
  }

  await pool.query(
    'INSERT INTO support_replies (ticket_id, user_id, message, is_admin) VALUES (?, ?, ?, ?)',
    [ticketId, userId, message, isAdmin]
  );

  if (isAdmin) {
    logger.info(`🔄 [replyToTicket] علامت‌گذاری تیکت ${ticketId} به عنوان ناخوانده توسط ادمین`);
    await pool.query(
      "UPDATE support_tickets SET status = 'in_progress', is_read_by_user = 0, is_read = 0 WHERE id = ?",
      [ticketId]
    );
  } else {
    await pool.query(
      "UPDATE support_tickets SET is_read_by_admin = 0 WHERE id = ?",
      [ticketId]
    );
  }

  logger.info(`💬 ${isAdmin ? 'ادمین' : 'کاربر'} ${userId} به تیکت ${ticketId} پاسخ داد`);
  return true;
};

const closeTicket = async (userId, userRole, ticketId) => {
  logger.info(`🔍 [closeTicket] دریافت درخواست بستن تیکت ${ticketId} توسط کاربر ${userId} با نقش ${userRole}`);
  
  const [ticket] = await pool.query(
    'SELECT id, user_id FROM support_tickets WHERE id = ? AND deleted_at IS NULL',
    [ticketId]
  );
  if (ticket.length === 0) {
    throw new AppError('تیکت یافت نشد', 404);
  }

  // بررسی دسترسی
  if (ticket[0].user_id !== userId && userRole !== 'admin') {
    throw new AppError('دسترسی غیرمجاز', 403);
  }

  const isOwner = ticket[0].user_id === userId;
  logger.info(`📌 [closeTicket] isOwner: ${isOwner}, ticketUserId: ${ticket[0].user_id}, requesterUserId: ${userId}`);

  // ✅ هر دو حالت: کاربر خودش یا ادمین می‌بندد، دیگه نوتیف نمی‌فرستیم
  // همیشه is_read_by_user = 1 و is_read = 1
  logger.info(`🔒 بستن تیکت ${ticketId} بدون ایجاد نوتیف برای کاربر`);
  await pool.query(
    "UPDATE support_tickets SET status = 'closed', is_read_by_user = 1, is_read = 1 WHERE id = ?",
    [ticketId]
  );

  logger.info(`🔒 تیکت ${ticketId} بسته شد (بدون نوتیف)`);
};

const getAllTickets = async () => {
  const [rows] = await pool.query(
    `SELECT t.*, u.name AS user_name,
            (SELECT COUNT(*) FROM support_replies WHERE ticket_id = t.id) AS replies_count
     FROM support_tickets t
     JOIN users u ON t.user_id = u.id
     WHERE t.deleted_at IS NULL
     ORDER BY t.created_at DESC`
  );
  return rows.map(row => ({
    ...row,
    is_read: row.is_read_by_admin,
  }));
};

const markAsReadByUser = async (ticketId, userId) => {
  logger.info(`🔍 [markAsReadByUser] START - ticketId: ${ticketId}, userId: ${userId}`);
  
  const [result] = await pool.query(
    'UPDATE support_tickets SET is_read_by_user = 1, is_read = 1 WHERE id = ? AND user_id = ?',
    [ticketId, userId]
  );
  
  logger.info(`✅ [markAsReadByUser] affectedRows: ${result.affectedRows}`);
  
  if (result.affectedRows === 0) {
    throw new AppError('امکان علامت‌گذاری تیکت وجود ندارد', 500);
  }
  
  return result;
};

const markAsReadByAdmin = async (ticketId) => {
  logger.info(`🔍 [markAsReadByAdmin] علامت‌گذاری تیکت ${ticketId} توسط ادمین`);
  
  const [ticket] = await pool.query(
    'SELECT id, is_read_by_admin FROM support_tickets WHERE id = ? AND deleted_at IS NULL',
    [ticketId]
  );
  if (ticket.length === 0) {
    throw new AppError('تیکت یافت نشد', 404);
  }

  if (ticket[0].is_read_by_admin === 1) {
    logger.info(`ℹ️ [markAsReadByAdmin] تیکت قبلاً توسط ادمین خوانده شده`);
    return { affectedRows: 0 };
  }

  const [result] = await pool.query(
    'UPDATE support_tickets SET is_read_by_admin = 1 WHERE id = ?',
    [ticketId]
  );
  
  logger.info(`✅ [markAsReadByAdmin] affectedRows: ${result.affectedRows}`);
  
  if (result.affectedRows === 0) {
    throw new AppError('امکان علامت‌گذاری تیکت وجود ندارد', 500);
  }
  
  return result;
};

const markAsReadByAdminForUser = async (ticketId) => {
  throw new AppError('این تابع پشتیبانی نمی‌شود', 500);
};

const getUnreadCount = async (userId) => {
  logger.info(`🔍 [getUnreadCount] شروع برای userId: ${userId}`);
  
  const [result] = await pool.query(
    'SELECT COUNT(*) as count FROM support_tickets WHERE user_id = ? AND is_read_by_user = 0 AND deleted_at IS NULL',
    [userId]
  );
  const count = result[0]?.count || 0;
  logger.info(`📊 [getUnreadCount] تعداد خوانده‌نشده: ${count}`);
  return count;
};

const softDeleteTicket = async (ticketId) => {
  const [ticket] = await pool.query(
    'SELECT id FROM support_tickets WHERE id = ? AND deleted_at IS NULL',
    [ticketId]
  );
  if (ticket.length === 0) {
    throw new AppError('تیکت یافت نشد', 404);
  }
  await pool.query(
    'UPDATE support_tickets SET deleted_at = NOW() WHERE id = ?',
    [ticketId]
  );
  logger.info(`🗑️ تیکت ${ticketId} به سطل زباله منتقل شد`);
};

const restoreTicket = async (ticketId) => {
  const [ticket] = await pool.query(
    'SELECT id FROM support_tickets WHERE id = ? AND deleted_at IS NOT NULL',
    [ticketId]
  );
  if (ticket.length === 0) {
    throw new AppError('تیکت در سطل زباله یافت نشد', 404);
  }
  await pool.query(
    'UPDATE support_tickets SET deleted_at = NULL WHERE id = ?',
    [ticketId]
  );
  logger.info(`♻️ تیکت ${ticketId} بازیابی شد`);
};

const forceDeleteTicket = async (ticketId) => {
  const [ticket] = await pool.query(
    'SELECT id FROM support_tickets WHERE id = ? AND deleted_at IS NOT NULL',
    [ticketId]
  );
  if (ticket.length === 0) {
    throw new AppError('تیکت در سطل زباله یافت نشد', 404);
  }
  await pool.query('DELETE FROM support_replies WHERE ticket_id = ?', [ticketId]);
  await pool.query('DELETE FROM support_tickets WHERE id = ?', [ticketId]);
  logger.info(`💀 تیکت ${ticketId} برای همیشه حذف شد`);
};

const getTrashedTickets = async () => {
  const [rows] = await pool.query(
    `SELECT t.*, u.name AS user_name
     FROM support_tickets t
     JOIN users u ON t.user_id = u.id
     WHERE t.deleted_at IS NOT NULL
     ORDER BY t.deleted_at DESC`
  );
  return rows;
};

const editReply = async (replyId, adminId, newMessage) => {
  const [reply] = await pool.query(
    'SELECT id, user_id, ticket_id, is_admin FROM support_replies WHERE id = ?',
    [replyId]
  );
  if (reply.length === 0) {
    throw new AppError('پاسخ یافت نشد', 404);
  }

  if (!reply[0].is_admin) {
    throw new AppError('فقط پاسخ‌های ادمین قابل ویرایش هستند', 403);
  }

  if (reply[0].user_id !== adminId) {
    throw new AppError('شما فقط می‌توانید پاسخ‌های خود را ویرایش کنید', 403);
  }

  await pool.query(
    `UPDATE support_replies SET message = ?, updated_at = NOW() WHERE id = ?`,
    [newMessage, replyId]
  );

  // ویرایش پاسخ توسط ادمین: کاربر باید متوجه شود (ناخوانده)
  await pool.query(
    'UPDATE support_tickets SET is_read_by_user = 0, is_read = 0 WHERE id = ?',
    [reply[0].ticket_id]
  );

  logger.info(`✏️ ادمین ${adminId} پاسخ ${replyId} را ویرایش کرد`);

  const [updatedReply] = await pool.query(
    'SELECT * FROM support_replies WHERE id = ?',
    [replyId]
  );
  return updatedReply[0];
};

module.exports = {
  getUserTickets,
  getTicketDetails,
  createTicket,
  replyToTicket,
  closeTicket,
  getAllTickets,
  markAsReadByUser,
  markAsReadByAdminForUser,
  markAsReadByAdmin,
  getUnreadCount,
  softDeleteTicket,
  restoreTicket,
  forceDeleteTicket,
  getTrashedTickets,
  editReply,
};