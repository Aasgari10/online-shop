const logger = require("../utils/logger");
// backend/routes/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
} = require('../controllers/wishlistController');
const authenticate = require('../middleware/authMiddleware');

// ✅ همه مسیرها فقط نیاز به احراز هویت دارند (نه ادمین)
router.use(authenticate);

router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);
router.get('/wishlist/check/:productId', checkInWishlist);

module.exports = router; 