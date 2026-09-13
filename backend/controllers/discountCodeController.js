// backend/controllers/discountCodeController.js
const logger = require("../utils/logger");
const discountCodeService = require('../services/discountCodeService');
const { AppError } = require('../middleware/errorHandler');
const pool = require('../config/db');

const getDiscountCodes = async (req, res, next) => {
  try {
    const data = await discountCodeService.getDiscountCodes();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getDiscountCodeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const code = await discountCodeService.getDiscountCodeById(id);
    const productRelations = await discountCodeService.getProductsForDiscountCode(id);
    
    const product_ids = [];
    const variation_ids = {};
    
    productRelations.forEach(rel => {
      if (!product_ids.includes(rel.product_id)) {
        product_ids.push(rel.product_id);
      }
      if (rel.variation_id) {
        if (!variation_ids[rel.product_id]) {
          variation_ids[rel.product_id] = [];
        }
        variation_ids[rel.product_id].push(rel.variation_id);
      }
    });
    
    res.json({ 
      success: true, 
      data: { 
        ...code, 
        product_ids, 
        variation_ids 
      } 
    });
  } catch (error) { next(error); }
};

const createDiscountCode = async (req, res, next) => {
  try {
    const data = req.body;
    const result = await discountCodeService.createDiscountCode(data);
    res.status(201).json({ success: true, message: 'کد تخفیف ایجاد شد', data: result });
  } catch (error) {
    console.error('❌ [createDiscountCode] خطا:', error);
    if (error.message?.includes('قبلاً ثبت شده است')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.includes('discount_codes.code')) {
      return res.status(400).json({
        success: false,
        message: 'این کد تخفیف قبلاً ثبت شده است. لطفاً کد دیگری انتخاب کنید.'
      });
    }
    next(error);
  }
};

const updateDiscountCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await discountCodeService.updateDiscountCode(id, data);
    res.json({ success: true, message: 'کد تخفیف به‌روزرسانی شد' });
  } catch (error) {
    console.error('❌ [updateDiscountCode] خطا:', error);
    if (error.message?.includes('قبلاً ثبت شده است')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.includes('discount_codes.code')) {
      return res.status(400).json({
        success: false,
        message: 'این کد تخفیف قبلاً ثبت شده است. لطفاً کد دیگری انتخاب کنید.'
      });
    }
    next(error);
  }
};

const softDeleteDiscountCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    await discountCodeService.softDeleteDiscountCode(id);
    res.json({ success: true, message: 'کد تخفیف به سطل زباله منتقل شد' });
  } catch (error) { next(error); }
};

const restoreDiscountCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    await discountCodeService.restoreDiscountCode(id);
    res.json({ success: true, message: 'کد تخفیف بازیابی شد' });
  } catch (error) { next(error); }
};

// ===== ✅ تابع حذف دائمی (نسخه اصلاح‌شده با مدیریت خودکار ارجاعات) =====
const forceDeleteDiscountCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 [forceDeleteDiscountCode] شروع حذف دائمی کد ${id}`);
    
    const [existing] = await pool.query(
      'SELECT id, code FROM discount_codes WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    if (existing.length === 0) {
      console.warn(`⚠️ [forceDeleteDiscountCode] کد ${id} در سطل زباله یافت نشد`);
      return res.status(404).json({
        success: false,
        message: 'کد تخفیف در سطل زباله یافت نشد'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // ۱. تمام ارجاعات سفارشات را به NULL تبدیل کن
      const [updateResult] = await connection.query(
        'UPDATE orders SET discount_code_id = NULL WHERE discount_code_id = ?',
        [id]
      );
      console.log(`✅ [forceDeleteDiscountCode] ${updateResult.affectedRows} سفارش به‌روزرسانی شد`);

      // ۲. حذف روابط product_discount_code
      await connection.query(
        'DELETE FROM product_discount_code WHERE discount_code_id = ?',
        [id]
      );

      // ۳. حذف خود کد تخفیف
      await connection.query(
        'DELETE FROM discount_codes WHERE id = ?',
        [id]
      );

      await connection.commit();
      console.log(`✅ [forceDeleteDiscountCode] کد ${id} با موفقیت حذف شد`);
      res.json({ success: true, message: 'کد تخفیف برای همیشه حذف شد' });
    } catch (error) {
      await connection.rollback();
      console.error('❌ [forceDeleteDiscountCode] خطا در تراکنش:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ [forceDeleteDiscountCode] خطا:', error);
    next(error);
  }
};

const getTrashedDiscountCodes = async (req, res, next) => {
  try {
    const data = await discountCodeService.getTrashedDiscountCodes();
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

module.exports = {
  getDiscountCodes,
  getDiscountCodeById,
  createDiscountCode,
  updateDiscountCode,
  softDeleteDiscountCode,
  restoreDiscountCode,
  forceDeleteDiscountCode,
  getTrashedDiscountCodes,
};