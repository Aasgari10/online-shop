// src/components/admin/tabs/MobileSalesReportContent.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import { formatPrice } from '../../../utils/formatPrice';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import api from '../../../services/api';
import {
  downloadExcelWorkbook,
  generateSummaryExcel,
  generateTopProductsExcel,
  generateOrdersExcel,
  generateFullExcel,
  formatPriceSafe,
  toPersianNumberSafe,
} from '../../../utils/reportExcelUtils';

// ============================================================
// ✅ تابع اصلاح‌شده: نام کامل محصول با فیلتر کلیدهای سیستمی
// ============================================================
const getFullProductName = (item) => {
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
      if (key === '1') continue;
      if (key.startsWith('_')) continue;  // ✅ skip کلیدهای سیستمی
      if (value === null || value === undefined || value === '') continue;
      attrs.push(`${key}: ${value}`);
    }
  }
  
  const productName = item.product_name || item.name || 'محصول';
  if (attrs.length === 0) return productName;
  return `${productName} (${attrs.join(' - ')})`;
};

// ============================================================
// ✅ تابع تبدیل تاریخ به فرمت مورد انتظار بک‌اند
// ============================================================
const formatDateForAPI = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// ✅ استایل مشترک برای دراپ‌داون‌ها (arrow در سمت چپ با فاصله)
const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundPosition: 'left 0.75rem center',
  backgroundSize: '1.25rem',
  backgroundRepeat: 'no-repeat',
  paddingLeft: '2.5rem',
  paddingRight: '0.75rem',
};

