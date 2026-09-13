// src/utils/formatPrice.js

// ============================================================
// ۱. فرمت قیمت با کاما (اعداد انگلیسی)
// ============================================================
export const formatPrice = (price) => {
  return Math.round(price).toLocaleString('en-US');
};

// ============================================================
// ۲. تبدیل اعداد انگلیسی به فارسی
// ============================================================
export const toPersianNumber = (num) => {
  if (num === undefined || num === null || num === '') return '';
  const str = String(num);
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// ============================================================
// ۳. فرمت قیمت با کاما + رقم فارسی (ترکیبی)
// ============================================================
export const formatPricePersian = (price) => {
  const formatted = formatPrice(price);
  return toPersianNumber(formatted);
};