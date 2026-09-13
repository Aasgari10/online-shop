// src/components/admin/tabs/SalesReportContent.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import {
  downloadExcelWorkbook,
  generateSummaryExcel,
  generateTopProductsExcel,
  generateOrdersExcel,
  generateFullExcel,
  formatPriceSafe,
  toPersianNumberSafe,
} from '../../../utils/reportExcelUtils';
import { formatPrice, toPersianNumber } from '../../../utils/formatPrice';
import { formatJalaliDate } from '../../../utils/jalaliUtils';

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

function SalesReportContent({ categories, reportData, loading, onGenerateReport }) {
  const today = new Date();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [filters, setFilters] = useState({ status: 'پرداخت شده', categoryId: 'همه' });

  const handleDownloadExcel = async (type) => {
    if (!reportData) {
      toast.error('لطفاً ابتدا گزارش را تولید کنید');
      return;
    }
    
    try {
      const { summary, orders, topProducts, attributeTypes, attributeValues } = reportData;
      const startDateStr = startDate ? formatJalaliDate(startDate) : '-';
      const endDateStr = endDate ? formatJalaliDate(endDate) : '-';
      const categoryId = filters.categoryId === 'همه' ? 'همه' : parseInt(filters.categoryId);
      const categoryName = categoryId === 'همه' ? 'همه' : categories.find(c => c.id === categoryId)?.name || 'همه';

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
          toast.error('نوع گزارش نامعتبر است');
          return;
      }
      await downloadExcelWorkbook(workbook, fileName);
      toast.success(`${fileName} با موفقیت دانلود شد`);
    } catch (error) {
      console.error('❌ خطا در تولید Excel:', error);
      toast.error('خطا در تولید Excel');
    }
  };

  return (
    <>
      {/* ===== بخش تنظیمات گزارش ===== */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">تاریخ شروع:</label>
            <SimplePersianDatePicker value={startDate} onChange={setStartDate} className="w-auto flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap ml-0.5">تاریخ پایان :</label>
            <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-auto flex-1" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-6 mb-4 mt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت سفارش</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white bg-no-repeat"
              style={{
                backgroundPosition: 'left 0.5rem center',
                paddingLeft: '0.5rem',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                appearance: 'none',
              }}
            >
              <option value="همه">همه</option>
              <option value="پرداخت شده">پرداخت شده</option>
              <option value="ارسال شده">ارسال شده</option>
              <option value="تحویل داده شده">تحویل داده شده</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی محصول</label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white bg-no-repeat"
              style={{
                backgroundPosition: 'left 0.5rem center',
                paddingLeft: '0.5rem',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                appearance: 'none',
              }}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
          <button
            onClick={() => onGenerateReport({ startDate, endDate, filters })}
            disabled={loading}
            className="px-6 pr-3 py-2.5 bg-[#800E2F] hover:bg-[#6B0A26] mt-0 mr-0 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="inline-block mr-2" />
                در حال تولید...
              </>
            ) : (
              '🔍 تولید گزارش فروش'
            )}
          </button>
      </div>

      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {reportData && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4">📥 دانلود گزارش‌ها</h4>
            <div className="flex flex-wrap gap-3">
              <span className="text-sm font-medium text-gray-500 w-full">📊 Excel:</span>
              <button onClick={() => handleDownloadExcel('summary')} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition">📊 خلاصه آمار</button>
              <button onClick={() => handleDownloadExcel('topProducts')} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition">🏆 محصولات پرفروش</button>
              <button onClick={() => handleDownloadExcel('orders')} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition">📋 لیست سفارشات</button>
              <button onClick={() => handleDownloadExcel('full')} className="px-4 py-2 bg-[#1a7a3a] hover:bg-[#0f5c2a] text-white rounded-lg font-medium transition">📄 گزارش کامل</button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4">📈 خلاصه آمار</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">تعداد سفارشات</p>
                <p className="text-2xl font-bold text-[#800E2F]">{toPersianNumberSafe(reportData.summary.totalOrders)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">جمع فروش</p>
                <p className="text-2xl font-bold text-[#800E2F]">{formatPriceSafe(reportData.summary.totalSales)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">میانگین هر سفارش</p>
                <p className="text-2xl font-bold text-[#800E2F]">{formatPriceSafe(reportData.summary.averageOrderValue)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">تعداد مشتریان</p>
                <p className="text-2xl font-bold text-[#800E2F]">{toPersianNumberSafe(reportData.summary.totalCustomers)}</p>
              </div>
            </div>
          </div>

          {reportData.topProducts && reportData.topProducts.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-4">🏆 محصولات پرفروش</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 text-xs">
                      <th className="text-right py-2 px-3">ردیف</th>
                      <th className="text-right py-2 px-3">نام محصول</th>
                      <th className="text-right py-2 px-3">تعداد فروش</th>
                      <th className="text-right py-2 px-3">درآمد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-500">{toPersianNumberSafe(index + 1)}</td>
                        <td className="py-2 px-3 font-medium">{item.name}</td>
                        <td className="py-2 px-3">{toPersianNumberSafe(item.totalQuantity)}</td>
                        <td className="py-2 px-3 text-[#800E2F] font-medium">{formatPriceSafe(item.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportData.orders && reportData.orders.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-4">📋 لیست سفارشات</h4>
              <div className="space-y-4">
                {reportData.orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800">#{order.id}</span>
                        <span className="text-sm text-gray-500">{order.tracking_code || 'بدون کد'}</span>
                        <span className="text-xs text-gray-400">{order.created_at ? formatJalaliDate(new Date(order.created_at)) : '-'}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'تحویل داده شده' ? 'bg-green-100 text-green-700' : order.status === 'ارسال شده' ? 'bg-blue-100 text-blue-700' : order.status === 'پرداخت شده' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 text-xs">
                            <th className="text-right py-1 px-2">محصول</th>
                            <th className="text-right py-1 px-2">تعداد</th>
                            <th className="text-right py-1 px-2">قیمت واحد</th>
                            <th className="text-right py-1 px-2">تخفیف ویژه</th>
                            <th className="text-right py-1 px-2">تخفیف با کد</th>
                            <th className="text-right py-1 px-2">جمع</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => {
                            const hasFeaturedDiscount = item.original_price && item.original_price > item.price;
                            const discountPercent = hasFeaturedDiscount ? Math.round((1 - item.price / item.original_price) * 100) : 0;
                            const hasCouponDiscount = order.discount_amount > 0;
                            const couponCode = order.discount_code || '';
                            
                            const fullName = getFullProductName(item);

                            return (
                              <tr key={idx} className="border-b border-gray-100">
                                <td className="py-1 px-2">{fullName}</td>
                                <td className="py-1 px-2">{item.quantity}</td>
                                <td className="py-1 px-2">
                                  <span className="text-[#800E2F] font-medium">{formatPrice(item.price)} ت</span>
                                </td>
                                <td className="py-1 px-2">
                                  {hasFeaturedDiscount ? (
                                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                                      {discountPercent}%
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="py-1 px-2">
                                  {hasCouponDiscount ? (
                                    <div className="text-xs">
                                      <span className="font-bold text-green-600">کد: {couponCode}</span>
                                      <br />
                                      <span className="text-green-600">{formatPrice(order.discount_amount)} ت</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="py-1 px-2 font-bold text-[#800E2F]">
                                  {formatPrice(item.quantity * item.price)} ت
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-200">
                            <td colSpan="5" className="py-2 px-2 text-left font-bold text-gray-700">جمع کل سفارش:</td>
                            <td className="py-2 px-2 font-bold text-[#800E2F] text-lg">{formatPrice(order.total_price)} ت</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    {order.address && (
                      <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                        <span className="font-medium">آدرس:</span> {order.address}
                        {order.phone && <span className="mr-3">📞 {order.phone}</span>}
                        {order.receiver_name && <span className="mr-3">👤 {order.receiver_name}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-400 text-center mt-4">
                {toPersianNumberSafe(reportData.orders.length)} سفارش در این بازه زمانی ثبت شده است.
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default SalesReportContent;