function MobileSalesReportContent({ categories = [] }) {
  const today = new Date();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [filters, setFilters] = useState({ status: 'پرداخت شده', categoryId: 'همه' });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('تاریخ شروع و پایان را انتخاب کنید');
      return;
    }

    const startStr = formatDateForAPI(startDate);
    const endStr = formatDateForAPI(endDate);

    if (!startStr || !endStr) {
      toast.error('خطا در تبدیل تاریخ');
      return;
    }

    setLoading(true);
    try {
      const params = { startDate: startStr, endDate: endStr };
      if (filters.status && filters.status !== 'همه') {
        params.status = filters.status;
      }
      if (filters.categoryId && filters.categoryId !== 'همه') {
        params.categoryId = parseInt(filters.categoryId);
      }

      const res = await api.get('/admin/reports/sales', { params });
      if (res.data.success) {
        setReportData(res.data.data);
        toast.success('گزارش تولید شد');
      }
    } catch (error) {
      console.error('❌ [MobileSalesReportContent] خطا:', error);
      toast.error(error.response?.data?.message || 'خطا در دریافت گزارش');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async (type) => {
    if (!reportData) {
      toast.error('ابتدا گزارش را تولید کنید');
      return;
    }
    try {
      const { summary, orders, topProducts, attributeTypes, attributeValues } = reportData;
      const startDateStr = startDate ? formatJalaliDate(startDate) : '-';
      const endDateStr = endDate ? formatJalaliDate(endDate) : '-';
      const categoryName = filters.categoryId === 'همه' 
        ? 'همه' 
        : categories.find(c => c.id === parseInt(filters.categoryId))?.name || 'همه';

      let workbook, fileName;
      switch (type) {
        case 'summary':
          workbook = await generateSummaryExcel(summary, { status: filters.status, categoryName }, startDateStr, endDateStr);
          fileName = 'خلاصه_آمار.xlsx';
          break;
        case 'topProducts':
          workbook = await generateTopProductsExcel(topProducts, { status: filters.status, categoryName }, startDateStr, endDateStr);
          fileName = 'محصولات_پرفروش.xlsx';
          break;
        case 'orders':
          workbook = await generateOrdersExcel(orders, { status: filters.status, categoryName }, startDateStr, endDateStr, attributeTypes, attributeValues);
          fileName = 'لیست_سفارشات.xlsx';
          break;
        case 'full':
          workbook = await generateFullExcel(summary, orders, topProducts, { status: filters.status, categoryName }, startDateStr, endDateStr, attributeTypes, attributeValues);
          fileName = 'گزارش_کامل.xlsx';
          break;
        default:
          toast.error('نوع گزارش نامعتبر');
          return;
      }
      await downloadExcelWorkbook(workbook, fileName);
      toast.success('دانلود شد');
    } catch (error) {
      console.error('❌ خطا در تولید Excel:', error);
      toast.error('خطا در تولید Excel');
    }
  };

  return (
    <div className="space-y-4">
      {/* ===== فرم تنظیمات ===== */}
      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ شروع:</label>
            <SimplePersianDatePicker value={startDate} onChange={setStartDate} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ پایان:</label>
            <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white appearance-none"
              style={selectStyle}
            >
              <option value="همه">همه</option>
              <option value="پرداخت شده">پرداخت شده</option>
              <option value="ارسال شده">ارسال شده</option>
              <option value="تحویل داده شده">تحویل داده شده</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({...filters, categoryId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white appearance-none"
              style={selectStyle}
            >
              {categories && categories.length > 0 ? (
                categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)
              ) : (
                <option value="همه">همه</option>
              )}
            </select>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full py-2.5 bg-[#800E2F] text-white rounded-lg font-medium disabled:opacity-50 transition"
          >
            {loading ? <Spinner size="sm" /> : '🔍 تولید گزارش'}
          </button>
        </div>
      </div>

      {/* ===== بخش دانلود و نمایش داده‌ها ===== */}
      {reportData && (
        <>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-2">📥 دانلود</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleDownloadExcel('summary')} className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-xs font-medium">خلاصه</button>
              <button onClick={() => handleDownloadExcel('topProducts')} className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-xs font-medium">پرفروش‌ها</button>
              <button onClick={() => handleDownloadExcel('orders')} className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-xs font-medium">سفارشات</button>
              <button onClick={() => handleDownloadExcel('full')} className="px-3 py-1.5 bg-[#1a7a3a] text-white rounded-lg text-xs font-medium">کامل</button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-2">📈 خلاصه</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">تعداد سفارشات</p>
                <p className="text-lg font-bold text-[#800E2F]">{toPersianNumberSafe(reportData.summary.totalOrders)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">جمع فروش</p>
                <p className="text-lg font-bold text-[#800E2F]">{formatPriceSafe(reportData.summary.totalSales)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">میانگین هر سفارش</p>
                <p className="text-lg font-bold text-[#800E2F]">{formatPriceSafe(reportData.summary.averageOrderValue)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-500">تعداد مشتریان</p>
                <p className="text-lg font-bold text-[#800E2F]">{toPersianNumberSafe(reportData.summary.totalCustomers)}</p>
              </div>
            </div>
          </div>

          {reportData.orders && reportData.orders.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-2">📋 لیست سفارشات</h4>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {reportData.orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800 text-sm">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.status === 'تحویل داده شده' ? 'bg-green-100 text-green-700' : order.status === 'ارسال شده' ? 'bg-blue-100 text-blue-700' : order.status === 'پرداخت شده' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {order.created_at ? formatJalaliDate(new Date(order.created_at)) : '-'}
                      {order.tracking_code && <span className="mr-2">| کد: {order.tracking_code}</span>}
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div className="space-y-2">
                        {order.items.map((item, idx) => {
                          const fullName = getFullProductName(item);
                          return (
                            <div key={idx} className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-800 flex-1 ml-2">{fullName}</span>
                                <span className="text-xs font-bold text-[#800E2F]">{formatPrice(item.quantity * item.price)} ت</span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                                <span>تعداد: {item.quantity}</span>
                                <span>قیمت واحد: {formatPrice(item.price)} ت</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500">جمع کل:</span>
                      <span className="text-sm font-bold text-[#800E2F]">{formatPrice(order.total_price)} ت</span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="text-xs text-green-600 mt-1">تخفیف کد: -{formatPrice(order.discount_amount)} ت</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MobileSalesReportContent;