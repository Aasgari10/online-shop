// backend/server.js
console.log('🚀🚀🚀 [server.js] در حال اجرا...');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

// ============================================================
// CORS
// ============================================================
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
}));

// ============================================================
// Compression
// ============================================================
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ============================================================
// Security Headers
// ============================================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// ============================================================
// Middleware
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// Static Uploads
// ============================================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ============================================================
// ✅ Favicon Generator (utility)
// ============================================================
const { generateFaviconSizes, ensureFavicons, faviconsDir, publicDir } = require('./utils/faviconGenerator');

app.use('/favicons', express.static(faviconsDir));

// ============================================================
// ✅ سرو داینامیک فاوآیکون‌ها (از هر مسیری)
// ============================================================
const faviconRoutePaths = [
  // root paths
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/favicon-96x96.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/apple-touch-icon-180x180.png',
  '/mstile-150x150.png',
  // favicons paths
  '/favicons/favicon.ico',
  '/favicons/favicon.svg',
  '/favicons/favicon-16x16.png',
  '/favicons/favicon-32x32.png',
  '/favicons/favicon-48x48.png',
  '/favicons/favicon-96x96.png',
  '/favicons/favicon-192x192.png',
  '/favicons/favicon-512x512.png',
  '/favicons/apple-touch-icon.png',
  '/favicons/apple-touch-icon-precomposed.png',
  '/favicons/apple-touch-icon-180x180.png',
  '/favicons/mstile-150x150.png',
];

const faviconAlternatives = {
  'apple-touch-icon-precomposed.png': 'apple-touch-icon.png',
  'apple-touch-icon-180x180.png': 'apple-touch-icon.png',
};

faviconRoutePaths.forEach(routePath => {
  app.get(routePath, (req, res) => {
    try {
      const fileName = path.basename(routePath);
      const actualFileName = faviconAlternatives[fileName] || fileName;
      const filePath = path.join(faviconsDir, actualFileName);

      if (fs.existsSync(filePath)) {
        const ext = path.extname(actualFileName).toLowerCase();
        const contentTypes = {
          '.png': 'image/png',
          '.ico': 'image/x-icon',
          '.svg': 'image/svg+xml',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.webp': 'image/webp',
        };
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(filePath);
      }

      res.status(404).send('Not Found');
    } catch (error) {
      console.error(`❌ [favicon] خطا در سرو ${routePath}:`, error);
      res.status(500).send('Internal Server Error');
    }
  });
});

// ✅ manifest و browserconfig
app.get('/site.webmanifest', (req, res) => {
  const filePath = path.join(publicDir, 'site.webmanifest');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: 'Not Found' });
});

app.get('/manifest.json', (req, res) => {
  const filePath = path.join(publicDir, 'site.webmanifest');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: 'Not Found' });
});

// ✅ browserconfig.xml (MIME type به text/xml)
app.get('/browserconfig.xml', (req, res) => {
  const filePath = path.join(publicDir, 'browserconfig.xml');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }
  res.status(404).send('Not Found');
});

// ============================================================
// Database Pool
// ============================================================
const pool = require('./config/db');

// ============================================================
// SSR Setup
// ============================================================
const frontendDist = path.join(__dirname, '../frontend/dist');
const ssrDist = path.join(__dirname, '../frontend/dist-ssr');
let renderApp = null;

const entryFile = path.join(ssrDist, 'entry-server.js');
if (fs.existsSync(entryFile)) {
  console.log(`✅ فایل entry-server پیدا شد: ${entryFile}`);
  import(pathToFileURL(entryFile).href)
    .then(module => {
      renderApp = module.default || module.render;
      if (typeof renderApp === 'function') {
        console.log('✅ تابع رندر با موفقیت بارگذاری شد');
      } else {
        console.error('❌ renderApp تابع نیست!');
      }
    })
    .catch(err => {
      console.error('❌ خطا در بارگذاری entry-server:', err);
    });
} else {
  console.error(`❌ فایل entry-server.js در ${ssrDist} پیدا نشد!`);
}

