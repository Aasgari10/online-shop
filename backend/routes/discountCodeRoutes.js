// backend/routes/discountCodeRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');
const discountCodeController = require('../controllers/discountCodeController');

router.use(authenticate, isAdmin);

router.get('/discount-codes', discountCodeController.getDiscountCodes);
router.get('/discount-codes/:id', discountCodeController.getDiscountCodeById);
router.post('/discount-codes', discountCodeController.createDiscountCode);
router.put('/discount-codes/:id', discountCodeController.updateDiscountCode);
router.delete('/discount-codes/:id', discountCodeController.softDeleteDiscountCode);

router.get('/trash/discount-codes', discountCodeController.getTrashedDiscountCodes);
router.put('/trash/discount-codes/:id/restore', discountCodeController.restoreDiscountCode);
router.delete('/trash/discount-codes/:id/force', discountCodeController.forceDeleteDiscountCode);

module.exports = router;