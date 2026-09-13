// src/components/order/MobileOrderDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import { formatJalaliDate } from '../../utils/jalaliUtils';
import OrderTimer from '../shared/OrderTimer';

// ✅ تابع تولید متن کامل ویژگی‌ها (با پشتیبانی از رنگ‌های سفارشی) - مشابه نسخه دسکتاپ
const getVariationText = (item) => {
  const parts = [];
  
  // ✅ ۱. ابتدا از color_name استفاده کن (اگر وجود دارد)
  if (item.color_name) {
    parts.push(`رنگ: ${item.color_name}`);
  }
  
  // ✅ ۲. اگر color_name وجود نداشت، از attribute_values_json استخراج کن
  if (!item.color_name && item.attribute_values_json) {
    try {
      const attrs = typeof item.attribute_values_json === 'string'
        ? JSON.parse(item.attribute_values_json)
        : item.attribute_values_json;
      
      if (typeof attrs === 'object' && attrs !== null && attrs['1']) {
        parts.push(`رنگ: ${attrs['1']}`);
      }
    } catch (e) {
      // ignore
    }
  }
  
  // ✅ ۳. سایز
  if (item.size_name) {
    parts.push(`سایز: ${item.size_name}`);
  }
  
  // ✅ ۴. سایر ویژگی‌ها (از attribute_values_json)
  if (item.attribute_values_json) {
    try {
      const attrs = typeof item.attribute_values_json === 'string'
        ? JSON.parse(item.attribute_values_json)
        : item.attribute_values_json;
      
      if (typeof attrs === 'object' && attrs !== null) {
        for (const [key, value] of Object.entries(attrs)) {
          if (key === '1') continue;
          parts.push(`${key}: ${value}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }
  
  return parts.join(' - ');
};

function MobileOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isAdmin = userData?.role === 'admin';

  const from = location.state?.from || '/admin';

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        setError('خطا در دریافت اطلاعات سفارش');
      }
    } catch (err) {
      console.error('❌ [MobileOrderDetail] خطا:', err);
      if (err.response?.status === 404) {
        setError('سفارش یافت نشد');
      } else if (err.response?.status === 403) {
        setError('شما دسترسی به این سفارش ندارید');
      } else {
        setError('خطا در دریافت اطلاعات سفارش');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const jalali = formatJalaliDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${jalali} - ${hours}:${minutes}`;
  };

  const handleGoBack = () => {
    const returnToTab = sessionStorage.getItem('returnToTab');
    if (returnToTab) {
      navigate('/admin', { state: { returnToTab } });
    } else {
      navigate(from);
    }
  };

  const adminTabs = [
    { key: 'dashboard', label: '📊 داشبورد' },
    { key: 'orders', label: '📋 سفارشات' },
    { key: 'products', label: '📦 محصولات' },
    { key: 'reviews', label: '💬 نظرات' },
    { key: 'users', label: '👥 کاربران' },
    { key: 'tickets', label: '🎫 تیکت‌ها' },
    { key: 'banners', label: '🖼️ بنرها' },
    { key: 'featured', label: '⭐ تخفیف‌دارها' },
    { key: 'discount-codes', label: '🎫 کد تخفیف' },
    { key: 'trash', label: '🗑️ سطل زباله' },
  ];

  const handleAdminTabClick = (tabKey) => {
    sessionStorage.setItem('returnToTab', tabKey);
    navigate('/admin', { state: { returnToTab: tabKey } });
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">خطا</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <button onClick={handleGoBack} className="inline-block mt-4 text-[#800E2F] hover:underline text-sm">
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusColors = {
    'در انتظار پرداخت': 'bg-orange-100 text-orange-700',
    'پرداخت شده': 'bg-blue-100 text-blue-700',
    'ارسال شده': 'bg-purple-100 text-purple-700',
    'تحویل داده شده': 'bg-green-100 text-green-700',
    'لغو شده': 'bg-red-100 text-red-700',
  };

  const statusIcons = {
    'در انتظار پرداخت': '⏳',
    'پرداخت شده': '✅',
    'ارسال شده': '🚚',
    'تحویل داده شده': '📦',
    'لغو شده': '❌',
  };

  return (
    <div className="min-h-screen bg-[#E8DCC8] pb-24">
      <div className="sticky top-0 z-30 bg-[#E8DCC8] px-2 py-1.5 flex items-center justify-between border-b border-gray-200/60">
        <button 
          onClick={handleGoBack} 
          className="p-1 mt-1 rounded-full bg-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 border border-gray-200/50"
        >
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-base font-bold text-gray-800 mt-2 relative inline-block pb-1.5">
          جزئیات سفارش
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <div className="w-6"></div>
      </div>

      <div className="mx-1 mt-2 space-y-3 pb-16">
        <div className="bg-gradient-to-r from-[#800E2F] to-[#6B0A26] rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70">شماره سفارش</span>
            <span className="text-sm font-bold text-white">#{order.id}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70">کد پیگیری</span>
            <span className="text-sm font-mono font-bold text-white">{order.tracking_code || '---'}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70">تاریخ ثبت</span>
            <span className="text-xs text-white">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="flex items-center justify-between mb-3 pt-3 border-t border-white/20">
            <span className="text-xs text-white/70">وضعیت</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
              {statusIcons[order.status]} {order.status}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2 pt-2 border-t border-white/20">
            <span className="text-xs text-white/70">جمع کل</span>
            <span className="text-lg font-bold text-white">{formatPrice(order.total_price)} تومان</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-xs text-white/70">تخفیف کد</span>
              <span className="text-green-300 font-medium">- {formatPrice(order.discount_amount)} تومان</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">تعداد اقلام</span>
            <span className="text-sm text-white">{order.items?.length || 0} عدد</span>
          </div>
        </div>

        {order.address && (
          <div className="bg-white rounded-2xl p-4 border border-gray-200/60 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              آدرس تحویل
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">گیرنده</span>
                <span className="text-sm font-medium text-gray-800">{order.receiver_name || 'نامشخص'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">تلفن</span>
                <span className="text-sm text-gray-700">{order.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">آدرس</span>
                <span className="text-sm text-gray-700 text-left">{order.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">استان/شهر</span>
                <span className="text-sm text-gray-700">{order.province}، {order.city}</span>
              </div>
              {order.postal_code && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">کد پستی</span>
                  <span className="text-sm text-gray-700">{order.postal_code}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 border border-gray-200/60 shadow-sm">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            محصولات سفارش
          </h4>

          {order.items && order.items.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((item) => {
                // ✅ تولید متن کامل ویژگی‌ها با پشتیبانی از رنگ‌های سفارشی
                const variationText = getVariationText(item);
                
                const hasFeaturedDiscount = item.original_price && item.original_price > item.price;
                const discountPercent = hasFeaturedDiscount ? Math.round((1 - item.price / item.original_price) * 100) : 0;

                return (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {item.image_url ? (
                          <img src={`${item.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">بدون</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">
                          {item.product_name}
                        </p>
                        {/* ✅ نمایش ویژگی‌ها در زیر نام محصول */}
                        {variationText && (
                          <div className="text-right text-[10px] text-gray-500 mt-1 break-words">
                            {variationText}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <span className="text-gray-500">تعداد: {item.quantity}</span>
                          {hasFeaturedDiscount && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
                              {discountPercent}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#800E2F] whitespace-nowrap">
                        {formatPrice(item.quantity * item.price)} ت
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">هیچ محصولی در این سفارش یافت نشد.</div>
          )}
        </div>

        {order.status === 'در انتظار پرداخت' && (
          <div className="space-y-3">
            <OrderTimer 
              expiresAt={order.expires_at} 
              onExpire={() => {
                fetchOrder();
              }}
            />
            <Link
              to={`/payment?orderId=${order.id}`}
              className="block w-full py-3 text-center bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-xl font-bold text-sm transition active:scale-95"
            >
              💳 پرداخت سفارش
            </Link>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg pb-1">
          <div 
            className="flex overflow-x-auto py-2 px-1 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch',
              scrollbarColor: '#800E2F #f1f1f1',
            }}
          >
            <style>{`
              .flex::-webkit-scrollbar {
                height: 5px;
              }
              .flex::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
              }
              .flex::-webkit-scrollbar-thumb {
                background: #800E2F;
                border-radius: 3px;
              }
              .flex::-webkit-scrollbar-thumb:hover {
                background: #6B0A26;
              }
            `}</style>

            {adminTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleAdminTabClick(tab.key)}
                className="flex-shrink-0 min-w-[65px] px-3 py-1.5 text-center text-[9px] font-medium transition relative text-gray-500 hover:text-[#800E2F]"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base leading-none">{tab.label.split(' ')[0]}</span>
                  <span className="leading-tight whitespace-nowrap">{tab.label.split(' ').slice(1).join(' ')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileOrderDetail;