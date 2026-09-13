// src/utils/reportExcelUtils.js
import ExcelJS from 'exceljs';
import { formatPricePersian, toPersianNumber } from './formatPrice';
import { formatJalaliDate } from './jalaliUtils';

// ============================================================
// توابع کمکی
// ============================================================
export const toPersianNumberSafe = (num) => {
  if (num === undefined || num === null || num === '') return '۰';
  return toPersianNumber(num);
};

export const formatPriceSafe = (price) => {
  return formatPricePersian(price || 0);
};

export const formatJalaliDateTime = (date) => {
  if (!date || isNaN(date.getTime())) return '-';
  return formatJalaliDate(date);
};

// ============================================================
// ✅ تابع اصلاح‌شده: نام کامل محصول با فیلتر کلیدهای سیستمی
// ============================================================
const getFullProductNameForExcel = (item, attributeTypes = [], allValues = {}) => {
  const attrs = [];
  
  // ۱. رنگ از color_name
  if (item.color_name) {
    attrs.push(`رنگ: ${item.color_name}`);
  }
  
  // ۲. ویژگی‌های دیگر از JSON
  let attrValues = null;
  if (item.attribute_values_json) {
    try {
      attrValues = typeof item.attribute_values_json === 'string'
        ? JSON.parse(item.attribute_values_json)
        : item.attribute_values_json;
    } catch (e) {
      attrValues = null;
    }
  }
  
  // ۳. اگر color_name نداشت، رنگ رو از JSON بگیر
  if (!item.color_name && attrValues && attrValues['1']) {
    attrs.push(`رنگ: ${attrValues['1']}`);
  }
  
  // ۴. سایز
  if (item.size_name) {
    attrs.push(`سایز: ${item.size_name}`);
  }
  
  // ۵. سایر ویژگی‌ها (فقط کلیدهای معتبر)
  if (attrValues && typeof attrValues === 'object') {
    for (const [key, value] of Object.entries(attrValues)) {
      // ✅ skip "1" (رنگ - قبلاً اضافه شد)
      if (key === '1') continue;
      // ✅ skip کلیدهای سیستمی (_color_code, _something, ...)
      if (key.startsWith('_')) continue;
      // ✅ skip مقادیر خالی
      if (value === null || value === undefined || value === '') continue;
      
      // تلاش برای پیدا کردن نام ویژگی از attributeTypes (اختیاری)
      let typeName = key;
      if (attributeTypes && Array.isArray(attributeTypes)) {
        const type = attributeTypes.find(t => String(t.id) === String(key));
        if (type) typeName = type.label;
      }
      
      attrs.push(`${typeName}: ${value}`);
    }
  }
  
  const productName = item.product_name || item.name || 'محصول';
  if (attrs.length === 0) return productName;
  return `${productName} (${attrs.join(' - ')})`;
};

// ============================================================
// دانلود فایل
// ============================================================
export const downloadExcelWorkbook = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

// ============================================================
// استایل هدر جدول
// ============================================================
export const styleTableHeader = (row) => {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF800E2F' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
};

