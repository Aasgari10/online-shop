// src/components/auth/MobileProfile.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import OrderTimer from '../shared/OrderTimer';

function MobileProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const expireHandled = useRef(false);
  const fetchTimeout = useRef(null);

  // ✅ بارگذاری userData فقط در کلاینت
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const parsed = user ? JSON.parse(user) : null;
      setUserData(parsed);
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const ordersRes = await api.get('/orders');
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
        expireHandled.current = false;
      }
    } catch (error) {
      console.error('❌ [MobileProfile] خطا در دریافت سفارشات:', error);
    }
  };

  const handleExpire = () => {
    if (expireHandled.current) return;
    expireHandled.current = true;
    fetchOrders();
    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(() => {
      fetchOrders();
      fetchTimeout.current = null;
    }, 2000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/profile');
        if (profileRes.data.success) {
          setProfile(profileRes.data.data);
        }
        await fetchOrders();
        setError('');
      } catch (error) {
        console.error('❌ [MobileProfile] خطا:', error);
        if (error.response?.status === 401) {
          setError('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
          toast.error('نشست شما منقضی شده است.');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/login'), 1500);
          return;
        }
        setError('خطا در دریافت اطلاعات');
        toast.error('خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    };
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm('آیا از خروج از حساب کاربری مطمئن هستید؟')) {
      localStorage.removeItem('user');
      toast.success('با موفقیت خارج شدید');
      navigate('/login');
      window.location.reload();
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'در انتظار پرداخت': { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⏳', label: 'در انتظار پرداخت' },
      'پرداخت شده': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '✅', label: 'پرداخت شده' },
      'ارسال شده': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🚚', label: 'ارسال شده' },
      'تحویل داده شده': { color: 'bg-green-100 text-green-700 border-green-200', icon: '📦', label: 'تحویل داده شده' },
      'لغو شده': { color: 'bg-red-100 text-red-700 border-red-200', icon: '❌', label: 'لغو شده' },
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📋', label: status };
  };

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <p className="font-bold text-gray-800">خطا</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-red-500 text-white px-5 py-2 rounded-lg text-sm hover:bg-red-600 transition">
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DCC8] pb-5 pt-2">
      <div className="mx-1 bg-gradient-to-r from-[#800E2F] to-[#6B0A26] rounded-2xl shadow-sm overflow-hidden border border-gray-200/60">
        <div className="flex items-center gap-4 p-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl text-white font-bold border-2 border-white/30 flex-shrink-0 shadow-lg">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0 text-white">
            <h2 className="text-base font-bold truncate">{profile?.name || 'کاربر'}</h2>
            <p className="text-xs text-white/80 truncate">{profile?.email || 'ایمیل ثبت نشده'}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-white/60 whitespace-nowrap">
              <span>عضویت: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fa-IR') : '-'}</span>
              <span>|</span>
              <span>{orders.length} سفارش</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex-shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-medium transition border border-white/30 backdrop-blur-sm"
          >
            🚪 خروج
          </button>
        </div>
      </div>

      <div className="mx-1 mt-3 bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
        <div className="flex border-b border-gray-200/60">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-center text-sm font-medium transition ${
              activeTab === 'profile'
                ? 'text-[#800E2F] border-b-2 border-[#800E2F] bg-[#800E2F]/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 اطلاعات
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 text-center text-sm font-medium transition ${
              activeTab === 'orders'
                ? 'text-[#800E2F] border-b-2 border-[#800E2F] bg-[#800E2F]/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📦 سفارشات
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-center text-sm font-medium transition ${
              activeTab === 'settings'
                ? 'text-[#800E2F] border-b-2 border-[#800E2F] bg-[#800E2F]/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ تنظیمات
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-5 bg-[#800E2F] rounded-full"></span>
              <h3 className="text-sm font-bold text-gray-800">📋 اطلاعات شخصی</h3>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-400">نام کامل</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{profile?.name || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-400">ایمیل</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{profile?.email || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-400">تاریخ عضویت</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-400">تعداد سفارشات</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{orders.length} سفارش</p>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-[#800E2F] rounded-full"></span>
              <h3 className="text-sm font-bold text-gray-800">📦 تاریخچه سفارشات</h3>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">شما هنوز سفارشی ثبت نکرده‌اید.</p>
                <Link to="/shop" className="inline-block mt-3 text-xs text-[#800E2F] font-medium hover:underline">
                  شروع خرید
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isPending = order.status === 'در انتظار پرداخت';
                  const statusInfo = getStatusInfo(order.status);

                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between p-3 bg-gray-50/70 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                            #{order.id}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(order.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.color}`}>
                            <span>{statusInfo.icon}</span>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs font-bold text-[#800E2F]">
                            {formatPrice(order.total_price)} ت
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        {isPending && order.expires_at && (
                          <div className="mb-2">
                            <OrderTimer expiresAt={order.expires_at} onExpire={handleExpire} />
                          </div>
                        )}

                        {order.items && order.items.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[9px] text-gray-400 ml-1">محصولات:</span>
                            {order.items.slice(0, 2).map((item, idx) => (
                              <span key={item.id} className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-full text-gray-700 border border-gray-200">
                                {item.product_name}
                                <span className="text-gray-400 text-[8px] mr-0.5">×{item.quantity}</span>
                              </span>
                            ))}
                            {order.items.length > 2 && (
                              <span className="text-[9px] text-gray-400">+{order.items.length - 2} مورد</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-gray-100">
                          <Link
                            to={`/order/${order.id}`}
                            className="text-[10px] text-[#800E2F] font-medium hover:underline"
                          >
                            مشاهده جزئیات
                          </Link>
                          {isPending && (
                            <Link
                              to={`/payment?orderId=${order.id}`}
                              className="px-3 py-1 bg-[#800E2F] text-white rounded-lg text-[10px] font-medium hover:bg-[#6B0A26] transition"
                            >
                              💳 پرداخت
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1 h-5 bg-[#800E2F] rounded-full"></span>
              <h3 className="text-sm font-bold text-gray-800">⚙️ تنظیمات</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="font-medium text-gray-800 text-sm">🔑 تغییر رمز عبور</p>
                <p className="text-[10px] text-gray-400">برای امنیت بیشتر</p>
              </div>
              <button className="px-4 py-1.5 bg-[#800E2F] text-white rounded-lg text-xs font-medium hover:bg-[#6B0A26] transition">
                تغییر
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="font-medium text-gray-800 text-sm">🚪 خروج از حساب</p>
                <p className="text-[10px] text-gray-400">نیاز به ورود مجدد</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition"
              >
                خروج
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-4"></div>
    </div>
  );
}

export default MobileProfile;