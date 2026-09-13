const logger = require("../utils/logger");
const cartService = require('../services/cartService');
const { AppError } = require('../middleware/errorHandler');

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cart = await cartService.getCart(userId);
    res.json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, variationId, quantity } = req.body;
    const cart = await cartService.addToCart(userId, productId, variationId, quantity);
    res.json({ success: true, message: 'به سبد خرید اضافه شد', data: cart });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, variationId, quantity } = req.body;
    const cart = await cartService.updateCartItem(userId, productId, variationId, quantity);
    res.json({ success: true, message: 'سبد خرید به‌روز شد', data: cart });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, variationId } = req.params;
    const cart = await cartService.removeFromCart(userId, productId, variationId);
    res.json({ success: true, message: 'از سبد خرید حذف شد', data: cart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const cart = await cartService.clearCart(userId);
    res.json({ success: true, message: 'سبد خرید خالی شد', data: cart });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};