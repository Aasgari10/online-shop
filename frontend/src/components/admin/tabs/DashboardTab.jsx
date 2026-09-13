// src/components/admin/tabs/DashboardTab.jsx
import { formatPrice } from '../../../utils/formatPrice';
import PageHeader from '../../shared/PageHeader';

function DashboardTab({ stats }) {
  if (!stats) return null;

  const statsData = [
    { label: 'کاربران', value: stats.users, icon: '👥', color: 'blue' },
    { label: 'محصولات', value: stats.products, icon: '📦', color: 'green' },
    { label: 'سفارشات', value: stats.orders, icon: '📋', color: 'purple' },
    { label: 'نظرات', value: stats.reviews, icon: '💬', color: 'yellow' },
    { label: 'فروش کل', value: formatPrice(stats.totalSales) + ' ت', icon: '💰', color: 'red' },
  ];

  return (
    <div>
      {/* ===== هدر با استایل جدید ===== */}
      <PageHeader 
        title="📊 داشبورد مدیریت" 
        subtitle="نمای کلی از وضعیت فروشگاه" 
        className="pt-2"
        
      />

      {/* ===== کارت‌های آمار با انیمیشن ===== */}
      <div className="grid grid-cols-2 mt-3 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-3">
        {statsData.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl m-2 p-4 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-[#800E2F]/20"
          >
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold text-gray-800">{item.value}</p>
          </div>
        ))}
      </div>

      {/* ===== آخرین سفارشات ===== */}
      <div>
        <h3 className="font-bold mr-2 text-gray-800 mb-3 flex items-center gap-2">
          <span>📋 آخرین سفارشات</span>
          <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {stats.recentOrders?.length || 0} سفارش
          </span>
        </h3>
        {stats.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="m-2 space-y-2">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition hover:border-[#800E2F]/20"
              >
                <div>
                  <span className="font-medium text-gray-800">#{order.id}</span>
                  <span className="text-sm text-gray-500 mr-3">
                    {new Date(order.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#800E2F]">
                    {formatPrice(order.total_price)} ت
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'تحویل داده شده'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'ارسال شده'
                        ? 'bg-blue-100 text-blue-700'
                        : order.status === 'پرداخت شده'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">هیچ سفارشی ثبت نشده است</div>
        )}
      </div>
    </div>
  );
}

export default DashboardTab;