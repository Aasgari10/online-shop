// src/components/auth/Profile.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import OrderTimer from '../shared/OrderTimer';

function Profile() {
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
      console.error('❌ [Profile] خطا در دریافت سفارشات:', error);
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
        console.error('❌ [Profile] خطا:', error);
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

  const handleChangePassword = () => {
    toast.info('قابلیت تغییر رمز عبور به زودی اضافه می‌شود!');
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
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md mx-auto">
          <p className="font-bold">❌ خطا</p>
          <p className="mt-2">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '👤 اطلاعات کاربری' },
    { id: 'orders', label: '📦 سفارشات' },
    { id: 'settings', label: '⚙️ تنظیمات' },
  ];

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-12 md: pt-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white mt-5 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#800E2F] to-[#6B0A26] px-6 py-8 md:py-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl md:text-5xl text-white font-bold border-4 border-white/30 shadow-lg flex-shrink-0">
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-center md:text-right text-white flex-1">
                <h2 className="text-2xl md:text-3xl font-bold">{profile?.name || 'کاربر'}</h2>
                <p className="text-white/80 text-sm md:text-base mt-1">{profile?.email || 'ایمیل ثبت نشده'}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    عضو از {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {orders.length} سفارش
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleChangePassword}
                  className="flex-shrink-0 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/30 hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  تغییر رمز
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-white/30 hover:scale-105"
                >
                  🚪 خروج
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-wrap gap-1 px-4 pt-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white text-[#800E2F] shadow-sm border border-b-0 border-gray-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8">
            {activeTab === 'profile' && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#800E2F] rounded-full"></span>
                  اطلاعات شخصی
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-400">نام کامل</p>
                    <p className="text-gray-800 font-medium mt-0.5">{profile?.name || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-400">ایمیل</p>
                    <p className="text-gray-800 font-medium mt-0.5">{profile?.email || '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-400">تاریخ عضویت</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs text-gray-400">تعداد سفارشات</p>
                    <p className="text-gray-800 font-medium mt-0.5">{orders.length} سفارش</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-[#800E2F] rounded-full"></span>
                    تاریخچه سفارشات
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{orders.length} سفارش</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-base">شما هنوز سفارشی ثبت نکرده‌اید.</p>
                    <Link to="/shop" className="inline-block mt-4 text-[#800E2F] hover:underline font-medium">شروع خرید</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isPending = order.status === 'در انتظار پرداخت';
                      const statusInfo = getStatusInfo(order.status);

                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-[#800E2F]/20 hover:-translate-y-0.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50/70 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-800 text-sm bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200">
                                #{order.id}
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(order.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                <span>{statusInfo.icon}</span>
                                {statusInfo.label}
                              </span>
                              <span className="text-sm font-bold text-[#800E2F] bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200">
                               تومان {formatPrice(order.total_price)} 
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            {isPending && order.expires_at && (
                              <div className="mb-3">
                                <OrderTimer expiresAt={order.expires_at} onExpire={handleExpire} />
                              </div>
                            )}

                            {order.items && order.items.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium ml-1">محصولات:</span>
                                {order.items.map((item, idx) => (
                                  <span
                                    key={item.id}
                                    className="inline-flex items-center gap-1 text-xs bg-gray-50 px-3 py-1.5 rounded-full text-gray-700 border border-gray-200"
                                  >
                                    {item.product_name}
                                    <span className="text-gray-400 text-[10px] bg-gray-200 px-1.5 rounded-full">
                                      {item.quantity}×
                                    </span>
                                    {idx < order.items.length - 1 && <span className="text-gray-300 mx-0.5">•</span>}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                              <Link
                                to={`/order/${order.id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-[#800E2F] hover:text-[#6B0A26] font-medium hover:underline transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                مشاهده جزئیات
                              </Link>
                              {isPending && (
                                <Link
                                  to={`/payment?orderId=${order.id}`}
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg text-xs font-medium transition shadow-sm hover:shadow"
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
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#800E2F] rounded-full"></span>
                  تنظیمات
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-800">تغییر رمز عبور</p>
                      <p className="text-xs text-gray-400">برای امنیت بیشتر، رمز خود را به‌روز کنید</p>
                    </div>
                    <button
                      onClick={handleChangePassword}
                      className="px-4 py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg text-sm font-medium transition"
                    >
                      تغییر
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-800">خروج از حساب</p>
                      <p className="text-xs text-gray-400">پس از خروج، برای ورود مجدد نیاز به احراز هویت دارید</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
                    >
                      خروج
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;