// fix-meta-tags.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// لیست فایل‌هایی که باید تغییر کنند
const filesToFix = [
  'src/App.jsx',
  'src/entry-server.jsx',
  'src/components/PageViewer.jsx',
  'src/components/product/ProductDetail.jsx',
  'src/components/product/MobileProductDetail.jsx',
  'src/components/contact/ContactPage.jsx',
  'src/components/contact/MobileContactPage.jsx',
  'src/components/support/SupportPage.jsx',
  'src/components/support/MobileSupportPage.jsx',
];

// ۱. حذف importهای react-helmet-async
function removeHelmetImport(content) {
  return content
    .replace(/import\s*\{[^}]*Helmet[^}]*\}\s*from\s*['"]react-helmet-async['"];?\s*/g, '')
    .replace(/import\s*\{[^}]*HelmetProvider[^}]*\}\s*from\s*['"]react-helmet-async['"];?\s*/g, '');
}

// ۲. جایگزینی <Helmet> با تگ‌های معمولی
function replaceHelmetTags(content) {
  // الگوی <Helmet>...</Helmet> را پیدا کن
  const helmetRegex = /<Helmet>([\s\S]*?)<\/Helmet>/g;
  
  return content.replace(helmetRegex, (match, innerContent) => {
    // داخل محتوای Helmet را استخراج کن
    // تگ‌های title, meta, link را بدون تغییر نگه دار
    return innerContent.trim();
  });
}

// ۳. حذف HelmetProvider از App.jsx
function removeHelmetProvider(content) {
  // حذف import HelmetProvider
  let newContent = content.replace(
    /import\s*\{[^}]*HelmetProvider[^}]*\}\s*from\s*['"]react-helmet-async['"];?\s*/g,
    ''
  );
  
  // حذف <HelmetProvider> از JSX
  newContent = newContent.replace(/<HelmetProvider>/g, '');
  newContent = newContent.replace(/<\/HelmetProvider>/g, '');
  
  return newContent;
}

// ۴. حذف helmetContext از entry-server.jsx
function removeHelmetContext(content) {
  // حذف import HelmetProvider
  let newContent = content.replace(
    /import\s*\{[^}]*HelmetProvider[^}]*\}\s*from\s*['"]react-helmet-async['"];?\s*/g,
    ''
  );
  
  // حذف <HelmetProvider context={helmetContext}> و </HelmetProvider>
  newContent = newContent.replace(/<HelmetProvider\s+context=\{helmetContext\}>/g, '');
  newContent = newContent.replace(/<\/HelmetProvider>/g, '');
  
  // حذف helmetContext از پارامترهای تابع
  newContent = newContent.replace(/export\s+default\s+function\s+render\s*\(\s*url\s*,\s*helmetContext\s*\)/g, 'export default function render(url)');
  
  // حذف return { html, helmet: helmetContext.helmet }
  newContent = newContent.replace(/return\s*\{\s*html\s*,\s*helmet\s*:\s*helmetContext\.helmet\s*\}/g, 'return { html }');
  
  return newContent;
}

// تابع اصلی
function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ فایل وجود ندارد: ${filePath}`);
    return;
  }
  
  console.log(`🔧 در حال پردازش: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  // تغییرات بر اساس نام فایل
  if (filePath === 'src/App.jsx') {
    const newContent = removeHelmetProvider(content);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  } else if (filePath === 'src/entry-server.jsx') {
    const newContent = removeHelmetContext(content);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  } else {
    // سایر فایل‌ها
    const withoutImport = removeHelmetImport(content);
    const finalContent = replaceHelmetTags(withoutImport);
    if (finalContent !== content) {
      content = finalContent;
      changed = true;
    }
  }
  
  if (changed) {
    // پشتیبان‌گیری
    const backupPath = fullPath + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(fullPath, 'utf8'));
    console.log(`✅ پشتیبان در ${backupPath} ذخیره شد`);
    
    // ذخیره تغییرات
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ تغییرات در ${filePath} اعمال شد`);
  } else {
    console.log(`ℹ️ هیچ تغییری در ${filePath} اعمال نشد`);
  }
}

// اجرا
console.log('🚀 شروع فرآیند اصلاح متا تگ‌ها...\n');

filesToFix.forEach(fixFile);

console.log('\n✅ فرآیند کامل شد!');
console.log('⚠️ لطفاً قبل از بیلد، تغییرات را بررسی کنید.');
console.log('📁 فایل‌های پشتیبان با پسوند .backup ذخیره شدند.');