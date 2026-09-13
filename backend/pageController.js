// backend/controllers/pageController.js
const logger = require("../utils/logger");
const pageService = require('../services/pageService');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// دریافت همه صفحات (ادمین)
// ============================================================
const getAllPages = async (req, res, next) => {
  try {
    logger.info('📄 [pageController] getAllPages - شروع');
    const pages = await pageService.getAllPages();
    logger.info(`📄 [pageController] getAllPages - ${pages.length} صفحه برگردانده شد`);
    res.json({ success: true, data: pages });
  } catch (error) { 
    console.error('❌ [pageController] getAllPages - خطا:', error);
    next(error); 
  }
};

// ============================================================
// دریافت یک صفحه با شناسه (ادمین)
// ============================================================
const getPageById = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📄 [pageController] getPageById - شروع برای id: ${id}`);
    const page = await pageService.getPageById(id);
    logger.info(`📄 [pageController] getPageById - seo_keywords: "${page.seo_keywords}"`);
    res.json({ success: true, data: page });
  } catch (error) { 
    console.error(`❌ [pageController] getPageById - خطا برای id ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// دریافت یک صفحه با slug (عمومی)
// ============================================================
const getPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    logger.info(`📄 [pageController] getPageBySlug - شروع برای slug: "${slug}"`);
    const page = await pageService.getPageBySlug(slug);
    logger.info(`📄 [pageController] getPageBySlug - seo_keywords: "${page.seo_keywords}"`);
    logger.info(`📄 [pageController] getPageBySlug - seo_description: "${page.seo_description}"`);
    logger.info(`📄 [pageController] getPageBySlug - seo_title: "${page.seo_title}"`);
    res.json({ success: true, data: page });
  } catch (error) { 
    console.error(`❌ [pageController] getPageBySlug - خطا برای slug "${req.params.slug}":`, error);
    next(error); 
  }
};

// ============================================================
// ✅ ایجاد صفحه جدید (اصلاح‌شده با مدیریت خطاهای 409)
// ============================================================
const createPage = async (req, res, next) => {
  try {
    const data = req.body;
    logger.info('📄 [pageController] createPage - داده دریافتی:', JSON.stringify(data, null, 2));
    const result = await pageService.createPage(data);
    res.status(201).json({
      success: true,
      message: 'صفحه با موفقیت ایجاد شد',
      data: result
    });
  } catch (error) { 
    console.error('❌ [pageController] createPage - خطا:', error);
    
    // ✅ مدیریت خطاهای مربوط به سطل زباله و تکراری بودن slug
    if (error.statusCode === 409 && error.message.includes('سطل زباله')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error); 
  }
};

// ============================================================
// ✅ ویرایش صفحه (اصلاح‌شده با مدیریت خطاهای 409)
// ============================================================
const updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    logger.info(`📄 [pageController] updatePage - شروع برای id: ${id}`);
    logger.info(`📄 [pageController] updatePage - داده دریافتی:`, JSON.stringify(data, null, 2));
    logger.info(`📄 [pageController] updatePage - seo_keywords: "${data.seo_keywords}"`);
    logger.info(`📄 [pageController] updatePage - seo_description: "${data.seo_description}"`);
    logger.info(`📄 [pageController] updatePage - seo_title: "${data.seo_title}"`);
    
    await pageService.updatePage(id, data);
    logger.info(`✅ [pageController] updatePage - صفحه ${id} با موفقیت به‌روزرسانی شد`);
    res.json({
      success: true,
      message: 'صفحه با موفقیت ویرایش شد'
    });
  } catch (error) { 
    console.error(`❌ [pageController] updatePage - خطا برای id ${req.params.id}:`, error);
    
    if (error.statusCode === 409 && error.message.includes('سطل زباله')) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error); 
  }
};

// ============================================================
// حذف نرم
// ============================================================
const softDeletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📄 [pageController] softDeletePage - شروع برای id: ${id}`);
    await pageService.softDeletePage(id);
    res.json({
      success: true,
      message: 'صفحه به سطل زباله منتقل شد'
    });
  } catch (error) { 
    console.error(`❌ [pageController] softDeletePage - خطا برای id ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// بازیابی
// ============================================================
const restorePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📄 [pageController] restorePage - شروع برای id: ${id}`);
    await pageService.restorePage(id);
    res.json({
      success: true,
      message: 'صفحه بازیابی شد'
    });
  } catch (error) { 
    console.error(`❌ [pageController] restorePage - خطا برای id ${req.params.id}:`, error);
    if (error.statusCode === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error); 
  }
};

// ============================================================
// حذف دائمی
// ============================================================
const forceDeletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`📄 [pageController] forceDeletePage - شروع برای id: ${id}`);
    await pageService.forceDeletePage(id);
    res.json({
      success: true,
      message: 'صفحه برای همیشه حذف شد'
    });
  } catch (error) { 
    console.error(`❌ [pageController] forceDeletePage - خطا برای id ${req.params.id}:`, error);
    next(error); 
  }
};

// ============================================================
// دریافت صفحات سطل زباله
// ============================================================
const getTrashedPages = async (req, res, next) => {
  try {
    logger.info('📄 [pageController] getTrashedPages - شروع');
    const pages = await pageService.getTrashedPages();
    res.json({ success: true, data: pages });
  } catch (error) { 
    console.error('❌ [pageController] getTrashedPages - خطا:', error);
    next(error); 
  }
};

module.exports = {
  getAllPages,
  getPageById,
  getPageBySlug,
  createPage,
  updatePage,
  softDeletePage,
  restorePage,
  forceDeletePage,
  getTrashedPages,
};