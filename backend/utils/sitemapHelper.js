const logger = require("./logger");
// backend/utils/sitemapHelper.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

/**
 * تولید و ذخیره فایل sitemap.xml به‌صورت فیزیکی
 * (برای مواقعی که نمی‌خواهید هر بار داینامیک تولید شود)
 */
const generateStaticSitemap = async () => {
  try {
    logger.info('🗺️ [sitemapHelper] شروع تولید فایل استاتیک...');
    
    // ۱. دریافت محصولات
    const [products] = await pool.query(
      `SELECT id, slug, updated_at 
       FROM products 
       WHERE deleted_at IS NULL 
         AND slug IS NOT NULL`
    );

    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const now = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // صفحات استاتیک
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/shop', priority: '0.9', changefreq: 'daily' },
      { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
      { loc: '/support', priority: '0.6', changefreq: 'monthly' },
    ];

    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // صفحات محصولات
    for (const product of products) {
      const lastmod = product.updated_at 
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : now;
      
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/product/${product.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    // ذخیره در پوشه public (یا هر جای دیگر)
    const publicDir = path.join(__dirname, '../../frontend/public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filePath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(filePath, xml, 'utf8');

    logger.info(`✅ [sitemapHelper] فایل sitemap.xml در ${filePath} ذخیره شد`);
    logger.info(`🗺️ فایل sitemap.xml به‌روزرسانی شد - ${products.length + staticPages.length} URL`);

    return true;
  } catch (error) {
    console.error('❌ [sitemapHelper] خطا:', error);
    logger.error('خطا در تولید sitemap:', error);
    return false;
  }
};

module.exports = { generateStaticSitemap };