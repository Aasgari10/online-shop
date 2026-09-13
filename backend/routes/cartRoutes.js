const logger = require("../utils/logger");
// backend/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authenticate = require('../middleware/authMiddleware');

// ✅ همه مسیرها فقط نیاز به احراز هویت دارند (نه ادمین)
router.use(authenticate);

router.get('/cart', cartController.getCart);
router.post('/cart', cartController.addToCart);
router.put('/cart', cartController.updateCartItem);
router.delete('/cart/:productId/:variationId', cartController.removeFromCart);
router.delete('/cart/:productId', cartController.removeFromCart);
router.delete('/cart', cartController.clearCart);

module.exports = router;