// ============================================================
// تولید شیت خلاصه آمار
// ============================================================
export const generateSummaryExcel = async (summary, filters, startDateStr, endDateStr) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('خلاصه آمار');
  ws.views = [{ rightToLeft: false }];

  ws.columns = [
    { header: 'شاخص', key: 'index', width: 50 },
    { header: 'مقدار (ت)', key: 'value', width: 50 },
  ];

  const categoryLabel = filters?.categoryName === 'همه' ? 'همه محصولات' : `محصولات ${filters?.categoryName || 'همه'}`;
  const titleRow = ws.addRow([`گزارش خلاصه آمار فروش - ${categoryLabel}`]);
  ws.mergeCells(`A${titleRow.number}:B${titleRow.number}`);
  titleRow.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF800E2F' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  ws.addRow([]);

  const filterText = `تاریخ شروع: ${startDateStr}  |  تاریخ پایان: ${endDateStr}  |  وضعیت سفارش: ${filters?.status || 'همه'}`;
  const filterRow = ws.addRow([filterText]);
  ws.mergeCells(`A${filterRow.number}:B${filterRow.number}`);
  filterRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
  filterRow.getCell(1).font = { size: 12, bold: false, color: { argb: 'FF333333' } };
  filterRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  ws.addRow([]);

  const summaryTitle = ws.addRow(['خلاصه آمار']);
  ws.mergeCells(`A${summaryTitle.number}:B${summaryTitle.number}`);
  summaryTitle.getCell(1).font = { bold: true, size: 13 };
  summaryTitle.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };

  const headerRow = ws.addRow(['شاخص', 'مقدار (ت)']);
  styleTableHeader(headerRow);

  const dataRows = [
    ['تعداد سفارشات', summary?.totalOrders || 0],
    ['جمع فروش', summary?.totalSales || 0],
    ['میانگین هر سفارش', summary?.averageOrderValue || 0],
    ['تعداد مشتریان', summary?.totalCustomers || 0],
    ['تعداد محصولات فروخته شده', summary?.totalItems || 0],
  ];

  dataRows.forEach((row, index) => {
    const r = ws.addRow(row);
    r.getCell(1).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
    if (index > 0) r.getCell(2).numFmt = '#,##0';
    r.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  return workbook;
};

// ============================================================
// تولید شیت محصولات پرفروش
// ============================================================
export const generateTopProductsExcel = async (topProducts, filters, startDateStr, endDateStr) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('محصولات پرفروش');
  ws.views = [{ rightToLeft: false }];

  ws.columns = [
    { header: 'ردیف', key: 'row', width: 10 },
    { header: 'نام محصول', key: 'name', width: 50 },
    { header: 'تعداد فروش', key: 'qty', width: 25 },
    { header: 'درآمد (ت)', key: 'revenue', width: 30 },
  ];

  const categoryLabel = filters?.categoryName === 'همه' ? 'همه محصولات' : `محصولات ${filters?.categoryName || 'همه'}`;
  const titleRow = ws.addRow([`گزارش محصولات پرفروش - ${categoryLabel}`]);
  ws.mergeCells(`A${titleRow.number}:D${titleRow.number}`);
  titleRow.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF800E2F' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  ws.addRow([]);

  const filterText = `تاریخ شروع: ${startDateStr}  |  تاریخ پایان: ${endDateStr}  |  وضعیت سفارش: ${filters?.status || 'همه'}`;
  const filterRow = ws.addRow([filterText]);
  ws.mergeCells(`A${filterRow.number}:D${filterRow.number}`);
  filterRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
  filterRow.getCell(1).font = { size: 12, bold: false, color: { argb: 'FF333333' } };
  filterRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  ws.addRow([]);

  const headerRow = ws.addRow(['ردیف', 'نام محصول', 'تعداد فروش', 'درآمد (ت)']);
  styleTableHeader(headerRow);

  if (topProducts?.length) {
    topProducts.forEach((item, index) => {
      const row = ws.addRow([
        index + 1,
        item?.name || 'نامشخص',
        item?.totalQuantity || 0,
        item?.totalRevenue || 0,
      ]);
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (cell.col === 3 || cell.col === 4) cell.numFmt = '#,##0';
      });
    });
  } else {
    const row = ws.addRow(['', 'محصولی یافت نشد', '', '']);
    ws.mergeCells(`B${row.number}:D${row.number}`);
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  }

  return workbook;
};

