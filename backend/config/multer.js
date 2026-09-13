// backend/config/multer.js
const logger = require("../utils/logger");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // ✅ پسوندهای مجاز (اضافه شدن ico و svg)
  const validExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'ico', 'svg'];

  // ✅ MIME type های مجاز (برای سازگاری با مرورگرهای مختلف)
  const validMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'image/x-icon', 'image/vnd.microsoft.icon', 'image/ico', 'image/icon',
    'image/svg+xml', 'image/svg',
    'application/ico', 'application/x-ico',
  ];

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = (file.mimetype || '').toLowerCase();

  const isExtValid = validExtensions.includes(ext);
  const isMimeValid = validMimes.includes(mime) || mime.startsWith('image/');

  if (isExtValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های تصویری (jpeg, jpg, png, gif, webp, ico, svg) مجاز هستند'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // ۵ مگابایت
});

module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 10),
};