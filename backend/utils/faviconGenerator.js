// backend/utils/faviconGenerator.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const logger = require('./logger');

// ✅ SITE_URL برای ساخت URL کامل در browserconfig.xml
const SITE_URL = process.env.BASE_URL || 'https://aasgari.ir';

const faviconsDir = path.join(__dirname, '..', 'public', 'favicons');
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(faviconsDir)) {
  fs.mkdirSync(faviconsDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// ============================================================
// ساخت ICO واقعی از چند فایل PNG
// ============================================================
function buildIcoFromPngs(pngPaths) {
  const pngBuffers = pngPaths.map(p => fs.readFileSync(p));
  const numImages = pngBuffers.length;
  const headerSize = 6 + (16 * numImages);

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);

  const entries = Buffer.alloc(16 * numImages);
  let dataOffset = headerSize;

  pngBuffers.forEach((pngBuffer, i) => {
    const fileName = path.basename(pngPaths[i]);
    const sizeMatch = fileName.match(/favicon-(\d+)x/);
    let width = sizeMatch ? parseInt(sizeMatch[1]) : 48;

    const widthByte = width >= 256 ? 0 : width;
    const heightByte = width >= 256 ? 0 : width;

    const entryOffset = 16 * i;
    entries.writeUInt8(widthByte, entryOffset + 0);
    entries.writeUInt8(heightByte, entryOffset + 1);
    entries.writeUInt8(0, entryOffset + 2);
    entries.writeUInt8(0, entryOffset + 3);
    entries.writeUInt16LE(1, entryOffset + 4);
    entries.writeUInt16LE(32, entryOffset + 6);
    entries.writeUInt32LE(pngBuffer.length, entryOffset + 8);
    entries.writeUInt32LE(dataOffset, entryOffset + 12);
    dataOffset += pngBuffer.length;
  });

  return Buffer.concat([header, entries, ...pngBuffers]);
}

// ============================================================
// ساخت SVG از PNG (fallback)
// ============================================================
function buildSvgFromPng(pngPath, size = 512) {
  const pngBuffer = fs.readFileSync(pngPath);
  const base64 = pngBuffer.toString('base64');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <title>HomeMart</title>
  <image width="${size}" height="${size}" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;
}

// ============================================================
// ✅ تابع اصلی — پشتیبانی از SVG و PNG
// ============================================================
async function generateFaviconSizes(sourceFilePath) {
  try {
    if (!fs.existsSync(sourceFilePath)) {
      logger.error(`❌ [generateFaviconSizes] فایل پیدا نشد: ${sourceFilePath}`);
      return false;
    }

    const sourceExt = path.extname(sourceFilePath).toLowerCase();
    const isSvg = sourceExt === '.svg';

    logger.info(`🎨 [generateFaviconSizes] شروع پردازش: ${sourceFilePath} (${isSvg ? 'SVG ✨' : 'رستری'})`);

    const sharpOptions = isSvg ? { density: 400 } : {};

    const sizes = [16, 32, 48, 96, 192, 512];
    const pngPaths = [];

    // ۱. همه سایزهای PNG
    for (const size of sizes) {
      const outputPath = path.join(faviconsDir, `favicon-${size}x${size}.png`);
      await sharp(sourceFilePath, sharpOptions)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(outputPath);
      pngPaths.push(outputPath);
      logger.info(`   ✅ ساخته شد: favicon-${size}x${size}.png`);
    }

    // ۲. Apple Touch Icon 180×180
    await sharp(sourceFilePath, sharpOptions)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(path.join(faviconsDir, 'apple-touch-icon.png'));
    logger.info(`   ✅ ساخته شد: apple-touch-icon.png`);

    // ۳. mstile 150×150 (برای ویندوز)
    await sharp(sourceFilePath, sharpOptions)
      .resize(150, 150, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100 })
      .toFile(path.join(faviconsDir, 'mstile-150x150.png'));
    logger.info(`   ✅ ساخته شد: mstile-150x150.png`);

    // ۴. ICO واقعی
    try {
      const icoPngPaths = [16, 32, 48]
        .map(s => path.join(faviconsDir, `favicon-${s}x${s}.png`))
        .filter(p => fs.existsSync(p));

      if (icoPngPaths.length > 0) {
        const icoBuffer = buildIcoFromPngs(icoPngPaths);
        fs.writeFileSync(path.join(faviconsDir, 'favicon.ico'), icoBuffer);
        logger.info(`   ✅ ساخته شد: favicon.ico (ICO واقعی با ${icoPngPaths.length} سایز)`);
      }
    } catch (icoErr) {
      logger.warn('   ⚠️ خطا در ICO:', icoErr.message);
    }

    // ۵. SVG اصلی
    const svgPath = path.join(faviconsDir, 'favicon.svg');

    if (isSvg) {
      fs.copyFileSync(sourceFilePath, svgPath);
      logger.info(`   ✅ کپی شد: favicon.svg (vector واقعی) ✨`);
    } else if (!fs.existsSync(svgPath)) {
      const png512Path = path.join(faviconsDir, 'favicon-512x512.png');
      if (fs.existsSync(png512Path)) {
        const svgContent = buildSvgFromPng(png512Path, 512);
        fs.writeFileSync(svgPath, svgContent, 'utf8');
        logger.info(`   ✅ ساخته شد: favicon.svg (fallback - PNG embed)`);
      }
    } else {
      logger.info(`   ℹ️ favicon.svg از قبل وجود دارد`);
    }

    // ۶. site.webmanifest
    const manifest = {
      name: 'HomeMart',
      short_name: 'HomeMart',
      description: 'فروشگاه اینترنتی لوازم خانگی',
      icons: [
        { src: '/favicons/favicon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/favicons/favicon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ],
      theme_color: '#800E2F',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      orientation: 'portrait',
      lang: 'fa-IR',
      dir: 'rtl'
    };

    fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
    logger.info(`   ✅ ساخته شد: site.webmanifest`);

    // ✅ ۷. browserconfig.xml (با URL کامل)
    const browserConfig = `<?xml version="1.0" encoding="UTF-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="${SITE_URL}/mstile-150x150.png"/>
      <TileColor>#800E2F</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;

    fs.writeFileSync(
      path.join(publicDir, 'browserconfig.xml'),
      browserConfig,
      'utf8'
    );
    logger.info(`   ✅ ساخته شد: browserconfig.xml`);

    logger.info(`✅ [generateFaviconSizes] تمام شد`);
    return true;
  } catch (error) {
    logger.error(`❌ [generateFaviconSizes] خطا:`, error);
    return false;
  }
}

// ============================================================
// چک و ساخت خودکار هنگام شروع سرور
// ============================================================
async function ensureFavicons(pool) {
  try {
    const favicon16Path = path.join(faviconsDir, 'favicon-16x16.png');
    if (fs.existsSync(favicon16Path)) {
      logger.info('✅ [Favicons] فایل‌های فاوآیکون از قبل وجود دارند');
      return;
    }

    logger.info('🎨 [Favicons] فایل‌های فاوآیکون وجود ندارند، در حال ساخت...');

    const [rows] = await pool.query(
      `SELECT content_json FROM pages WHERE slug = 'site-settings' AND deleted_at IS NULL`
    );
    if (rows.length === 0) {
      logger.warn('⚠️ [Favicons] site-settings یافت نشد');
      return;
    }

    const content = rows[0].content_json;
    const siteSettings = typeof content === 'string' ? JSON.parse(content) : content;

    if (!siteSettings?.favicon) {
      logger.warn('⚠️ [Favicons] هیچ فاوآیکونی در site-settings تنظیم نشده');
      return;
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');

    let sourcePath;
    if (siteSettings.favicon.startsWith('http')) {
      logger.warn('⚠️ [Favicons] فاوآیکون از URL خارجی، skip');
      return;
    } else if (siteSettings.favicon.startsWith('/uploads/')) {
      sourcePath = path.join(uploadsDir, path.basename(siteSettings.favicon));
    } else {
      sourcePath = path.join(__dirname, '..', siteSettings.favicon);
    }

    await generateFaviconSizes(sourcePath);
  } catch (error) {
    logger.error('❌ [Favicons] خطا در ensureFavicons:', error);
  }
}

module.exports = {
  generateFaviconSizes,
  ensureFavicons,
  faviconsDir,
  publicDir
};