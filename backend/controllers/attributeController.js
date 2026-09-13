const logger = require("../utils/logger");
// backend/controllers/attributeController.js
const attributeService = require('../services/attributeService');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// توابع عمومی (بدون نیاز به احراز هویت)
// ============================================================

/**
 * دریافت همه رنگ‌ها (از attribute_values با type_id=1)
 */
const getColors = async (req, res, next) => {
  try {
    logger.info('🔍 [getColors] دریافت همه رنگ‌ها...');
    const data = await attributeService.getColors();
    logger.info(`✅ [getColors] ${data.length} رنگ دریافت شد`);
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ [getColors] خطا:', error);
    next(error);
  }
};

/**
 * دریافت ویژگی‌های اختصاصی یک محصول (شامل رنگ‌ها و custom_attributes)
 * خروجی: { colors: [...], custom: { ... } }
 */
const getProductCustomAttributes = async (req, res, next) => {
  try {
    const { productId } = req.params;
    logger.info(`🔍 [getProductCustomAttributes] دریافت ویژگی‌های اختصاصی محصول ${productId}`);
    
    // ۱. دریافت رنگ‌های انتخاب‌شده برای محصول
    const [colors] = await pool.query(
      `SELECT av.id, av.value, av.color_code
       FROM product_attributes pa
       JOIN attribute_values av ON pa.attribute_value_id = av.id
       WHERE pa.product_id = ? AND av.attribute_type_id = 1`,
      [productId]
    );
    
    // ۲. دریافت ویژگی‌های اختصاصی از custom_attributes
    const [product] = await pool.query(
      'SELECT custom_attributes FROM products WHERE id = ? AND deleted_at IS NULL',
      [productId]
    );
    
    const custom = product[0]?.custom_attributes || {};
    
    const result = {
      colors: colors || [],
      custom: custom,
    };
    
    logger.info(`✅ [getProductCustomAttributes] رنگ‌ها: ${colors.length}، ویژگی‌های اختصاصی: ${Object.keys(custom).length}`);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`❌ [getProductCustomAttributes] خطا برای محصول ${req.params.productId}:`, error);
    next(error);
  }
};

/**
 * دریافت ترکیبات یک محصول
 */
const getProductVariations = async (req, res, next) => {
  try {
    const { productId } = req.params;
    logger.info(`🔍 [getProductVariations] دریافت ترکیبات محصول ${productId}`);
    const data = await attributeService.getProductVariations(productId);
    logger.info(`✅ [getProductVariations] ${data.length} ترکیب برای محصول ${productId} دریافت شد`);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`❌ [getProductVariations] خطا برای محصول ${req.params.productId}:`, error);
    next(error);
  }
};

// ============================================================
// توابع ادمین (نیاز به احراز هویت و نقش admin)
// ============================================================

/**
 * افزودن رنگ به محصول
 */
const addProductColor = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { attributeValueId } = req.body;
    
    logger.info(`🔍 [addProductColor] افزودن رنگ ${attributeValueId} به محصول ${productId}`);
    
    if (!attributeValueId) {
      throw new AppError('شناسه مقدار رنگ الزامی است', 400);
    }

    await attributeService.addProductColor(productId, attributeValueId);
    logger.info(`✅ [addProductColor] رنگ ${attributeValueId} به محصول ${productId} اضافه شد`);

    res.json({
      success: true,
      message: 'رنگ با موفقیت به محصول اضافه شد',
    });
  } catch (error) {
    console.error(`❌ [addProductColor] خطا برای محصول ${req.params.productId}:`, error);
    next(error);
  }
};

/**
 * حذف رنگ از محصول
 */
const removeProductColor = async (req, res, next) => {
  try {
    const { productId, attributeValueId } = req.params;
    logger.info(`🔍 [removeProductColor] حذف رنگ ${attributeValueId} از محصول ${productId}`);

    await attributeService.removeProductColor(productId, attributeValueId);
    logger.info(`✅ [removeProductColor] رنگ ${attributeValueId} از محصول ${productId} حذف شد`);

    res.json({
      success: true,
      message: 'رنگ با موفقیت از محصول حذف شد',
    });
  } catch (error) {
    console.error(`❌ [removeProductColor] خطا برای محصول ${req.params.productId}:`, error);
    next(error);
  }
};

/**
 * به‌روزرسانی ویژگی‌های اختصاصی محصول (custom_attributes)
 */
