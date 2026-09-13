const logger = require("../utils/logger");
// backend/controllers/notificationController.js
const notificationService = require('../services/notificationService');
const { AppError } = require('../middleware/errorHandler');

const getAdminNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getAdminNotifications();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminNotifications
};