// ============================================================
// تولید شیت لیست سفارشات
// ============================================================
export const generateOrdersExcel = async (orders, filters, startDateStr, endDateStr, attributeTypes = [], allValues = {}) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('لیست سفارشات');
  ws.views = [{ rightToLeft: false }];

  ws.columns = [
    { header: 'شناسه کاربر', key: 'user_id', width: 15 },
    { header: 'کد پیگیری', key: 'tracking', width: 30 },
    { header: 'کاربر', key: 'user', width: 28 },
    { header: 'مبلغ (ت)', key: 'total', width: 25 },
    { header: 'وضعیت', key: 'status', width: 20 },
    { header: 'تاریخ و ساعت', key: 'datetime', width: 32 },
  ];

  const categoryLabel = filters?.categoryName === 'همه' ? 'همه محصولات' : `محصولات ${filters?.categoryName || 'همه'}`;
  const titleRow = ws.addRow([`گزارش لیست سفارشات - ${categoryLabel}`]);
  ws.mergeCells(`A${titleRow.number}:F${titleRow.number}`);
  titleRow.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF800E2F' } };
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  ws.addRow([]);

  const filterRow = ws.addRow([
    filters?.status || 'همه',
    'وضعیت سفارش:',
    endDateStr,
    'تاریخ پایان:',
    startDateStr,
    'تاریخ شروع:',
  ]);
  filterRow.eachCell((cell) => {
    cell.font = { size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    if (cell.col % 2 === 0) {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
    }
  });
  ws.getRow(filterRow.number).height = 30;
  ws.addRow([]);

  if (orders?.length) {
    orders.forEach((order, index) => {
      const items = order?.items || [];
      
      const originalTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      
      const dateTimeStr = order?.created_at ? formatJalaliDateTime(new Date(order.created_at)) : '-';
      const addressParts = [];
      if (order?.address) addressParts.push(`آدرس: ${order.address}`);
      if (order?.phone) addressParts.push(`تلفن: ${order.phone}`);
      if (order?.receiver_name) addressParts.push(`گیرنده: ${order.receiver_name}`);
      const fullAddress = addressParts.length ? addressParts.join(' | ') : 'آدرسی ثبت نشده است';

      const headerRow = ws.addRow(['شناسه کاربر', 'کد پیگیری', 'کاربر', 'مبلغ (ت)', 'وضعیت', 'تاریخ و ساعت']);
      styleTableHeader(headerRow);

      const orderRow = ws.addRow([
        order?.user_id || '',
        order?.tracking_code || '---',
        order?.user_name || 'کاربر',
        order?.total_price || 0,
        order?.status || 'نامشخص',
        dateTimeStr,
      ]);
      orderRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (colNumber === 4) cell.numFmt = '#,##0';
      });

      const itemsHeaderRow = ws.addRow(['', '', '', '', '', '']);
      ws.mergeCells(`A${itemsHeaderRow.number}:A${itemsHeaderRow.number}`);
      ws.mergeCells(`B${itemsHeaderRow.number}:B${itemsHeaderRow.number}`);
      ws.mergeCells(`C${itemsHeaderRow.number}:C${itemsHeaderRow.number}`);
      ws.mergeCells(`D${itemsHeaderRow.number}:D${itemsHeaderRow.number}`);
      ws.mergeCells(`E${itemsHeaderRow.number}:F${itemsHeaderRow.number}`);
      itemsHeaderRow.getCell(1).value = 'تعداد';
      itemsHeaderRow.getCell(2).value = 'مبلغ (ت)';
      itemsHeaderRow.getCell(3).value = 'تخفیف ویژه';
      itemsHeaderRow.getCell(4).value = 'تخفیف با کد';
      itemsHeaderRow.getCell(5).value = 'محصول';
      [1, 2, 3, 4, 5].forEach(col => {
        const cell = itemsHeaderRow.getCell(col);
        cell.font = { bold: true, size: 11, color: { argb: 'FF333333' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      if (items.length) {
        items.forEach((item) => {
          const quantity = item?.quantity || 1;
          const unitPrice = item?.price || 0;
          const originalPrice = item?.original_price || unitPrice;
          const totalPrice = quantity * unitPrice;

          const hasFeaturedDiscount = originalPrice > unitPrice;
          const discountPercent = hasFeaturedDiscount ? Math.round((1 - unitPrice / originalPrice) * 100) : 0;
          const featuredDiscountAmount = hasFeaturedDiscount ? (originalPrice - unitPrice) * quantity : 0;
          const featuredDisplay = hasFeaturedDiscount
            ? `${discountPercent}% (${formatPriceSafe(featuredDiscountAmount)} ت)`
            : '—';

          const hasCouponDiscount = order?.discount_amount > 0;
          const couponCode = order?.discount_code || '';
          const couponDiscountType = order?.discount_type || '';
          const couponDiscountValue = order?.discount_value || 0;
          const couponValue = order?.discount_amount || 0;
          
          let couponDisplay = '—';
          if (hasCouponDiscount && couponCode) {
            const codeLine = `${couponCode}: کد تخفیف`;
            let discountDescription = '';
            if (couponDiscountType === 'percent') {
              const roundedPercent = Math.round(couponDiscountValue);
              discountDescription = `${roundedPercent}% (${formatPriceSafe(couponValue)} ت)`;
            } else if (couponDiscountType === 'fixed') {
              discountDescription = `${formatPriceSafe(couponDiscountValue)} ت`;
            } else {
              discountDescription = `${formatPriceSafe(couponValue)} ت`;
            }
            couponDisplay = `${codeLine}\n${discountDescription}`;
          }
          
          let finalUnitPrice = unitPrice;
          if (hasCouponDiscount && originalTotal > 0) {
            const itemShare = totalPrice / originalTotal;
            const discountPerItem = couponValue * itemShare;
            finalUnitPrice = unitPrice - (discountPerItem / quantity);
            finalUnitPrice = Math.round(finalUnitPrice);
          }

          // ✅ استفاده از تابع اصلاح‌شده
          const displayName = getFullProductNameForExcel(item, attributeTypes, allValues);

          const mainRow = ws.addRow(['', '', '', '', '', '']);
          ws.mergeCells(`A${mainRow.number}:A${mainRow.number}`);
          ws.mergeCells(`B${mainRow.number}:B${mainRow.number}`);
          ws.mergeCells(`C${mainRow.number}:C${mainRow.number}`);
          ws.mergeCells(`D${mainRow.number}:D${mainRow.number}`);
          ws.mergeCells(`E${mainRow.number}:F${mainRow.number}`);

          mainRow.getCell(1).value = quantity;

          let priceLines = [];
          priceLines.push(`اصلی: ${formatPriceSafe(originalPrice)} ت`);
          if (hasFeaturedDiscount || hasCouponDiscount) {
            priceLines.push(`با تخفیف: ${formatPriceSafe(finalUnitPrice)} ت`);
          }
          
          mainRow.getCell(2).value = priceLines.join('\n');
          mainRow.getCell(3).value = `${featuredDisplay}\n—`;
          mainRow.getCell(4).value = couponDisplay;
          mainRow.getCell(5).value = displayName;

          [1, 2, 3, 4, 5].forEach(col => {
            const cell = mainRow.getCell(col);
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
            cell.font = { size: 10, color: { argb: 'FF333333' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
          if (priceLines.length > 1) {
            const cell2 = mainRow.getCell(2);
            cell2.font = { bold: true, size: 10, color: { argb: 'FF800E2F' } };
          }
        });
      } else {
        const emptyRow = ws.addRow(['', '', '', '', '', '']);
        ws.mergeCells(`E${emptyRow.number}:F${emptyRow.number}`);
        emptyRow.getCell(5).value = 'بدون کالا';
        emptyRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
        emptyRow.getCell(5).font = { size: 10, color: { argb: 'FF999999' } };
        emptyRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        emptyRow.getCell(5).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        [1, 2, 3, 4].forEach(col => {
          emptyRow.getCell(col).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }

      const addressRow = ws.addRow([fullAddress]);
      ws.mergeCells(`A${addressRow.number}:F${addressRow.number}`);
      addressRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      addressRow.getCell(1).font = { size: 10, color: { argb: 'FF555555' } };
      addressRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
      addressRow.getCell(1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      if (index < orders.length - 1) ws.addRow([]);
    });
  } else {
    const row = ws.addRow(['', '', 'هیچ سفارشی یافت نشد', '', '', '']);
    ws.mergeCells(`C${row.number}:F${row.number}`);
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  }

  return workbook;
};

// ============================================================
// تولید شیت گزارش کامل
// ============================================================
export const generateFullExcel = async (summary, orders, topProducts, filters, startDateStr, endDateStr, attributeTypes = [], allValues = {}) => {
  const wb = new ExcelJS.Workbook();
  while (wb.worksheets.length) wb.removeWorksheet(1);

  // شیت ۱: خلاصه آمار
  const ws1 = wb.addWorksheet('خلاصه آمار');
  ws1.views = [{ rightToLeft: false }];
  ws1.columns = [
    { header: 'شاخص', key: 'index', width: 50 },
    { header: 'مقدار (ت)', key: 'value', width: 50 },
  ];
  const categoryLabel1 = filters?.categoryName === 'همه' ? 'همه محصولات' : `محصولات ${filters?.categoryName || 'همه'}`;
  const t1 = ws1.addRow([`گزارش کامل فروش - خلاصه آمار (${categoryLabel1})`]);
  ws1.mergeCells(`A${t1.number}:B${t1.number}`);
  t1.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF800E2F' } };
  t1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  ws1.addRow([]);
  const filterText1 = `تاریخ شروع: ${startDateStr}  |  تاریخ پایان: ${endDateStr}  |  وضعیت سفارش: ${filters?.status || 'همه'}`;
  const filterRow1 = ws1.addRow([filterText1]);
  ws1.mergeCells(`A${filterRow1.number}:B${filterRow1.number}`);
  filterRow1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
  filterRow1.getCell(1).font = { size: 12, bold: false, color: { argb: 'FF333333' } };
  filterRow1.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  ws1.addRow([]);
  const s1 = ws1.addRow(['خلاصه آمار']);
  ws1.mergeCells(`A${s1.number}:B${s1.number}`);
  s1.getCell(1).font = { bold: true, size: 13 };
  s1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  const h1 = ws1.addRow(['شاخص', 'مقدار (ت)']);
  styleTableHeader(h1);
  [
    ['تعداد سفارشات', summary?.totalOrders || 0],
    ['جمع فروش', summary?.totalSales || 0],
    ['میانگین هر سفارش', summary?.averageOrderValue || 0],
    ['تعداد مشتریان', summary?.totalCustomers || 0],
    ['تعداد محصولات فروخته شده', summary?.totalItems || 0],
  ].forEach((row, idx) => {
    const r = ws1.addRow(row);
    r.getCell(1).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
    r.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
    if (idx > 0) r.getCell(2).numFmt = '#,##0';
    r.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // شیت ۲: محصولات پرفروش
  const ws2 = wb.addWorksheet('محصولات پرفروش');
  ws2.views = [{ rightToLeft: false }];
  ws2.columns = [
    { header: 'ردیف', key: 'row', width: 10 },
    { header: 'نام محصول', key: 'name', width: 50 },
    { header: 'تعداد فروش', key: 'qty', width: 25 },
    { header: 'درآمد (ت)', key: 'revenue', width: 30 },
  ];
  const categoryLabel2 = filters?.categoryName === 'همه' ? 'همه محصولات' : `محصولات ${filters?.categoryName || 'همه'}`;
  const t2 = ws2.addRow([`گزارش کامل فروش - محصولات پرفروش (${categoryLabel2})`]);
  ws2.mergeCells(`A${t2.number}:D${t2.number}`);
  t2.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF800E2F' } };
  t2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  ws2.addRow([]);
  const filterText2 = `تاریخ شروع: ${startDateStr}  |  تاریخ پایان: ${endDateStr}  |  وضعیت سفارش: ${filters?.status || 'همه'}`;
  const filterRow2 = ws2.addRow([filterText2]);
  ws2.mergeCells(`A${filterRow2.number}:D${filterRow2.number}`);
  filterRow2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
  filterRow2.getCell(1).font = { size: 12, bold: false, color: { argb: 'FF333333' } };
  filterRow2.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  ws2.addRow([]);
  const h2 = ws2.addRow(['ردیف', 'نام محصول', 'تعداد فروش', 'درآمد (ت)']);
  styleTableHeader(h2);
  if (topProducts?.length) {
    topProducts.forEach((item, index) => {
      const row = ws2.addRow([index + 1, item?.name || 'نامشخص', item?.totalQuantity || 0, item?.totalRevenue || 0]);
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (cell.col === 3 || cell.col === 4) cell.numFmt = '#,##0';
      });
    });
  } else {
    const row = ws2.addRow(['', 'محصولی یافت نشد', '', '']);
    ws2.mergeCells(`B${row.number}:D${row.number}`);
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  }

  // شیت ۳: لیست سفارشات
  const ws3 = wb.addWorksheet('لیست سفارشات');
  ws3.views = [{ rightToLeft: false }];
  ws3.columns = [
    { header: 'شناسه کاربر', key: 'user_id', width: 15 },
    { header: 'کد پیگیری', key: 'tracking', width: 30 },
    { header: 'کاربر', key: 'user', width: 28 },
    { header: 'مبلغ (ت)', key: 'total', width: 25 },
    { header: 'وضعیت', key: 'status', width: 20 },
    { header: 'تاریخ و ساعت', key: 'datetime', width: 32 },
  ];
  const categoryLabel3 = filters?.categoryName === 'همه' ? 'همه محصولات' : `محصولات ${filters?.categoryName || 'همه'}`;
  const t3 = ws3.addRow([`گزارش کامل فروش - لیست سفارشات (${categoryLabel3})`]);
  ws3.mergeCells(`A${t3.number}:F${t3.number}`);
  t3.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF800E2F' } };
  t3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  ws3.addRow([]);
  const filterRow3 = ws3.addRow([
    filters?.status || 'همه',
    'وضعیت سفارش:',
    endDateStr,
    'تاریخ پایان:',
    startDateStr,
    'تاریخ شروع:',
  ]);
  filterRow3.eachCell((cell) => {
    cell.font = { size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    if (cell.col % 2 === 0) {
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
    }
  });
  ws3.getRow(filterRow3.number).height = 30;
  ws3.addRow([]);

  if (orders?.length) {
    orders.forEach((order, index) => {
      const items = order?.items || [];
      
      const originalTotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      
      const dateTimeStr = order?.created_at ? formatJalaliDateTime(new Date(order.created_at)) : '-';
      const addressParts = [];
      if (order?.address) addressParts.push(`آدرس: ${order.address}`);
      if (order?.phone) addressParts.push(`تلفن: ${order.phone}`);
      if (order?.receiver_name) addressParts.push(`گیرنده: ${order.receiver_name}`);
      const fullAddress = addressParts.length ? addressParts.join(' | ') : 'آدرسی ثبت نشده است';

      const headerRow = ws3.addRow(['شناسه کاربر', 'کد پیگیری', 'کاربر', 'مبلغ (ت)', 'وضعیت', 'تاریخ و ساعت']);
      styleTableHeader(headerRow);

      const orderRow = ws3.addRow([
        order?.user_id || '',
        order?.tracking_code || '---',
        order?.user_name || 'کاربر',
        order?.total_price || 0,
        order?.status || 'نامشخص',
        dateTimeStr,
      ]);
      orderRow.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (colNumber === 4) cell.numFmt = '#,##0';
      });

      const itemsHeaderRow = ws3.addRow(['', '', '', '', '', '']);
      ws3.mergeCells(`A${itemsHeaderRow.number}:A${itemsHeaderRow.number}`);
      ws3.mergeCells(`B${itemsHeaderRow.number}:B${itemsHeaderRow.number}`);
      ws3.mergeCells(`C${itemsHeaderRow.number}:C${itemsHeaderRow.number}`);
      ws3.mergeCells(`D${itemsHeaderRow.number}:D${itemsHeaderRow.number}`);
      ws3.mergeCells(`E${itemsHeaderRow.number}:F${itemsHeaderRow.number}`);
      itemsHeaderRow.getCell(1).value = 'تعداد';
      itemsHeaderRow.getCell(2).value = 'مبلغ (ت)';
      itemsHeaderRow.getCell(3).value = 'تخفیف ویژه';
      itemsHeaderRow.getCell(4).value = 'تخفیف با کد';
      itemsHeaderRow.getCell(5).value = 'محصول';
      [1, 2, 3, 4, 5].forEach(col => {
        const cell = itemsHeaderRow.getCell(col);
        cell.font = { bold: true, size: 11, color: { argb: 'FF333333' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      if (items.length) {
        items.forEach((item) => {
          const quantity = item?.quantity || 1;
          const unitPrice = item?.price || 0;
          const originalPrice = item?.original_price || unitPrice;
          const totalPrice = quantity * unitPrice;

          const hasFeaturedDiscount = originalPrice > unitPrice;
          const discountPercent = hasFeaturedDiscount ? Math.round((1 - unitPrice / originalPrice) * 100) : 0;
          const featuredDiscountAmount = hasFeaturedDiscount ? (originalPrice - unitPrice) * quantity : 0;
          const featuredDisplay = hasFeaturedDiscount
            ? `${discountPercent}% (${formatPriceSafe(featuredDiscountAmount)} ت)`
            : '—';

          const hasCouponDiscount = order?.discount_amount > 0;
          const couponCode = order?.discount_code || '';
          const couponDiscountType = order?.discount_type || '';
          const couponDiscountValue = order?.discount_value || 0;
          const couponValue = order?.discount_amount || 0;
          
          let couponDisplay = '—';
          if (hasCouponDiscount && couponCode) {
            const codeLine = `${couponCode}: کد تخفیف`;
            let discountDescription = '';
            if (couponDiscountType === 'percent') {
              const roundedPercent = Math.round(couponDiscountValue);
              discountDescription = `${roundedPercent}% (${formatPriceSafe(couponValue)} ت)`;
            } else if (couponDiscountType === 'fixed') {
              discountDescription = `${formatPriceSafe(couponDiscountValue)} ت`;
            } else {
              discountDescription = `${formatPriceSafe(couponValue)} ت`;
            }
            couponDisplay = `${codeLine}\n${discountDescription}`;
          }
          
          let finalUnitPrice = unitPrice;
          if (hasCouponDiscount && originalTotal > 0) {
            const itemShare = totalPrice / originalTotal;
            const discountPerItem = couponValue * itemShare;
            finalUnitPrice = unitPrice - (discountPerItem / quantity);
            finalUnitPrice = Math.round(finalUnitPrice);
          }

          // ✅ استفاده از تابع اصلاح‌شده
          const displayName = getFullProductNameForExcel(item, attributeTypes, allValues);

          const mainRow = ws3.addRow(['', '', '', '', '', '']);
          ws3.mergeCells(`A${mainRow.number}:A${mainRow.number}`);
          ws3.mergeCells(`B${mainRow.number}:B${mainRow.number}`);
          ws3.mergeCells(`C${mainRow.number}:C${mainRow.number}`);
          ws3.mergeCells(`D${mainRow.number}:D${mainRow.number}`);
          ws3.mergeCells(`E${mainRow.number}:F${mainRow.number}`);

          mainRow.getCell(1).value = quantity;

          let priceLines = [];
          priceLines.push(`اصلی: ${formatPriceSafe(originalPrice)} ت`);
          if (hasFeaturedDiscount || hasCouponDiscount) {
            priceLines.push(`با تخفیف: ${formatPriceSafe(finalUnitPrice)} ت`);
          }
          
          mainRow.getCell(2).value = priceLines.join('\n');
          mainRow.getCell(3).value = `${featuredDisplay}\n—`;
          mainRow.getCell(4).value = couponDisplay;
          mainRow.getCell(5).value = displayName;

          [1, 2, 3, 4, 5].forEach(col => {
            const cell = mainRow.getCell(col);
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
            cell.font = { size: 10, color: { argb: 'FF333333' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
          });
          if (priceLines.length > 1) {
            const cell2 = mainRow.getCell(2);
            cell2.font = { bold: true, size: 10, color: { argb: 'FF800E2F' } };
          }
        });
      } else {
        const emptyRow = ws3.addRow(['', '', '', '', '', '']);
        ws3.mergeCells(`E${emptyRow.number}:F${emptyRow.number}`);
        emptyRow.getCell(5).value = 'بدون کالا';
        emptyRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
        emptyRow.getCell(5).font = { size: 10, color: { argb: 'FF999999' } };
        emptyRow.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
        emptyRow.getCell(5).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        [1, 2, 3, 4].forEach(col => {
          emptyRow.getCell(col).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }

      const addressRow = ws3.addRow([fullAddress]);
      ws3.mergeCells(`A${addressRow.number}:F${addressRow.number}`);
      addressRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      addressRow.getCell(1).font = { size: 10, color: { argb: 'FF555555' } };
      addressRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
      addressRow.getCell(1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      if (index < orders.length - 1) ws3.addRow([]);
    });
  } else {
    const row = ws3.addRow(['', '', 'هیچ سفارشی یافت نشد', '', '', '']);
    ws3.mergeCells(`C${row.number}:F${row.number}`);
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
  }

  return wb;
};