// src/components/admin/tabs/InventoryReportTab.jsx
import { useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import { formatPricePersian } from '../../../utils/formatPrice';
import ExcelJS from 'exceljs';

// ============================================================
// ابزارهای کمکی
// ============================================================
const downloadExcelWorkbook = async (workbook, fileName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const styleTableHeader = (row) => {
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
// ✅ تابع اصلاح‌شده: نام کامل محصول با فیلتر کلیدهای سیستمی
// ============================================================
const getFullProductName = (productName, variation) => {
  const attrs = [];
  
  // ۱. رنگ از color_name (استاندارد)
  if (variation.color_name) {
    attrs.push(`رنگ: ${variation.color_name}`);
  }
  
  // ۲. ویژگی‌های دیگر از JSON
  let attrValues = null;
  if (variation.attribute_values_json) {
    try {
      attrValues = typeof variation.attribute_values_json === 'string'
        ? JSON.parse(variation.attribute_values_json)
        : variation.attribute_values_json;
    } catch (e) {
      attrValues = null;
    }
  }
  
  // ۳. اگر color_name نداشت، رنگ رو از JSON بگیر
  if (!variation.color_name && attrValues && attrValues['1']) {
    attrs.push(`رنگ: ${attrValues['1']}`);
  }
  
  // ۴. سایز
  if (variation.size_name) {
    attrs.push(`سایز: ${variation.size_name}`);
  }
  
  // ۵. سایر ویژگی‌ها (فقط کلیدهای معتبر)
  if (attrValues && typeof attrValues === 'object') {
    for (const [key, value] of Object.entries(attrValues)) {
      // ✅ پاک کردن کلید "1" (رنگ - قبلاً اضافه شد)
      if (key === '1') continue;
      // ✅ پاک کردن کلیدهای سیستمی (_color_code, _something, ...)
      if (key.startsWith('_')) continue;
      // ✅ پاک کردن مقادیر خالی
      if (value === null || value === undefined || value === '') continue;
      
      attrs.push(`${key}: ${value}`);
    }
  }
  
  if (attrs.length === 0) return productName;
  return `${productName} (${attrs.join(' - ')})`;
};

// ============================================================
// ✅ تولید فایل Excel گزارش موجودی (اصلاح‌شده)
// ============================================================
const generateInventoryExcel = async (products, categoryName, stockFilter) => {
  const workbook = new ExcelJS.Workbook();

  const buildSheet = (ws, title, inputProducts, showStockFilter = false, variationFilter = null) => {
    ws.views = [{ rightToLeft: false }];

    ws.columns = [
      { header: 'نام محصول', key: 'name', width: 50 },
      { header: 'موجودی', key: 'stock', width: 15 },
      { header: 'قیمت (تومان)', key: 'price', width: 25 },
    ];

    const filterLabel = showStockFilter ? ` (موجودی کمتر از ${stockFilter})` : '';
    const titleRow = ws.addRow([`${title}${filterLabel} - ${categoryName === 'همه' ? 'همه محصولات' : `محصولات ${categoryName}`}`]);
    ws.mergeCells(`A${titleRow.number}:C${titleRow.number}`);
    titleRow.getCell(1).font = { size: 18, bold: true, color: { argb: 'FF800E2F' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
    ws.addRow([]);

    const dateRow = ws.addRow([`تاریخ تولید: ${formatJalaliDate(new Date())}`]);
    ws.mergeCells(`A${dateRow.number}:C${dateRow.number}`);
    dateRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle', wrapText: false, readingOrder: 'ltr' };
    dateRow.getCell(1).font = { size: 10, color: { argb: 'FF666666' } };
    ws.addRow([]);

    const headerRow = ws.addRow(['نام محصول', 'موجودی', 'قیمت (تومان)']);
    styleTableHeader(headerRow);

    let totalStock = 0;
    let totalProducts = 0;

    inputProducts.forEach((product) => {
      const variations = product.variations || [];

      if (variations.length > 0) {
        const variationsToShow = variationFilter
          ? variations.filter(variationFilter)
          : variations;

        variationsToShow.forEach((variation) => {
          const stock = variation.stock || 0;
          const price = Number(variation.price || product.price || 0);

          totalStock += stock;
          totalProducts++;

          const fullName = getFullProductName(product.name, variation);

          const row = ws.addRow([fullName, stock, price]);

          row.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            if (colNumber === 3) cell.numFmt = '#,##0';
          });
          row.getCell(3).font = { bold: true, color: { argb: 'FF800E2F' } };
        });
      } else {
        const stock = product.stock || 0;
        const price = Number(product.price || 0);

        if (variationFilter) {
          const fakeVariation = { stock };
          if (!variationFilter(fakeVariation)) return;
        }

        totalStock += stock;
        totalProducts++;

        const row = ws.addRow([product.name, stock, price]);

        row.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          if (colNumber === 3) cell.numFmt = '#,##0';
        });
        row.getCell(3).font = { bold: true, color: { argb: 'FF800E2F' } };
      }
    });

    if (totalProducts > 0) {
      const totalRow = ws.addRow(['جمع کل', totalStock, '']);
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0E8' } };
        if (colNumber === 3) cell.numFmt = '#,##0';
      });
      ws.mergeCells(`A${totalRow.number}:A${totalRow.number}`);
      totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
    } else {
      const emptyRow = ws.addRow(['هیچ محصولی یافت نشد', '', '']);
      ws.mergeCells(`A${emptyRow.number}:C${emptyRow.number}`);
      emptyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'ltr' };
      emptyRow.getCell(1).font = { color: { argb: 'FF999999' } };
    }
  };

  // شیت ۱: کالاهای تمام شده
  const ws1 = workbook.addWorksheet('کالاهای تمام شده');
  buildSheet(ws1, 'کالاهای تمام شده', products, false, (v) => (v.stock || 0) === 0);

  // شیت ۲: کل کالاها
  const ws2 = workbook.addWorksheet('کل کالاها');
  buildSheet(ws2, 'کل کالاها', products, false, null);

  // شیت ۳: کالاهای موجود
  const ws3 = workbook.addWorksheet('کالاهای موجود');
  buildSheet(ws3, 'کالاهای موجود', products, false, (v) => (v.stock || 0) > 0);

  // شیت ۴: موجودی کمتر از X
  if (stockFilter !== 'همه') {
    const filterValue = parseInt(stockFilter);
    if (!isNaN(filterValue)) {
      const ws4 = workbook.addWorksheet(`موجودی کمتر از ${filterValue}`);
      buildSheet(ws4, `موجودی کمتر از ${filterValue}`, products, true, (v) => {
        const s = v.stock || 0;
        return s > 0 && s <= filterValue;
      });
    }
  }

  return workbook;
};

