const logger = require("../utils/logger");
// backend/routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const noCache = require('../middleware/noCache');
const ticketController = require('../controllers/ticketController');

// ================================================================
// اعتبارسنجی
// ================================================================

const validateTicket = [
  body('subject')
    .trim()
    .escape()
    .isLength({ min: 1, max: 200 })
    .withMessage('موضوع باید بین ۱ تا ۲۰۰ کاراکتر باشد'),
  body('message')
    .trim()
    .escape()
    .isLength({ min: 1, max: 5000 })
    .withMessage('پیام باید بین ۱ تا ۵۰۰۰ کاراکتر باشد'),
];

const validateReply = [
  body('message')
    .trim()
    .escape()
    .isLength({ min: 1, max: 5000 })
    .withMessage('پیام پاسخ باید بین ۱ تا ۵۰۰۰ کاراکتر باشد'),
];

// ================================================================
// مسیرهای کاربر عادی (فقط authenticate)
// ================================================================

router.get('/tickets', authenticate, noCache, ticketController.getUserTickets);
router.get('/tickets/unread-count', authenticate, noCache, ticketController.getUnreadCount);
router.get('/tickets/:ticketId', authenticate, noCache, ticketController.getTicketDetails);
router.post('/tickets', authenticate, validateTicket, ticketController.createTicket);
router.put('/tickets/:ticketId/close', authenticate, ticketController.closeTicket);
router.put('/tickets/:ticketId/read', authenticate, ticketController.markAsRead);
router.post('/tickets/:ticketId/reply', authenticate, validateReply, ticketController.userReplyToTicket);

// ================================================================
// مسیرهای ادمین (authenticate + isAdmin)
// ================================================================

router.get('/admin/tickets', authenticate, isAdmin, noCache, ticketController.getAllTickets);
router.post('/admin/tickets/:ticketId/reply', authenticate, isAdmin, validateReply, ticketController.adminReplyToTicket);
router.delete('/admin/tickets/:ticketId', authenticate, isAdmin, ticketController.softDeleteTicket);

// ================================================================
// مسیرهای سطل زباله (فقط ادمین)
// ================================================================

router.put('/admin/trash/tickets/:ticketId/restore', authenticate, isAdmin, ticketController.restoreTicket);
router.delete('/admin/trash/tickets/:ticketId/force', authenticate, isAdmin, ticketController.forceDeleteTicket);
router.get('/admin/trash/tickets', authenticate, isAdmin, noCache, ticketController.getTrashedTickets);

// ================================================================
// ✏️ ویرایش پاسخ ادمین
// ================================================================

router.put('/admin/tickets/replies/:replyId', authenticate, isAdmin, ticketController.editReply);

module.exports = router;