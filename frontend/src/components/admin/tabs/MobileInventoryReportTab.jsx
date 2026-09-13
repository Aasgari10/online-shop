// src/components/admin/tabs/MobileInventoryReportTab.jsx
import { useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import ExcelJS from 'exceljs';

function MobileInventoryReportTab({ categories }) {
  const [categoryId, setCategoryId] = useState('همه');
  const [stockFilter, setStockFilter] = useState('همه');
  const [customStock, setCustomStock] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProductsWithVariations = async (catId) => {
    try {
      const params = new URLSearchParams({ limit: 1000, page: 1 });
      if (catId && catId !== 'همه') params.append('category', catId);
      const res = await api.get(`/products?${params.toString()}`);
      if (!res.data.success) throw new Error('خطا در دریافت محصولات');
      const products = res.data.data || [];
      const withVariations = await Promise.all(
        products.map(async (p) => {
          try {
            const varRes = await api.get(`/products/${p.id}/variations`);
            return { ...p, variations: varRes.data.success ? varRes.data.data : [] };
          } catch { return { ...p, variations: [] }; }
        })
      );
      return withVariations;
    } catch (error) {
      throw error;
    }
  };

  // ============================================================
  // ✅ تابع اصلاح‌شده دانلود اکسل موجودی
  // ============================================================
  const downloadInventoryExcel = async () => {
    setLoading(true);
    try {
      const catId = categoryId === 'همه' ? 'همه' : parseInt(categoryId);
      const categoryName = catId === 'همه' ? 'همه' : categories.find(c => c.id === catId)?.name || 'همه';
      const products = await fetchProductsWithVariations(catId);
      
      // ساخت Excel با شیت‌ها
      const workbook = new ExcelJS.Workbook();

      // ✅ تابع کمکی برای ساخت هر شیت (با پارامتر variationFilter)
      const buildSheet = (ws, title, inputProducts, showStockFilter = false, variationFilter = null) => {
        ws.views = [{ rightToLeft: false }];

        ws.columns = [
          { header: 'نام محصول', key: 'name', width: 50 },
          { header: 'موجودی', key: 'stock', width: 15 },
          { header: 'قیمت (تومان)', key: 'price', width: 25 },
        ];

        // عنوان
        const filterLabel = showStockFilter ? ` (موجودی ${stockFilter})` : '';
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

        // هدر جدول
        const headerRow = ws.addRow(['نام محصول', 'موجودی', 'قیمت (تومان)']);
        headerRow.eachCell((cell) => {
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

        let totalStock = 0;
        let totalProducts = 0;

        inputProducts.forEach((product) => {
          const variations = product.variations || [];

          if (variations.length > 0) {
            // ✅✅✅ فیلتر کردن ترکیبات بر اساس نوع شیت
            const variationsToShow = variationFilter
              ? variations.filter(variationFilter)
              : variations;

            variationsToShow.forEach((variation) => {
              const stock = variation.stock || 0;
              const price = Number(variation.price || product.price || 0);

              totalStock += stock;
              totalProducts++;

              const row = ws.addRow([
                product.name,
                stock,
                price,
              ]);

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
            });
          } else {
            // ✅ محصول بدون ترکیب
            const stock = product.stock || 0;
            const price = Number(product.price || 0);

            // اعمال فیلتر
            if (variationFilter) {
              const fakeVariation = { stock };
              if (!variationFilter(fakeVariation)) return;
            }

            totalStock += stock;
            totalProducts++;

            const row = ws.addRow([
              product.name,
              stock,
              price,
            ]);

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
          }
        });

        // ردیف جمع کل
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

      // ===== شیت ۱: کالاهای تمام شده (فقط stock === 0) =====
      const ws1 = workbook.addWorksheet('کالاهای تمام شده');
      buildSheet(ws1, 'کالاهای تمام شده', products, false, (v) => (v.stock || 0) === 0);

      // ===== شیت ۲: کل کالاها (همه ترکیبات) =====
      const ws2 = workbook.addWorksheet('کل کالاها');
      buildSheet(ws2, 'کل کالاها', products, false, null);

      // ===== شیت ۳: کالاهای موجود (فقط stock > 0) =====
      const ws3 = workbook.addWorksheet('کالاهای موجود');
      buildSheet(ws3, 'کالاهای موجود', products, false, (v) => (v.stock || 0) > 0);

      // ===== شیت ۴: موجودی کمتر از X (فقط 0 < stock <= X) =====
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

      // دانلود فایل
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `گزارش_موجودی_${categoryName}_${formatJalaliDate(new Date()).replace(/\//g, '-')}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('گزارش موجودی دانلود شد');
    } catch (error) {
      console.error('❌ خطا در تولید گزارش موجودی:', error);
      toast.error('خطا در تولید گزارش موجودی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-4">
      <h4 className="font-bold text-gray-800">📦 گزارش موجودی</h4>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
        >
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">فیلتر موجودی</label>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
        >
          <option value="همه">همه</option>
          <option value="0">تمام شده (۰)</option>
          <option value="5">کمتر از ۵</option>
          <option value="10">کمتر از ۱۰</option>
          <option value="20">کمتر از ۲۰</option>
          <option value="30">کمتر از ۳۰</option>
          <option value="50">کمتر از ۵۰</option>
          <option value="100">کمتر از ۱۰۰</option>
          <option value="custom">مقدار دلخواه</option>
        </select>
        {stockFilter === 'custom' && (
          <input
            type="number"
            min="0"
            value={customStock}
            onChange={(e) => setCustomStock(e.target.value)}
            placeholder="عدد دلخواه"
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
          />
        )}
      </div>
      <button
        onClick={downloadInventoryExcel}
        disabled={loading}
        className="w-full py-2.5 bg-[#800E2F] text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? <Spinner size="sm" /> : '📥 دانلود گزارش موجودی (Excel)'}
      </button>
    </div>
  );
}

export default MobileInventoryReportTab;