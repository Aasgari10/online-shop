// src/components/order/OrderDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import { formatJalaliDate } from '../../utils/jalaliUtils';
import OrderTimer from '../shared/OrderTimer';

// ✅ تابع تولید متن کامل ویژگی‌ها (با پشتیبانی از رنگ‌های سفارشی)
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
          // کلید 1 = رنگ (که قبلاً اضافه شد)
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

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isAdmin = userData?.role === 'admin';

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      
      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        setError('خطا در دریافت اطلاعات سفارش');
      }
    } catch (err) {
      console.error('❌ [OrderDetail] خطا در دریافت سفارش:', err);
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

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطا</h2>
          <p className="text-gray-600">{error}</p>
          <Link to={isAdmin ? '/admin' : '/profile'} className="inline-block mt-6 text-[#800E2F] hover:underline">
            {isAdmin ? 'بازگشت به پنل مدیریت' : 'بازگشت به پروفایل'}
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const statusColors = {
    'در انتظار پرداخت': 'bg-yellow-100 text-yellow-800',
    'پرداخت شده': 'bg-blue-100 text-blue-800',
    'ارسال شده': 'bg-purple-100 text-purple-800',
    'تحویل داده شده': 'bg-green-100 text-green-800',
    'لغو شده': 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <Link to={isAdmin ? '/admin' : '/profile'} className="inline-flex items-center gap-2 text-[#800E2F] hover:text-[#6B0A26] font-medium transition mb-6 group">
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {isAdmin ? 'بازگشت به پنل مدیریت' : 'بازگشت به پروفایل'}
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#800E2F] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">جزئیات سفارش</h1>
              <p className="text-white/70 text-sm mt-0.5">کد پیگیری: <span className="font-mono">{order.tracking_code || '---'}</span></p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
              {order.status}
            </span>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="text-gray-500">شماره سفارش:</span>
                <p className="font-medium text-gray-800">#{order.id}</p>
              </div>
              <div>
                <span className="text-gray-500">کد پیگیری:</span>
                <p className="font-mono font-medium text-[#800E2F]">{order.tracking_code || '---'}</p>
              </div>
              <div>
                <span className="text-gray-500">تاریخ ثبت:</span>
                <p className="font-medium text-gray-800">{formatDateTime(order.created_at)}</p>
              </div>
              <div>
                <span className="text-gray-500">جمع کل:</span>
                <p className="font-bold text-[#800E2F] text-lg">{formatPrice(order.total_price)} ت</p>
              </div>
              <div>
                <span className="text-gray-500">تعداد اقلام:</span>
                <p className="font-medium text-gray-800">{order.items?.length || 0} عدد</p>
              </div>
              {order.discount_amount > 0 && (
                <div>
                  <span className="text-gray-500">تخفیف کد:</span>
                  <p className="font-bold text-green-600">- {formatPrice(order.discount_amount)} ت</p>
                </div>
              )}
            </div>

            {order.address && (
              <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-blue-50/30">
                <h4 className="font-bold text-gray-700 text-sm mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  آدرس تحویل
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <div><span className="text-gray-500">گیرنده:</span> <span className="font-medium">{order.receiver_name || 'نامشخص'}</span></div>
                  <div><span className="text-gray-500">تلفن:</span> <span className="font-medium">{order.phone || '—'}</span></div>
                  <div className="md:col-span-2"><span className="text-gray-500">آدرس:</span> <span className="font-medium">{order.address}</span></div>
                  <div><span className="text-gray-500">استان:</span> <span className="font-medium">{order.province}</span></div>
                  <div><span className="text-gray-500">شهر:</span> <span className="font-medium">{order.city}</span></div>
                  <div><span className="text-gray-500">کد پستی:</span> <span className="font-medium">{order.postal_code || '—'}</span></div>
                </div>
              </div>
            )}

            <h3 className="font-bold text-gray-700 mb-4 text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              محصولات سفارش
            </h3>

            <div className="space-y-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => {
                  // ✅ تولید متن کامل ویژگی‌ها با پشتیبانی از رنگ‌های سفارشی
                  const variationText = getVariationText(item);
                  
                  const hasFeaturedDiscount = item.original_price && item.original_price > item.price;
                  const discountPercent = hasFeaturedDiscount ? Math.round((1 - item.price / item.original_price) * 100) : 0;
                  const hasCouponDiscount = order.discount_amount > 0;

                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img src={`${item.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">بدون</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {item.product_name}
                        </p>
                        {/* ✅ نمایش ویژگی‌ها در زیر نام محصول */}
                        {variationText && (
                          <div className="text-right text-[10px] md:text-xs text-gray-500 mt-1 break-words">
                            {variationText}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                          <span>تعداد: {item.quantity}</span>
                          {hasFeaturedDiscount ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 line-through">{formatPrice(item.original_price)} ت</span>
                              <span className="text-[#800E2F] font-bold">{formatPrice(item.price)} ت</span>
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                {discountPercent}%
                              </span>
                            </div>
                          ) : (
                            <span>قیمت واحد: {formatPrice(item.price)} ت</span>
                          )}
                          {hasCouponDiscount && (
                            <span className="text-xs text-green-600">
                              تخفیف کد: {formatPrice(order.discount_amount)} ت
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#800E2F] whitespace-nowrap">
                        {formatPrice(item.quantity * item.price)} ت
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">هیچ محصولی در این سفارش یافت نشد.</div>
              )}
            </div>

            {order.status === 'در انتظار پرداخت' && (
              <div className="mt-4 space-y-4">
                <OrderTimer 
                  expiresAt={order.expires_at} 
                  onExpire={() => {
                    fetchOrder();
                  }}
                />

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                  <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">این سفارش در انتظار پرداخت است.</p>
                    <p className="text-xs text-yellow-700 mt-1">در صورت عدم پرداخت، سفارش به‌طور خودکار لغو خواهد شد.</p>
                    <Link
                      to={`/payment?orderId=${order.id}`}
                      className="mt-2 inline-block text-sm bg-[#800E2F] hover:bg-[#6B0A26] text-white px-4 py-1.5 rounded-lg font-medium transition"
                    >
                      💳 پرداخت سفارش
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <Link to="/admin" className="bg-[#800E2F] hover:bg-[#6B0A26] text-white px-6 py-2.5 rounded-lg font-medium transition shadow-md hover:shadow-lg">
                  بازگشت به پنل مدیریت
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;