// ============================================================
// تنظیمات پایه
// ============================================================
const SITE_URL = process.env.BASE_URL || 'https://aasgari.ir';
const DEFAULT_TITLE = 'فروشگاه اینترنتی HomeMart';
const DEFAULT_DESCRIPTION = 'خرید بهترین و باکیفیت‌ترین لوازم خانگی با قیمت مناسب از فروشگاه اینترنتی HomeMart';
const AUTHOR_NAME = 'Ali Asgari';
const PUBLISHED_DATE = '2026-07-19T20:45:39+03:30';
const MODIFIED_DATE = '2026-09-10T12:00:00+03:30';

// ============================================================
// دریافت site-settings
// ============================================================
async function fetchSiteSettings() {
  try {
    const [rows] = await pool.query(
      `SELECT content_json FROM pages WHERE slug = 'site-settings' AND deleted_at IS NULL`
    );
    if (rows.length === 0) return null;
    const content = rows[0].content_json;
    return typeof content === 'string' ? JSON.parse(content) : content;
  } catch (error) {
    console.error('❌ [fetchSiteSettings] خطا:', error);
    return null;
  }
}

// ============================================================
// دریافت داده‌های صفحه
// ============================================================
async function fetchPageData(slug) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM pages WHERE slug = ? AND deleted_at IS NULL AND is_active = 1`,
      [slug]
    );
    if (rows.length === 0) return null;
    const page = rows[0];
    if (page.content_json && typeof page.content_json === 'string') {
      try {
        page.content_json = JSON.parse(page.content_json);
      } catch (e) {
        page.content_json = {};
      }
    }
    return page;
  } catch (error) {
    console.error('❌ [fetchPageData] خطا:', error);
    return null;
  }
}

// ============================================================
// تولید متا برای هر مسیر
// ============================================================
async function generateMetaForRoute(reqPath) {
  const siteSettings = await fetchSiteSettings();

  const baseSiteName = siteSettings?.siteName || 'HomeMart';
  const defaultImage = siteSettings?.ogImage || siteSettings?.logo || '/og-default.png';

  const absoluteUrl = (url) => {
    if (!url) return `${SITE_URL}/og-default.png`;
    return url.startsWith('http') ? url : `${SITE_URL}${url}`;
  };

  // ---------- ۱. صفحه اصلی ----------
  if (reqPath === '/' || reqPath === '') {
    const homePage = await fetchPageData('home');
    return {
      title: homePage?.seo_title || siteSettings?.seo_title || DEFAULT_TITLE,
      description: homePage?.seo_description || siteSettings?.seo_description || DEFAULT_DESCRIPTION,
      image: absoluteUrl(defaultImage),
      url: `${SITE_URL}/`,
      type: 'website',
      siteName: baseSiteName,
    };
  }

  // ---------- ۲. صفحه محصول ----------
  const productMatch = reqPath.match(/^\/product\/([^\/\?]+)/);
  if (productMatch) {
    let slug = productMatch[1];
    try { slug = decodeURIComponent(slug); } catch (e) {}

    try {
      const [rows] = await pool.query(
        `SELECT id, name, slug, meta_title, meta_description, meta_keywords,
                image_url, price, stock, brand, created_at, updated_at
         FROM products
         WHERE (slug = ? OR id = ?) AND deleted_at IS NULL
         LIMIT 1`,
        [slug, slug]
      );

      if (rows.length > 0) {
        const p = rows[0];
        const productTitle = p.meta_title || `${p.name} | ${baseSiteName}`;
        const productDescription = p.meta_description
          || `خرید ${p.name} با بهترین قیمت از فروشگاه اینترنتی ${baseSiteName}. ارسال سریع و ضمانت اصالت کالا.`;

        return {
          title: productTitle,
          description: productDescription,
          image: absoluteUrl(p.image_url || defaultImage),
          url: `${SITE_URL}/product/${encodeURIComponent(p.slug || slug)}`,
          type: 'product',
          siteName: baseSiteName,
          price: p.price,
          inStock: (p.stock || 0) > 0,
          name: p.meta_title || p.name,
          brand: p.brand || null,
          publishedTime: p.created_at ? new Date(p.created_at).toISOString() : PUBLISHED_DATE,
          modifiedTime: p.updated_at ? new Date(p.updated_at).toISOString() : MODIFIED_DATE,
        };
      }
    } catch (error) {
      console.error('❌ [generateMetaForRoute] خطا در fetch محصول:', error);
    }

    return {
      title: baseSiteName,
      description: DEFAULT_DESCRIPTION,
      image: absoluteUrl(defaultImage),
      url: `${SITE_URL}${reqPath}`,
      type: 'website',
      siteName: baseSiteName,
    };
  }

  // ---------- ۳. صفحات داینامیک ----------
  let pageSlug = null;
  if (reqPath === '/contact') pageSlug = 'contact';
  else if (reqPath === '/support') pageSlug = 'support';
  else if (reqPath.startsWith('/page/')) pageSlug = reqPath.replace('/page/', '');
  else if (reqPath === '/shop' || reqPath === '/products') pageSlug = 'shop';
  else if (reqPath === '/about') pageSlug = 'about';

  if (pageSlug) {
    const page = await fetchPageData(pageSlug);
    if (page) {
      return {
        title: page.seo_title || page.title || baseSiteName,
        description: page.seo_description || siteSettings?.seo_description || DEFAULT_DESCRIPTION,
        image: absoluteUrl(page.content_json?.imageUrl || defaultImage),
        url: `${SITE_URL}${reqPath}`,
        type: 'website',
        siteName: baseSiteName,
      };
    }
  }

  // ---------- ۴. پیش‌فرض ----------
  return {
    title: baseSiteName,
    description: DEFAULT_DESCRIPTION,
    image: absoluteUrl(defaultImage),
    url: `${SITE_URL}${reqPath}`,
    type: 'website',
    siteName: baseSiteName,
  };
}

// ============================================================
// ✅ تبدیل متا به HTML
// ============================================================
function metaToHtml(meta) {
  const esc = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const parts = [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<meta name="author" content="${AUTHOR_NAME}" />`,

    // ✅ ICO (fallback برای همه)
    `<link rel="icon" type="image/x-icon" href="${SITE_URL}/favicon.ico" sizes="any" />`,
    // ✅ SVG (اولویت اول مرورگرهای مدرن)
    `<link rel="icon" type="image/svg+xml" href="${SITE_URL}/favicon.svg" />`,
    // ✅ PNG ها
    `<link rel="icon" type="image/png" sizes="16x16" href="${SITE_URL}/favicon-16x16.png" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${SITE_URL}/favicon-32x32.png" />`,
    `<link rel="icon" type="image/png" sizes="48x48" href="${SITE_URL}/favicon-48x48.png" />`,
    `<link rel="icon" type="image/png" sizes="96x96" href="${SITE_URL}/favicon-96x96.png" />`,
    `<link rel="icon" type="image/png" sizes="192x192" href="${SITE_URL}/favicon-192x192.png" />`,
    `<link rel="icon" type="image/png" sizes="512x512" href="${SITE_URL}/favicon-512x512.png" />`,
    // ✅ Apple Touch Icons
    `<link rel="apple-touch-icon" sizes="180x180" href="${SITE_URL}/apple-touch-icon.png" />`,
    `<link rel="apple-touch-icon-precomposed" sizes="180x180" href="${SITE_URL}/apple-touch-icon-precomposed.png" />`,
    // ✅ Manifest
    `<link rel="manifest" href="${SITE_URL}/site.webmanifest" />`,
    // ✅ Windows Tiles
    `<meta name="msapplication-TileColor" content="#800E2F" />`,
    `<meta name="msapplication-TileImage" content="${SITE_URL}/mstile-150x150.png" />`,
    `<meta name="msapplication-config" content="/browserconfig.xml" />`,
    // ✅ Theme Color
    `<meta name="theme-color" content="#800E2F" />`,

    // ✅ SEO & OpenGraph
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:image" content="${esc(meta.image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta property="og:type" content="${esc(meta.type)}" />`,
    `<meta property="og:site_name" content="${esc(meta.siteName)}" />`,
    `<meta property="og:locale" content="fa_IR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(meta.image)}" />`,
  ];

  const publishedTime = meta.publishedTime || PUBLISHED_DATE;
  const modifiedTime = meta.modifiedTime || MODIFIED_DATE;

  parts.push(`<meta property="article:published_time" content="${esc(publishedTime)}" />`);
  parts.push(`<meta property="article:modified_time" content="${esc(modifiedTime)}" />`);
  parts.push(`<meta property="article:author" content="${AUTHOR_NAME}" />`);

  if (meta.type === 'product' && meta.price) {
    parts.push(`<meta property="product:price:amount" content="${esc(meta.price)}" />`);
    parts.push(`<meta property="product:price:currency" content="IRR" />`);
    parts.push(`<meta property="product:availability" content="${meta.inStock ? 'in stock' : 'out of stock'}" />`);
  }

  if (meta.type === 'product' && meta.name) {
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: meta.name,
      description: meta.description || '',
      image: meta.image ? [meta.image] : [],
      brand: meta.brand ? { '@type': 'Brand', name: meta.brand } : undefined,
      offers: {
        '@type': 'Offer',
        url: meta.url,
        priceCurrency: 'IRR',
        price: meta.price || 0,
        availability: meta.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
      author: { '@type': 'Person', name: AUTHOR_NAME },
      datePublished: publishedTime,
      dateModified: modifiedTime,
    };
    parts.push(`<script type="application/ld+json">${JSON.stringify(productSchema)}</script>`);
  } else {
    const siteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: meta.siteName || 'HomeMart',
      url: SITE_URL,
      author: { '@type': 'Person', name: AUTHOR_NAME },
      publisher: {
        '@type': 'Organization',
        name: meta.siteName || 'HomeMart',
        logo: {
          '@type': 'ImageObject',
          url: meta.image || `${SITE_URL}/og-default.png`,
        },
      },
      datePublished: publishedTime,
      dateModified: modifiedTime,
    };
    parts.push(`<script type="application/ld+json">${JSON.stringify(siteSchema)}</script>`);
  }

  return parts.join('\n    ');
}

// ============================================================
// پاک‌سازی متا تگ‌ها از HTML رندر شده
// ============================================================
function stripMetaTags(html) {
  return html.replace(
    /<title[^>]*>[\s\S]*?<\/title>|<meta\s[^>]*\/?>|<link\s[^>]*\/?>|<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
    ''
  );
}

// ============================================================
// API Routes
// ============================================================
console.log('📌 بارگذاری مسیرهای API...');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const addressRoutes = require('./routes/addressRoutes');
const discountCodeRoutes = require('./routes/discountCodeRoutes');
const cartRoutes = require('./routes/cartRoutes');
const pageRoutes = require('./routes/pageRoutes');
const settingRoutes = require('./routes/settingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const sitemapRoutes = require('./routes/sitemapRoutes');
const uploadRoutes = require('./routes/uploadRoutes.js');

app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', pageRoutes);
app.use('/api', settingRoutes);
app.use('/api', sitemapRoutes);
app.use('/api', uploadRoutes);
app.use('/api', notificationRoutes);

app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', reviewRoutes);
app.use('/api', wishlistRoutes);
app.use('/api', ticketRoutes);
app.use('/api', addressRoutes);
app.use('/api', cartRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api', attributeRoutes);
app.use('/api/admin', discountCodeRoutes);
app.use('/api/admin/reports', reportRoutes);

// ✅✅✅ sitemap.xml روی ریشه دامنه
app.use('/', sitemapRoutes);

console.log('✅ همه مسیرهای API ثبت شدند');

// ============================================================
// Static Files
// ============================================================
app.use('/assets', express.static(path.join(frontendDist, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

app.use((req, res, next) => {
  if (req.path.startsWith('/assets/') || req.path.startsWith('/uploads/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

app.use((req, res, next) => {
  if (req.path.includes('.')) {
    const filePath = path.join(frontendDist, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }
    return res.status(404).send('Not Found');
  }
  next();
});

// ============================================================
// SSR Middleware
// ============================================================
console.log('📌 تنظیم میدلویر SSR...');

const excludePaths = ['/admin', '/cart', '/payment', '/profile', '/wishlist', '/login', '/register'];

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  if (req.path.includes('.')) {
    return next();
  }

  if (excludePaths.some(p => req.path.startsWith(p))) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Vary', 'Accept-Encoding, Cookie');
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }

  if (typeof renderApp !== 'function') {
    console.warn(`⚠️ renderApp در دسترس نیست، ارسال index.html برای ${req.path}`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Vary', 'Accept-Encoding, Cookie');
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }

  try {
    console.log(`🔄 [SSR] شروع رندر برای: ${req.path}`);

    const meta = await generateMetaForRoute(req.path);

    const slug = req.path.split('/').filter(Boolean).pop() || 'home';
    const [pageData, siteSettings] = await Promise.all([
      fetchPageData(slug),
      fetchSiteSettings(),
    ]);

    const initialData = {
      page: pageData,
      slug: slug,
      siteSettings: siteSettings,
    };

    const result = renderApp(req.url, initialData);
    let html = result.html || '';

    if (!html) {
      console.warn(`⚠️ [SSR] html خالی است برای ${req.path}`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Vary', 'Accept-Encoding, Cookie');
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }

    const cleanedHtml = stripMetaTags(html);

    const template = fs.readFileSync(path.join(frontendDist, 'index.html'), 'utf8');

    const metaHtml = metaToHtml(meta);
    let finalHtml = template
      .replace(/<title>.*?<\/title>/, '')
      .replace(/<meta[^>]*msvalidate[^>]*>/i, '')
      .replace('</head>', `${metaHtml}\n  </head>`);

    finalHtml = finalHtml.replace(
      '<div id="root"></div>',
      `<div id="root">${cleanedHtml}</div>`
    );

    finalHtml = finalHtml.replace(
      '</body>',
      `    <script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, '\\u003c')};</script>\n  </body>`
    );

    res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate');
    res.setHeader('Vary', 'Accept-Encoding, Cookie');

    console.log(`✅ [SSR] رندر موفق برای ${req.path}`);
    res.status(200).send(finalHtml);
  } catch (error) {
    console.error(`❌ [SSR] خطا در رندر ${req.path}:`, error.message);
    console.error('❌ [SSR] Stack:', error.stack);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Vary', 'Accept-Encoding, Cookie');
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

// ============================================================
// Fallback
// ============================================================
app.use((req, res) => {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Vary', 'Accept-Encoding, Cookie');
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ============================================================
// Error Handler
// ============================================================
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// ============================================================
// Database Connection
// ============================================================
console.log('📌 اتصال به دیتابیس...');
pool.getConnection()
  .then(async (connection) => {
    console.log('✅ اتصال به دیتابیس با موفقیت برقرار شد');
    connection.release();

    // ✅ ساخت فاوآیکون‌ها بعد از اتصال به DB
    await ensureFavicons(pool);
  })
  .catch((err) => {
    console.error('❌ خطا در اتصال به دیتابیس:', err.message);
    process.exit(1);
  });

// ============================================================
// Cron Job
// ============================================================
console.log('📌 راه‌اندازی Cron Job...');
const { startCron } = require('./config/cron');
startCron();
console.log('✅ Cron Job راه‌اندازی شد');

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 سرور در حال اجرا روی پورت ${PORT}`);
  console.log(`🌐 آدرس: http://localhost:${PORT}`);
  console.log(`📂 پوشه آپلود: ${uploadsDir}`);
  console.log(`🎨 پوشه فاوآیکون: ${faviconsDir}`);
  console.log(`🕐 تایم‌زون: ${process.env.TZ || 'Asia/Tehran'}`);
  console.log('✅ سرور با موفقیت راه‌اندازی شد');
});

// ============================================================
// Graceful Shutdown
// ============================================================
process.on('SIGINT', () => {
  console.log('🛑 دریافت سیگنال SIGINT...');
  if (pool && typeof pool.end === 'function') {
    pool.end(() => {
      console.log('✅ اتصال به دیتابیس بسته شد');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGTERM', () => {
  console.log('🛑 دریافت سیگنال SIGTERM...');
  if (pool && typeof pool.end === 'function') {
    pool.end(() => {
      console.log('✅ اتصال به دیتابیس بسته شد');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

console.log('✅ بارگذاری کامل شد');