// ============================================================
// دریافت محصولات با ترکیبات
// ============================================================
const fetchProductsWithVariations = async (categoryId) => {
  try {
    const params = new URLSearchParams({ limit: 1000, page: 1 });
    if (categoryId && categoryId !== 'همه') {
      params.append('category', categoryId);
    }
    const productsRes = await api.get(`/products?${params.toString()}`);
    if (!productsRes.data.success) {
      throw new Error('خطا در دریافت محصولات');
    }

    const products = productsRes.data.data || [];

    const productsWithVariations = await Promise.all(
      products.map(async (product) => {
        try {
          const variationsRes = await api.get(`/products/${product.id}/variations`);
          const variations = variationsRes.data.success ? variationsRes.data.data : [];
          return {
            ...product,
            variations,
          };
        } catch (error) {
          console.warn(`⚠️ خطا در دریافت ترکیبات محصول ${product.id}:`, error);
          return {
            ...product,
            variations: [],
          };
        }
      })
    );

    return productsWithVariations;
  } catch (error) {
    console.error('❌ [InventoryReport] خطا:', error);
    throw error;
  }
};

// ============================================================
// کامپوننت گزارش موجودی
// ============================================================
function InventoryReportTab({ categories }) {
  const [inventoryCategoryId, setInventoryCategoryId] = useState('همه');
  const [stockFilter, setStockFilter] = useState('همه');
  const [customStockValue, setCustomStockValue] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const stockFilterOptions = [
    { value: 'همه', label: 'همه' },
    { value: '0', label: 'تمام شده (۰)' },
    { value: '5', label: 'کمتر از ۵' },
    { value: '10', label: 'کمتر از ۱۰' },
    { value: '20', label: 'کمتر از ۲۰' },
    { value: '30', label: 'کمتر از ۳۰' },
    { value: '50', label: 'کمتر از ۵۰' },
    { value: '100', label: 'کمتر از ۱۰۰' },
    { value: 'custom', label: 'مقدار دلخواه' },
  ];

  const handleStockFilterChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setStockFilter('custom');
      setCustomStockValue('');
    } else {
      setStockFilter(value);
      setCustomStockValue('');
    }
  };

  const handleCustomStockChange = (e) => {
    const value = e.target.value;
    setCustomStockValue(value);
    if (value && !isNaN(value) && parseInt(value) >= 0) {
      setStockFilter(value);
    } else {
      setStockFilter('همه');
    }
  };

  const handleDownloadInventory = async () => {
    setInventoryLoading(true);
    try {
      const categoryId = inventoryCategoryId === 'همه' ? 'همه' : parseInt(inventoryCategoryId);
      const categoryName = categoryId === 'همه' ? 'همه' : categories.find(c => c.id === categoryId)?.name || 'همه';

      let finalFilter = stockFilter;
      if (stockFilter === 'custom') {
        finalFilter = customStockValue && !isNaN(customStockValue) && parseInt(customStockValue) >= 0 
          ? customStockValue 
          : 'همه';
      }

      const products = await fetchProductsWithVariations(categoryId);
      const workbook = await generateInventoryExcel(products, categoryName, finalFilter);
      const fileName = `گزارش_موجودی_${categoryName}_${formatJalaliDate(new Date()).replace(/\//g, '-')}.xlsx`;
      await downloadExcelWorkbook(workbook, fileName);
      toast.success('گزارش موجودی با موفقیت دانلود شد');
    } catch (error) {
      console.error('❌ خطا در تولید گزارش موجودی:', error);
      toast.error('خطا در تولید گزارش موجودی');
    } finally {
      setInventoryLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h4 className="font-bold text-gray-800 mb-4">📦 گزارش موجودی محصولات</h4>
        <p className="text-sm text-gray-500 mb-4">
          این گزارش شامل سه بخش جداگانه است:
        </p>
        <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
          <li>📄 <span className="font-medium">کالاهای تمام شده</span> - محصولاتی که موجودی آنها صفر است</li>
          <li>📄 <span className="font-medium">کل کالاها</span> - همه محصولات به همراه ترکیبات</li>
          <li>📄 <span className="font-medium">کالاهای موجود</span> - محصولاتی که موجودی دارند</li>
          <li>📄 <span className="font-medium">فیلتر موجودی</span> - کالاهایی که موجودی آنها کمتر از مقدار انتخاب‌شده است</li>
        </ul>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
            <select
              value={inventoryCategoryId}
              onChange={(e) => setInventoryCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">فیلتر موجودی</label>
            <select
              value={stockFilter === 'custom' ? 'custom' : stockFilter}
              onChange={handleStockFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
            >
              {stockFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {stockFilter === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مقدار دلخواه</label>
              <input
                type="number"
                min="0"
                value={customStockValue}
                onChange={handleCustomStockChange}
                placeholder="مثلاً ۱۵"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
              />
              <p className="text-xs text-gray-400 mt-1">اعداد صحیح مثبت وارد کنید</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDownloadInventory}
            disabled={inventoryLoading}
            className="px-6 py-2.5 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {inventoryLoading ? (
              <>
                <Spinner size="sm" className="inline-block mr-2" />
                در حال تولید...
              </>
            ) : (
              '📥 دانلود گزارش موجودی (Excel)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryReportTab;