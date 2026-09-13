// src/components/cart/PaymentPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';
import OrderTimer from '../shared/OrderTimer';

function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { cartItems, totalPrice, totalItems, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('6037-9918-1234-5678');
  const [expiryDate, setExpiryDate] = useState('12/25');
  const [cvv, setCvv] = useState('***');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [orderExpiresAt, setOrderExpiresAt] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [finalTotal, setFinalTotal] = useState(totalPrice);

  const orderIdFromUrl = searchParams.get('orderId') || location.state?.orderId;

  useEffect(() => {
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl);
    }
  }, [orderIdFromUrl]);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const res = await api.get(`/orders/${orderId}`);
          if (res.data.success) {
            const order = res.data.data;
            setOrderExpiresAt(order.expires_at);
            setOrderStatus(order.status);
            if (order.discount_amount > 0) {
              setDiscountAmount(order.discount_amount);
              setFinalTotal(order.total_price);
            }
            if (order.status === 'لغو شده' || order.status === 'پرداخت شده') {
              toast.warning(`وضعیت سفارش: ${order.status}`);
              if (order.status === 'پرداخت شده') {
                navigate('/profile');
              } else {
                navigate('/profile');
              }
            }
          }
        } catch (error) {
          console.error('خطا در دریافت سفارش:', error);
        }
      };
      fetchOrder();
    }
  }, [orderId, navigate]);

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error('لطفاً کد تخفیف را وارد کنید');
      return;
    }
    if (!orderId) {
      toast.error('سفارشی برای اعمال کد تخفیف یافت نشد');
      return;
    }

    setDiscountLoading(true);
    setDiscountError('');
    try {
      const applyRes = await api.post(`/orders/${orderId}/apply-discount`, {
        code: discountCode.trim().toUpperCase(),
      });
      if (applyRes.data.success) {
        const { discountAmount: amount, newTotal, discount } = applyRes.data.data;
        setDiscountAmount(amount);
        setAppliedDiscount(discount);
        setFinalTotal(newTotal);
        localStorage.setItem('discountCode', JSON.stringify({
          id: discount.id,
          amount: amount,
          code: discount.code,
        }));
        toast.success(`تخفیف ${amount.toLocaleString()} تومان اعمال شد`);
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.success) {
          setOrderExpiresAt(res.data.data.expires_at);
        }
      }
    } catch (error) {
      setDiscountError(error.response?.data?.message || 'کد تخفیف نامعتبر است');
      setDiscountAmount(0);
      setAppliedDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error('رمز پویا را به درستی وارد کنید');
      return;
    }

    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
        const order = res.data.data;
        if (order.status === 'لغو شده') {
          toast.error('این سفارش منقضی شده است');
          navigate('/profile');
          return;
        }
        if (order.status === 'پرداخت شده') {
          toast.warning('این سفارش قبلاً پرداخت شده است');
          navigate('/profile');
          return;
        }
      }
    } catch (error) {
      console.error('خطا در بررسی سفارش:', error);
      toast.error('خطا در بررسی سفارش');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/orders/${orderId}/confirm-payment`);
      toast.success('پرداخت با موفقیت انجام شد!');
      localStorage.removeItem('discountCode');
      clearCart();
      navigate('/profile');
    } catch (error) {
      console.error('❌ خطا در پرداخت:', error);
      toast.error(error.response?.data?.message || 'خطا در پرداخت');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCard = () => {
    setShowOtp(false);
    setOtp('');
  };

  if (!orderId) return null;

  const displayTotal = finalTotal || totalPrice;

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-3 sm:py-4 md:py-8">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-4xl">
        {/* ===== دکمه برگشت ===== */}
        <Link to="/cart" className="inline-flex items-center gap-1.5 sm:gap-2 text-[#800E2F] hover:text-[#6B0A26] font-medium text-xs sm:text-sm transition mb-4 group">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          بازگشت به سبد خرید
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* ===== فرم پرداخت ===== */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* ===== هدر ===== */}
              <div className="bg-[#800E2F] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm sm:text-base md:text-lg">پرداخت امن</h2>
                    <p className="text-white/70 text-[10px] sm:text-xs">اتصال به درگاه بانکی</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="10" />
                    <path fill="white" d="M8 13.5l-3-3 1.5-1.5L8 10.5l5-5L14.5 7z" />
                  </svg>
                  <span className="text-white text-[10px] sm:text-xs font-medium">امن</span>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                {/* ===== تایمر ===== */}
                {orderStatus === 'در انتظار پرداخت' && orderExpiresAt && (
                  <div className="mb-4 sm:mb-6">
                    <OrderTimer 
                      expiresAt={orderExpiresAt}
                      onExpire={() => {
                        toast.error('زمان پرداخت به پایان رسید');
                        navigate('/profile');
                      }}
                    />
                  </div>
                )}

                {/* ===== کد تخفیف ===== */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">🎫 کد تخفیف</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="مثلاً SUMMER2025"
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
                    />
                    <button
                      onClick={applyDiscountCode}
                      disabled={discountLoading || !orderId}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 bg-[#800E2F] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {discountLoading ? '...' : 'اعمال'}
                    </button>
                  </div>
                  {discountError && <p className="text-xs sm:text-sm text-red-500 mt-1">{discountError}</p>}
                  {appliedDiscount && (
                    <p className="text-xs sm:text-sm text-green-600 mt-1">✅ کد تخفیف {appliedDiscount.code} با موفقیت اعمال شد</p>
                  )}
                  {discountAmount > 0 && (
                    <p className="text-xs sm:text-sm text-green-600 mt-1">💰 مبلغ تخفیف: {formatPrice(discountAmount)} تومان</p>
                  )}
                </div>

                {/* ===== مبلغ قابل پرداخت ===== */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">مبلغ قابل پرداخت</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#800E2F]">{formatPrice(displayTotal)} تومان</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 text-[10px] sm:text-xs text-gray-400">
                    <span>تعداد کالاها: {totalItems} عدد</span>
                  </div>
                </div>

                {/* ===== روش پرداخت ===== */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">روش پرداخت</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl border-2 text-[10px] sm:text-xs md:text-sm font-medium transition flex items-center justify-center gap-1.5 sm:gap-2 ${
                        paymentMethod === 'card' ? 'border-[#800E2F] bg-[#800E2F]/5 text-[#800E2F]' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      کارت بانکی
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl border-2 text-[10px] sm:text-xs md:text-sm font-medium transition flex items-center justify-center gap-1.5 sm:gap-2 ${
                        paymentMethod === 'wallet' ? 'border-[#800E2F] bg-[#800E2F]/5 text-[#800E2F]' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      کیف پول
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('direct')}
                      className={`px-2 sm:px-4 py-2 sm:py-3 rounded-xl border-2 text-[10px] sm:text-xs md:text-sm font-medium transition flex items-center justify-center gap-1.5 sm:gap-2 ${
                        paymentMethod === 'direct' ? 'border-[#800E2F] bg-[#800E2F]/5 text-[#800E2F]' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      پرداخت مستقیم
                    </button>
                  </div>
                </div>

                {/* ===== فرم پرداخت با کارت ===== */}
                {paymentMethod === 'card' && (
                  <>
                    {!showOtp ? (
                      <form onSubmit={(e) => { e.preventDefault(); setShowOtp(true); toast.success('کد تایید به شماره موبایل شما ارسال شد'); }}>
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">شماره کارت</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 font-mono"
                              placeholder="XXXX-XXXX-XXXX-XXXX"
                              dir="ltr"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">تاریخ انقضا</label>
                              <input
                                type="text"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 font-mono"
                                placeholder="MM/YY"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">CVV2</label>
                              <input
                                type="password"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 font-mono"
                                placeholder="***"
                                maxLength="4"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-200">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>اطلاعات کارت شما با رمزنگاری SSL محافظت می‌شود</span>
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3.5 rounded-xl text-white font-bold text-sm sm:text-base transition duration-300 shadow-md flex items-center justify-center gap-2 bg-[#800E2F] hover:bg-[#6B0A26] hover:shadow-xl active:scale-95"
                        >
                          تأیید و دریافت رمز پویا
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleOtpSubmit}>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-4">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-700">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>رمز پویا به شماره موبایل شما ارسال شد</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">رمز پویا</label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 font-mono"
                            placeholder="رمز پویا را وارد کنید"
                            dir="ltr"
                            maxLength="6"
                          />
                        </div>
                        <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                          <button
                            type="button"
                            onClick={handleBackToCard}
                            className="flex-1 py-2.5 sm:py-3 rounded-xl text-gray-700 font-medium border border-gray-300 hover:bg-gray-50 transition text-xs sm:text-sm"
                          >
                            بازگشت
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-2.5 sm:py-3.5 rounded-xl text-white font-bold text-sm sm:text-base transition duration-300 shadow-md flex items-center justify-center gap-2 ${
                              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800E2F] hover:bg-[#6B0A26] hover:shadow-xl active:scale-95'
                            }`}
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                در حال پردازش...
                              </>
                            ) : (
                              'پرداخت نهایی'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}

                {paymentMethod !== 'card' && (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm">در حال حاضر فقط پرداخت با کارت بانکی پشتیبانی می‌شود.</p>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className="mt-3 sm:mt-4 text-[#800E2F] hover:underline text-xs sm:text-sm font-medium"
                    >
                      بازگشت به پرداخت با کارت
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== خلاصه سفارش ===== */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 sticky top-24">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 border-b pb-3 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                خلاصه سفارش
              </h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">تعداد کالاها</span>
                  <span className="font-medium">{totalItems} عدد</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">قیمت کل</span>
                  <span className="font-medium">{formatPrice(totalPrice)} تومان</span>
                </div>
                {discountAmount > 0 && appliedDiscount && (
                  <div className="flex justify-between text-xs sm:text-sm border-t border-gray-200 pt-2">
                    <span className="text-gray-500">تخفیف ({appliedDiscount.code})</span>
                    <span className="font-medium text-red-500">- {formatPrice(discountAmount)} تومان</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">هزینه ارسال</span>
                  <span className="text-green-600 font-medium">رایگان</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-3 mt-3">
                <span className="text-sm sm:text-base font-bold text-gray-800">جمع کل</span>
                <span className="text-lg sm:text-xl font-bold text-[#800E2F]">{formatPrice(displayTotal)} تومان</span>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-200">
                <p className="text-[10px] sm:text-xs text-gray-400 mb-2">محصولات:</p>
                <div className="space-y-1 max-h-28 sm:max-h-32 overflow-y-auto">
                  {cartItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-[10px] sm:text-xs text-gray-600">
                      <span className="truncate max-w-[100px] sm:max-w-[140px]">{item.name}</span>
                      <span>{item.quantity}×</span>
                    </div>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-[9px] sm:text-[10px] text-gray-400">و {cartItems.length - 3} محصول دیگر...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-[10px] sm:text-xs text-gray-400">
            با کلیک روی دکمه پرداخت، شما با <Link to="/terms" className="text-[#800E2F] hover:underline">قوانین و مقررات</Link> فروشگاه موافقت می‌کنید.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;