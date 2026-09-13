const logger = require("../utils/logger");
// backend/controllers/wishlistController.js
const wishlistService = require('../services/wishlistService');

/**
 * دریافت لیست علاقه‌مندی‌ها
 */
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const data = await wishlistService.getWishlist(userId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * اضافه کردن به علاقه‌مندی‌ها
 */
const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.body;

    await wishlistService.addToWishlist(userId, productId);
    res.json({
      success: true,
      message: 'به لیست علاقه‌مندی‌ها اضافه شد',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * حذف از علاقه‌مندی‌ها
 */
const removeFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    await wishlistService.removeFromWishlist(userId, productId);
    res.json({
      success: true,
      message: 'از لیست علاقه‌مندی‌ها حذف شد',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * بررسی وجود محصول در لیست علاقه‌مندی‌ها
 */
const checkInWishlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const inWishlist = await wishlistService.checkInWishlist(userId, productId);
    res.json({
      success: true,
      inWishlist,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
};