const updateProductCustomAttributes = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { custom_attributes } = req.body;
    
    logger.info(`🔍 [updateProductCustomAttributes] به‌روزرسانی ویژگی‌های اختصاصی محصول ${productId}`);
    logger.info(`🔍 [updateProductCustomAttributes] داده:`, custom_attributes);

    await attributeService.updateProductCustomAttributes(productId, custom_attributes);
    logger.info(`✅ [updateProductCustomAttributes] ویژگی‌های اختصاصی محصول ${productId} به‌روزرسانی شد`);

    res.json({
      success: true,
      message: 'ویژگی‌های اختصاصی محصول با موفقیت به‌روزرسانی شد',
    });
  } catch (error) {
    console.error(`❌ [updateProductCustomAttributes] خطا برای محصول ${req.params.productId}:`, error);
    next(error);
  }
};

/**
 * ایجاد ترکیب داینامیک (با پشتیبانی از رنگ و ویژگی‌های اختصاصی)
 */
const createDynamicVariation = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const attributeMap = req.body;

    logger.info(`🔍 [createDynamicVariation] ===== شروع =====`);
    logger.info(`🔍 [createDynamicVariation] محصول: ${productId}`);
    logger.info(`🔍 [createDynamicVariation] داده دریافتی:`, JSON.stringify(attributeMap, null, 2));

    const result = await attributeService.createDynamicVariation(productId, attributeMap);

    logger.info(`✅ [createDynamicVariation] ترکیب جدید با ID ${result.id} ایجاد شد`);
    logger.info(`🔍 [createDynamicVariation] ===== پایان =====`);

    res.status(201).json({
      success: true,
      message: 'ترکیب با موفقیت ایجاد شد',
      data: result,
    });
  } catch (error) {
    console.error('❌ [createDynamicVariation] خطا:', error);
    if (error.message.includes('مجموع موجودی ترکیبات')) {
      return next(new AppError(error.message, 400));
    }
    next(error);
  }
};

/**
 * به‌روزرسانی یک ترکیب (قیمت، موجودی، SKU)
 */
const updateVariation = async (req, res, next) => {
  try {
    const { variationId } = req.params;
    let { price, stock, sku } = req.body;

    logger.info(`🔍 [updateVariation] به‌روزرسانی ترکیب ${variationId}: price=${price}, stock=${stock}, sku=${sku}`);

    if (price !== undefined && price !== null && price !== '') {
      price = parseFloat(price);
      if (isNaN(price)) {
        throw new AppError('قیمت نامعتبر است', 400);
      }
    } else {
      price = null;
    }

    if (stock !== undefined && stock !== null && stock !== '') {
      stock = parseInt(stock);
      if (isNaN(stock)) {
        throw new AppError('موجودی نامعتبر است', 400);
      }
    } else {
      stock = 0;
    }

    await attributeService.updateVariation(variationId, { price, stock, sku: sku || null });
    logger.info(`✅ [updateVariation] ترکیب ${variationId} به‌روزرسانی شد`);

    res.json({
      success: true,
      message: 'ترکیب با موفقیت به‌روزرسانی شد',
    });
  } catch (error) {
    console.error(`❌ [updateVariation] خطا برای ترکیب ${req.params.variationId}:`, error);
    if (error.message.includes('مجموع موجودی ترکیبات')) {
      return next(new AppError(error.message, 400));
    }
    next(error);
  }
};

/**
 * حذف یک ترکیب (تکی)
 */
const deleteVariation = async (req, res, next) => {
  try {
    const { variationId } = req.params;
    logger.info(`🔍 [deleteVariation] حذف ترکیب ${variationId}`);

    await attributeService.deleteVariation(variationId);
    logger.info(`✅ [deleteVariation] ترکیب ${variationId} حذف شد`);

    res.json({
      success: true,
      message: 'ترکیب با موفقیت حذف شد',
    });
  } catch (error) {
    console.error(`❌ [deleteVariation] خطا برای ترکیب ${req.params.variationId}:`, error);
    next(error);
  }
};

/**
 * حذف گروهی ترکیبات (چندین ترکیب با یک درخواست)
 */
const deleteVariationsBatch = async (req, res, next) => {
  try {
    const { ids } = req.body;
    logger.info(`🔍 [deleteVariationsBatch] حذف گروهی ترکیبات:`, ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('حداقل یک ترکیب را انتخاب کنید', 400);
    }

    await attributeService.deleteVariationsBatch(ids);
    logger.info(`✅ [deleteVariationsBatch] ${ids.length} ترکیب حذف شد`);

    res.json({
      success: true,
      message: `${ids.length} ترکیب با موفقیت حذف شدند`,
    });
  } catch (error) {
    console.error('❌ [deleteVariationsBatch] خطا:', error);
    next(error);
  }
};

// ============================================================
// خروجی ماژول
// ============================================================

module.exports = {
  getColors,
  getProductCustomAttributes,
  getProductVariations,
  addProductColor,
  removeProductColor,
  updateProductCustomAttributes,
  createDynamicVariation,
  updateVariation,
  deleteVariation,
  deleteVariationsBatch,
};