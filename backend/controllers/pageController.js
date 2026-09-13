// backend/controllers/pageController.js
const logger = require("../utils/logger");
const pageService = require('../services/pageService');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// ✅ تابع کمکی: بازسازی خودکار فاوآیکون‌ها در صورت تغییر
// ============================================================
async function maybeRegenerateFavicons(data, oldPage) {
  try {
    // ۱. چک کن آیا این صفحه site-settings است
    const slug = (data && data.slug) || (oldPage && oldPage.slug);
    if (slug !== 'site-settings') {
      return { regenerated: false };
    }

    // ۲. استخراج فاوآیکون جدید از content_json
    let newFavicon = null;
    if (data && data.content_json) {
      try {
        const cj = typeof data.content_json === 'string'
          ? JSON.parse(data.content_json)
          : data.content_json;
        newFavicon = cj.favicon;
      } catch (e) {
        logger.warn('⚠️ [maybeRegenerateFavicons] خطا در parse content_json:', e.message);
        return { regenerated: false };
      }
    }

    // ۳. اگه فاوآیکون جدید وجود نداره، کاری نکن
    if (!newFavicon || typeof newFavicon !== 'string') {
      return { regenerated: false };
    }

    // ۴. اگه فاوآیکون تغییر نکرده، دوباره نساز
    const oldFavicon = oldPage && oldPage.content_json && oldPage.content_json.favicon;
    if (newFavicon === oldFavicon) {
      logger.info('ℹ️ [maybeRegenerateFavicons] فاوآیکون تغییر نکرده، skip');
      return { regenerated: false };
    }

    // ۵. ساخت مسیر فایل منبع
    const path = require('path');
    const fs = require('fs');
    const { generateFaviconSizes } = require('../utils/faviconGenerator');
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    let sourcePath = null;

    if (newFavicon.startsWith('http')) {
      logger.warn('⚠️ [maybeRegenerateFavicons] فاوآیکون از URL خارجی، skip');
      return { regenerated: false };
    } else if (newFavicon.startsWith('/uploads/')) {
      sourcePath = path.join(uploadsDir, path.basename(newFavicon));
    } else if (newFavicon.startsWith('/')) {
      sourcePath = path.join(__dirname, '..', newFavicon);
    } else {
      sourcePath = path.join(__dirname, '..', newFavicon);
    }

    // ۶. چک کن فایل وجود داره
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      logger.warn(`⚠️ [maybeRegenerateFavicons] فایل پیدا نشد: ${sourcePath}`);
      return { regenerated: false };
    }

    // ۷. ساخت همه سایزها
    logger.info(`🎨 [maybeRegenerateFavicons] ساخت فاوآیکون از: ${sourcePath}`);
    const success = await generateFaviconSizes(sourcePath);

    if (success) {
      logger.info('✅ [maybeRegenerateFavicons] فاوآیکون‌ها با موفقیت بازسازی شدند');
    } else {
      logger.warn('⚠️ [maybeRegenerateFavicons] خطا در ساخت فاوآیکون‌ها');
    }

    return { regenerated: success };
  } catch (error) {
    logger.error('❌ [maybeRegenerateFavicons] خطای غیرمنتظره:', error);
    return { regenerated: false };
  }
}

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
// ✅ ایجاد صفحه جدید (با auto-generate favicon)
// ============================================================
const createPage = async (req, res, next) => {
  try {
    const data = req.body;
    logger.info('📄 [pageController] createPage - داده دریافتی:', JSON.stringify(data, null, 2));
    
    const result = await pageService.createPage(data);
    
    // ✅ اگه صفحه site-settings با فاوآیکون ساخته شد، همه سایزها رو بساز
    try {
      const faviconResult = await maybeRegenerateFavicons(data, null);
      if (faviconResult.regenerated) {
        logger.info('✅ [pageController] createPage - فاوآیکون‌ها بازسازی شدند');
      }
    } catch (faviconErr) {
      logger.error('❌ [pageController] createPage - خطا در ساخت فاوآیکون:', faviconErr);
      // خطا رو به کاربر نشون نمی‌دیم
    }
    
    res.status(201).json({
      success: true,
      message: 'صفحه با موفقیت ایجاد شد',
      data: result
    });
  } catch (error) { 
    console.error('❌ [pageController] createPage - خطا:', error);
    next(error); 
  }
};

// ============================================================
// ✅ ویرایش صفحه (با auto-generate favicon)
// ============================================================
const updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    logger.info(`📄 [pageController] updatePage - شروع برای id: ${id}`);
    logger.info(`📄 [pageController] updatePage - داده دریافتی:`, JSON.stringify(data, null, 2));

    // ۱. صفحه قبلی رو بگیر (برای مقایسه فاوآیکون)
    let oldPage = null;
    try {
      oldPage = await pageService.getPageById(id);
    } catch (e) {
      // صفحه پیدا نشد — بذار updatePage خطای 404 بده
      logger.warn(`⚠️ [pageController] updatePage - صفحه ${id} پیدا نشد`);
    }

    // ۲. به‌روزرسانی در دیتابیس
    await pageService.updatePage(id, data);
    logger.info(`✅ [pageController] updatePage - صفحه ${id} در DB به‌روزرسانی شد`);

    // ۳. ✅ چک کن آیا فاوآیکون تغییر کرده و بازسازی کن
    let faviconRegenerated = false;
    try {
      const faviconResult = await maybeRegenerateFavicons(data, oldPage);
      faviconRegenerated = faviconResult.regenerated;
      
      if (faviconRegenerated) {
        logger.info('✅ [pageController] updatePage - فاوآیکون‌ها بازسازی شدند');
      }
    } catch (faviconErr) {
      logger.error('❌ [pageController] updatePage - خطا در بازسازی فاوآیکون:', faviconErr);
      // خطا رو به کاربر نشون نمی‌دیم چون ذخیره با موفقیت انجام شده
    }

    res.json({
      success: true,
      message: faviconRegenerated 
        ? 'صفحه و فاوآیکون‌ها با موفقیت به‌روزرسانی شدند'
        : 'صفحه با موفقیت ویرایش شد'
    });
  } catch (error) { 
    console.error(`❌ [pageController] updatePage - خطا برای id ${req.params.id}:`, error);
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