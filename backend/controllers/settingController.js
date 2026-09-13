// backend/controllers/settingController.js
const logger = require("../utils/logger");
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { generateFaviconSizes } = require('../utils/faviconGenerator');

// ===== دریافت تنظیمات عمومی (بدون احراز هویت) =====
const getPublicSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT `key`, `value` FROM site_settings WHERE `group` IN ("contact", "support", "header")'
    );
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

// ===== دریافت همه تنظیمات (ادمین) =====
const getAllSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM site_settings ORDER BY `group`, `key`');
    
    const [pageRows] = await pool.query(
      "SELECT content_json FROM pages WHERE slug = 'site-settings'"
    );
    let autoApprove = false;
    if (pageRows.length > 0 && pageRows[0].content_json) {
      try {
        const content = typeof pageRows[0].content_json === 'string' 
          ? JSON.parse(pageRows[0].content_json) 
          : pageRows[0].content_json;
        autoApprove = content.auto_approve_reviews === true || content.auto_approve_reviews === 1;
      } catch (e) {
        autoApprove = false;
      }
    }
    
    const settings = rows.map(row => ({ ...row }));
    if (!settings.some(s => s.key === 'auto_approve_reviews')) {
      settings.push({
        key: 'auto_approve_reviews',
        value: autoApprove ? '1' : '0',
        group: 'reviews',
        description: 'تایید خودکار نظرات'
      });
    }
    
    res.json({ success: true, data: settings });
  } catch (error) { next(error); }
};

// ============================================================
// ✅ به‌روزرسانی تنظیمات (ادمین) — با ساخت خودکار فاوآیکون
// ============================================================
const updateSettings = async (req, res, next) => {
  try {
    let settingsData = req.body.settings || req.body;
    
    if (!settingsData || typeof settingsData !== 'object') {
      throw new AppError('داده‌های ارسالی نامعتبر است', 400);
    }

    // ✅ اگر فاوآیکون جدید در site-settings ذخیره شد، همه سایزها رو بساز
    // (این بخش رو در updateSettings صدا می‌زنیم چون favicon در pages ذخیره می‌شه)
    let faviconChanged = false;
    let newFaviconPath = null;

    // چک کن آیا site-settings شامل فاوآیکون هست
    if (settingsData.favicon !== undefined) {
      faviconChanged = true;
      newFaviconPath = settingsData.favicon;
    }

    // اگر auto_approve_reviews در داده‌ها وجود دارد، آن را در pages ذخیره کن
    if (settingsData.auto_approve_reviews !== undefined) {
      const [pageRows] = await pool.query(
        "SELECT content_json FROM pages WHERE slug = 'site-settings'"
      );
      let contentJson = {};
      if (pageRows.length > 0 && pageRows[0].content_json) {
        try {
          contentJson = typeof pageRows[0].content_json === 'string' 
            ? JSON.parse(pageRows[0].content_json) 
            : pageRows[0].content_json;
        } catch (e) {
          contentJson = {};
        }
      }
      
      contentJson.auto_approve_reviews = settingsData.auto_approve_reviews ? 1 : 0;
      
      if (pageRows.length > 0) {
        await pool.query(
          "UPDATE pages SET content_json = ? WHERE slug = 'site-settings'",
          [JSON.stringify(contentJson)]
        );
      } else {
        await pool.query(
          "INSERT INTO pages (slug, title, content_json) VALUES (?, ?, ?)",
          ['site-settings', 'تنظیمات سایت', JSON.stringify(contentJson)]
        );
      }
      
      await pool.query(
        "INSERT INTO site_settings (`key`, `value`, `group`, `description`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        ['auto_approve_reviews', settingsData.auto_approve_reviews ? '1' : '0', 'reviews', 'تایید خودکار نظرات']
      );
      
      delete settingsData.auto_approve_reviews;
    }
    
    // ذخیره سایر تنظیمات در site_settings
    if (Object.keys(settingsData).length > 0) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const [key, value] of Object.entries(settingsData)) {
          await connection.query(
            'UPDATE site_settings SET `value` = ? WHERE `key` = ?',
            [value, key]
          );
        }
        await connection.commit();
        logger.info('✏️ تنظیمات سایت به‌روزرسانی شد');
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    // ✅ اگر فاوآیکون تغییر کرده، همه سایزها رو بساز
    if (faviconChanged && newFaviconPath) {
      try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');

        let sourcePath = null;
        if (newFaviconPath.startsWith('http')) {
          logger.warn('⚠️ [updateSettings] فاوآیکون از URL خارجی، skip');
        } else if (newFaviconPath.startsWith('/uploads/')) {
          sourcePath = path.join(uploadsDir, path.basename(newFaviconPath));
        } else if (newFaviconPath.startsWith('/')) {
          sourcePath = path.join(__dirname, '..', newFaviconPath);
        }

        if (sourcePath && fs.existsSync(sourcePath)) {
          logger.info(`🎨 [updateSettings] در حال ساخت سایزهای فاوآیکون از: ${sourcePath}`);
          const success = await generateFaviconSizes(sourcePath);
          if (success) {
            logger.info('✅ [updateSettings] فاوآیکون‌ها با موفقیت ساخته شدند');
          } else {
            logger.warn('⚠️ [updateSettings] خطا در ساخت فاوآیکون‌ها');
          }
        } else {
          logger.warn(`⚠️ [updateSettings] فایل فاوآیکون پیدا نشد: ${sourcePath}`);
        }
      } catch (faviconErr) {
        logger.error('❌ [updateSettings] خطا در ساخت فاوآیکون:', faviconErr);
        // خطا رو به کاربر نشون نمی‌دیم چون تنظیمات ذخیره شده
      }
    }
    
    res.json({ 
      success: true, 
      message: faviconChanged 
        ? 'تنظیمات با موفقیت ذخیره و فاوآیکون‌ها ساخته شدند' 
        : 'تنظیمات با موفقیت به‌روزرسانی شد' 
    });
  } catch (error) { next(error); }
};

module.exports = {
  getPublicSettings,
  getAllSettings,
  updateSettings,
};