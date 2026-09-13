// src/components/admin/tabs/MobileDashboardTab.jsx
import { formatPrice } from '../../../utils/formatPrice';
import { Link } from 'react-router-dom';

function MobileDashboardTab({ stats }) {
  if (!stats) return null;

  // ===== ۴ کارت اول (بدون فروش کل) =====
  const statsData = [
    { label: 'کاربران', value: stats.users, icon: '👥', color: 'blue' },
    { label: 'محصولات', value: stats.products, icon: '📦', color: 'green' },
    { label: 'سفارشات', value: stats.orders, icon: '📋', color: 'purple' },
    { label: 'نظرات', value: stats.reviews, icon: '💬', color: 'yellow' },
  ];

  return (
    <div className="pb-4">
      {/* ===== کارت‌های آمار (۴ کارت اول در دو ستون + فروش کل تمام‌عرض) ===== */}
      <div className="grid grid-cols-2 gap-2">
        {/* ۴ کارت اول */}
        {statsData.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl p-3 border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">{item.icon}</span>
              <div>
                <p className="text-[10px] font-medium text-gray-500">{item.label}</p>
                <p className="text-base font-bold text-gray-800">{item.value}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="col-span-2 bg-white rounded-xl p-3 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <div>
              <p className="text-[10px] font-medium text-gray-500">فروش کل</p>
              <p className="text-base font-bold text-gray-800">{formatPrice(stats.totalSales) + ' ت'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
            <span>📋</span> آخرین سفارشات
          </h3>
          <button onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: { tab: 'orders' } }))} className="text-[10px] text-[#800E2F] font-medium hover:underline">
            مشاهده همه
          </button>
        </div>

        {stats.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="space-y-2">
            {stats.recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-3 border border-gray-200/60 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded">#{order.id}</span>
                  <span className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleDateString('fa-IR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#800E2F]">{formatPrice(order.total_price)} ت</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                    order.status === 'تحویل داده شده' ? 'bg-green-100 text-green-700' :
                    order.status === 'ارسال شده' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'پرداخت شده' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-200/60">
            <p className="text-xs text-gray-400">هیچ سفارشی ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileDashboardTab;  