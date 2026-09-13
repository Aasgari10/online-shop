// backend/controllers/sitemapController.js
const logger = require("../utils/logger");
const pool = require('../config/db');

const generateSitemap = async (req, res) => {
  try {
    // ============================================================
    // ۱. محصولات
    // ============================================================
    const [products] = await pool.query(`
      SELECT id, slug, updated_at, created_at
      FROM products
      WHERE deleted_at IS NULL
        AND slug IS NOT NULL
        AND slug != ''
      ORDER BY updated_at DESC
    `);
    logger.info(`🗺️ [sitemap] ${products.length} محصول یافت شد`);

    // ============================================================
    // ۲. صفحات داینامیک
    // ✅ حذف contact و support چون در staticPages هستند
    // ============================================================
    const [pages] = await pool.query(`
      SELECT slug, updated_at, created_at
      FROM pages
      WHERE deleted_at IS NULL
        AND is_active = 1
        AND slug NOT IN ('site-settings', 'home', 'contact', 'support')
      ORDER BY updated_at DESC
    `);
    logger.info(`🗺️ [sitemap] ${pages.length} صفحه یافت شد`);

    // ============================================================
    // ۳. صفحات استاتیک
    // ============================================================
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/shop', priority: '0.9', changefreq: 'daily' },
      { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
      { loc: '/support', priority: '0.6', changefreq: 'monthly' },
    ];

    const baseUrl = process.env.BASE_URL || 'https://aasgari.ir';
    const now = new Date().toISOString().split('T')[0];

    // ============================================================
    // ۴. ساخت XML
    // ============================================================
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // صفحات استاتیک
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // صفحات داینامیک
    for (const page of pages) {
      const lastmod = page.updated_at
        ? new Date(page.updated_at).toISOString().split('T')[0]
        : page.created_at
        ? new Date(page.created_at).toISOString().split('T')[0]
        : now;

      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/${page.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.5</priority>\n';
      xml += '  </url>\n';
    }

    // محصولات
    for (const product of products) {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : product.created_at
        ? new Date(product.created_at).toISOString().split('T')[0]
        : now;

      const encodedSlug = encodeURIComponent(product.slug);

      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/product/${encodedSlug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    // ============================================================
    // ۵. ارسال پاسخ
    // ============================================================
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);

    logger.info(`✅ [sitemap] Sitemap با ${products.length + pages.length + staticPages.length} URL تولید شد`);

  } catch (error) {
    console.error('❌ [sitemap] خطا:', error);

    // Fallback
    const baseUrl = process.env.BASE_URL || 'https://aasgari.ir';
    const now = new Date().toISOString().split('T')[0];
    let fallbackXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    fallbackXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const fallbackPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/shop', priority: '0.9', changefreq: 'daily' },
      { loc: '/contact', priority: '0.6', changefreq: 'monthly' },
      { loc: '/support', priority: '0.6', changefreq: 'monthly' },
    ];

    for (const page of fallbackPages) {
      fallbackXml += '  <url>\n';
      fallbackXml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
      fallbackXml += `    <lastmod>${now}</lastmod>\n`;
      fallbackXml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      fallbackXml += `    <priority>${page.priority}</priority>\n`;
      fallbackXml += '  </url>\n';
    }
    fallbackXml += '</urlset>';

    res.status(200).header('Content-Type', 'application/xml').send(fallbackXml);
  }
};

module.exports = { generateSitemap };