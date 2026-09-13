const logger = require("../utils/logger");
// backend/controllers/ticketController.js
const { validationResult } = require('express-validator');
const ticketService = require('../services/ticketService');
const { AppError } = require('../middleware/errorHandler');

const getUserId = (req) => {
  return req.user?.id || req.user?.userId || req.user?._id || req.user?.user_id || null;
};

const getUserTickets = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return next(new AppError('کاربر یافت نشد', 401));
    logger.info(`🔍 [getUserTickets] شروع برای userId: ${userId}`);
    const data = await ticketService.getUserTickets(userId);
    logger.info(`✅ [getUserTickets] ${data.length} تیکت برگردانده شد`);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getTicketDetails = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return next(new AppError('کاربر یافت نشد', 401));
    const userRole = req.user.role;
    const { ticketId } = req.params;
    logger.info(`🔍 [getTicketDetails] دریافت تیکت ${ticketId} برای کاربر ${userId} (نقش: ${userRole})`);
    const data = await ticketService.getTicketDetails(userId, userRole, ticketId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const createTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    const userId = getUserId(req);
    if (!userId) return next(new AppError('کاربر یافت نشد', 401));
    const { subject, message } = req.body;
    logger.info(`🔍 [createTicket] ثبت تیکت جدید توسط کاربر ${userId}`);
    const ticketId = await ticketService.createTicket(userId, subject, message);
    res.status(201).json({ success: true, message: 'تیکت با موفقیت ثبت شد', ticketId });
  } catch (error) { next(error); }
};

const adminReplyToTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    const adminId = getUserId(req);
    if (!adminId) return next(new AppError('کاربر یافت نشد', 401));
    const { ticketId } = req.params;
    const { message } = req.body;
    logger.info(`🔍 [adminReplyToTicket] پاسخ ادمین ${adminId} به تیکت ${ticketId}`);
    await ticketService.replyToTicket(adminId, ticketId, message, true);
    res.json({ success: true, message: 'پاسخ با موفقیت ثبت شد' });
  } catch (error) { next(error); }
};

const userReplyToTicket = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(err => err.msg) });
    }
    const userId = getUserId(req);
    if (!userId) return next(new AppError('کاربر یافت نشد', 401));
    const { ticketId } = req.params;
    const { message } = req.body;
    logger.info(`🔍 [userReplyToTicket] پاسخ کاربر ${userId} به تیکت ${ticketId}`);
    await ticketService.replyToTicket(userId, ticketId, message, false);
    res.json({ success: true, message: 'پاسخ با موفقیت ثبت شد' });
  } catch (error) { next(error); }
};

const closeTicket = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return next(new AppError('کاربر یافت نشد', 401));
    const userRole = req.user.role;
    const { ticketId } = req.params;
    logger.info(`🔍 [closeTicket] بستن تیکت ${ticketId} توسط کاربر ${userId}`);
    await ticketService.closeTicket(userId, userRole, ticketId);
    res.json({ success: true, message: 'تیکت با موفقیت بسته شد' });
  } catch (error) { next(error); }
};

const getAllTickets = async (req, res, next) => {
  try {
    logger.info(`🔍 [getAllTickets] دریافت همه تیکت‌ها توسط ادمین`);
    const data = await ticketService.getAllTickets();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return next(new AppError('کاربر یافت نشد', 401));
    const userRole = req.user.role;
    const { ticketId } = req.params;
    logger.info(`🔍 [markAsRead] علامت‌گذاری تیکت ${ticketId} توسط کاربر ${userId} (نقش: ${userRole})`);
    logger.info(`📌 [markAsRead] req.user:`, JSON.stringify(req.user, null, 2));
    
    if (userRole === 'admin') {
      await ticketService.markAsReadByAdmin(ticketId);
    } else {
      await ticketService.markAsReadByUser(ticketId, userId);
    }
    
    res.json({ success: true, message: 'تیکت به‌عنوان خوانده‌شده علامت‌گذاری شد' });
  } catch (error) { 
    console.error('❌ [markAsRead] خطا:', error);
    next(error); 
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return next(new AppError('کاربر یافت نشد', 401));
    logger.info(`🔍 [getUnreadCount] دریافت تعداد خوانده‌نشده برای کاربر ${userId}`);
    const count = await ticketService.getUnreadCount(userId);
    logger.info(`📤 [getUnreadCount] ارسال پاسخ: ${count}`);
    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) { next(error); }
};

const softDeleteTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    logger.info(`🔍 [softDeleteTicket] حذف نرم تیکت ${ticketId}`);
    await ticketService.softDeleteTicket(ticketId);
    res.json({ success: true, message: 'تیکت به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

const restoreTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    logger.info(`🔍 [restoreTicket] بازیابی تیکت ${ticketId}`);
    await ticketService.restoreTicket(ticketId);
    res.json({ success: true, message: 'تیکت بازیابی شد' });
  } catch (error) { next(error); }
};

const forceDeleteTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    logger.info(`🔍 [forceDeleteTicket] حذف دائمی تیکت ${ticketId}`);
    await ticketService.forceDeleteTicket(ticketId);
    res.json({ success: true, message: 'تیکت برای همیشه حذف شد' });
  } catch (error) { next(error); }
};

const getTrashedTickets = async (req, res, next) => {
  try {
    logger.info(`🔍 [getTrashedTickets] دریافت تیکت‌های سطل زباله`);
    const data = await ticketService.getTrashedTickets();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const editReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const { message } = req.body;
    const adminId = getUserId(req);
    if (!adminId) return next(new AppError('کاربر یافت نشد', 401));
    const userRole = req.user.role;

    if (userRole !== 'admin') {
      return next(new AppError('دسترسی غیرمجاز', 403));
    }

    if (!message || message.trim() === '') {
      return next(new AppError('متن پیام نمی‌تواند خالی باشد', 400));
    }

    const result = await ticketService.editReply(replyId, adminId, message.trim());
    res.json({ success: true, message: 'پاسخ با موفقیت ویرایش شد', data: result });
  } catch (error) { next(error); }
};

module.exports = {
  getUserTickets,
  getTicketDetails,
  createTicket,
  adminReplyToTicket,
  userReplyToTicket,
  closeTicket,
  getAllTickets,
  markAsRead,
  getUnreadCount,
  softDeleteTicket,
  restoreTicket,
  forceDeleteTicket,
  getTrashedTickets,
  editReply,
};