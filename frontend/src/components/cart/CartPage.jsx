// src/components/cart/CartPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';
import AddressModal from './AddressModal';
import api from '../../services/api';

// ✅ تابع تولید متن کامل ویژگی‌ها (بدون پرانتز اضافی)
const getVariationText = (item) => {
  const parts = [];
  
  if (item.color_name) {
    parts.push(`رنگ: ${item.color_name}`);
  }
  if (item.size_name) {
    parts.push(`سایز: ${item.size_name}`);
  }
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

function CartPage() {
  const { cartItems, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountCodeId, setDiscountCodeId] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // ===== محاسبه مجموع تخفیف‌ها =====
  const totalDiscount = cartItems.reduce((sum, item) => {
    const originalPrice = item.original_price || item.price;
    const discountPerItem = originalPrice - item.price;
    return sum + discountPerItem * item.quantity;
  }, 0);

  // ===== محاسبه قیمت کل بدون تخفیف =====
  const totalOriginalPrice = cartItems.reduce((sum, item) => {
    const originalPrice = item.original_price || item.price;
    return sum + originalPrice * item.quantity;
  }, 0);

  useEffect(() => {
    const savedDiscount = localStorage.getItem('discountCode');
    if (savedDiscount) {
      try {
        const data = JSON.parse(savedDiscount);
        setDiscountCodeId(data.id);
        setDiscountAmount(data.amount);
      } catch (e) {
        console.error('خطا در خواندن کد تخفیف:', e);
      }
    }
  }, []);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('سبد خرید خالی است!');
      return;
    }
    setShowAddressModal(true);
  };

  const handleAddressSubmit = async (addressId) => {
    if (!addressId) {
      toast.error('لطفاً آدرس را انتخاب کنید');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: cartItems.map(item => ({
          id: Number(item.id),
          quantity: Number(item.quantity),
          price: Number(item.price),
          color_value_id: item.color_value_id ? Number(item.color_value_id) : null,
          size_value_id: item.size_value_id ? Number(item.size_value_id) : null,
          variation_id: item.variation_id || item.variationId ? Number(item.variation_id || item.variationId) : null,
          attribute_values_json: item.attribute_values_json || null,
        })),
        addressId: Number(addressId),
        discountCodeId: discountCodeId ? Number(discountCodeId) : null,
        discountAmount: Number(discountAmount) || 0,
      };

      const response = await api.post('/orders', payload);
      if (response.data.success) {
        const orderId = response.data.orderId;
        toast.success('سفارش با موفقیت ثبت شد');
        localStorage.removeItem('discountCode');
        navigate('/payment', { state: { orderId } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ثبت سفارش');
    } finally {
      setLoading(false);
      setShowAddressModal(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="relative flex items-center justify-between mb-4">
            <div className="absolute left-1/2 transform -translate-x-1/2 mb-11 text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 relative inline-block pb-3">
                🛒 سبد خرید
                <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F] shadow-md shadow-[#800E2F]/30"></span>
              </h1>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">سبد خرید خالی است</h2>
            <p className="text-gray-500 mb-8">هنوز کالایی به سبد خرید اضافه نکرده‌اید.</p>
            <Link to="/shop" className="inline-block bg-[#800E2F] hover:bg-[#6B0A26] text-white px-8 py-3 rounded-xl font-medium transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              🛍️ شروع خرید
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="relative flex items-center justify-between mb-4">
          <div className="absolute left-1/2 transform -translate-x-1/2 mb-11 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 relative inline-block pb-3">
              🛒 سبد خرید
              <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F] shadow-md shadow-[#800E2F]/30"></span>
            </h1>
            {totalItems > 0 && (
              <p className="text-gray-500 text-sm mt-0">{totalItems} کالا در سبد خرید شما</p>
            )}
          </div>
          <div className="mr-auto">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-[#800E2F] hover:text-[#6B0A26] font-medium transition group whitespace-nowrap"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              ادامه خرید
            </Link>
          </div>
          <div className="invisible"> </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-[#800E2F]/5 border-b border-gray-200 text-sm font-medium text-gray-600">
                <div className="col-span-5">محصول</div>
                <div className="col-span-2 text-center flex items-center justify-center gap-1 whitespace-nowrap">
                  <span>قیمت واحد</span>
                  <span className="text-[10px] text-gray-400 font-light">(تومان)</span>
                </div>
                <div className="col-span-2 text-center">تعداد</div>
                <div className="col-span-2 text-center">جمع</div>
                <div className="col-span-1 text-center">حذف</div>
              </div>

              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const variationText = getVariationText(item);
                  const itemOriginalPrice = item.original_price || item.price;
                  const itemDiscount = (itemOriginalPrice - item.price) * item.quantity;

                  return (
                    <div key={`${item.id}-${item.variation_id || item.variationId}`} className="p-4 md:p-6">
                      <div className="flex flex-col md:grid md:grid-cols-12 md:gap-4 items-start md:items-center">
                        <div className="flex items-center gap-4 md:col-span-5 w-full">
                          <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                            {item.image_url ? (
                              <img src={`${item.image_url}`} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">بدون تصویر</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-bold text-gray-800 line-clamp-1">
                              {item.name}
                            </h3>
                            {variationText && (
                              <div className="text-right text-[10px] md:text-xs text-gray-500 mt-1 break-words">
                                {variationText}
                              </div>
                            )}
                            {/* نمایش تخفیف هر آیتم */}
                            {itemDiscount > 0 && (
                              <div className="text-xs text-green-600 mt-0.5">
                                تخفیف: {formatPrice(itemDiscount)} تومان
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2 text-center w-full mt-3 md:mt-0 flex justify-between md:justify-center items-center">
                          <span className="text-gray-500 text-sm md:hidden">قیمت واحد:</span>
                          <div className="flex flex-col items-end">
                            {item.original_price && item.original_price > item.price && (
                              <span className="text-xs text-gray-400 line-through">{formatPrice(item.original_price)}</span>
                            )}
                            <span className="text-sm font-medium text-gray-700">{formatPrice(item.price)}</span>
                          </div>
                        </div>

                        <div className="md:col-span-2 text-center w-full mt-3 md:mt-0 flex justify-between md:justify-center items-center">
                          <span className="text-gray-500 text-sm md:hidden">تعداد:</span>
                          <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                          </span>
                        </div>

                        <div className="md:col-span-2 text-center w-full mt-3 md:mt-0 flex justify-between md:justify-center items-center">
                          <span className="text-gray-500 text-sm md:hidden">جمع:</span>
                          <span className="text-base font-bold text-[#800E2F]">{formatPrice(item.price * item.quantity)}</span>
                        </div>

                        <div className="md:col-span-1 text-center w-full mt-3 md:mt-0 flex justify-center items-center">
                          <button
                            onClick={() => {
                              removeFromCart(item.id, item.variation_id || item.variationId);
                              toast.success(`${item.name} از سبد خرید حذف شد`);
                            }}
                            className="text-red-400 hover:text-red-600 transition p-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 md:px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    if (window.confirm('آیا از خالی کردن سبد خرید مطمئن هستید؟')) {
                      clearCart();
                      toast.success('سبد خرید خالی شد');
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm font-medium transition flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  خالی کردن سبد خرید
                </button>
                <div className="text-sm text-gray-400">{cartItems.length} کالا در سبد خرید</div>
              </div>
            </div>
          </div>

          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                خلاصه سفارش
              </h2>
              <div className="space-y-3 py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">تعداد کالاها</span>
                  <span className="font-medium text-gray-800">{totalItems} عدد</span>
                </div>
                
                {/* ✅ قیمت کل بدون تخفیف */}
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">قیمت کل بدون تخفیف</span>
                    <span className="font-medium text-gray-400 line-through">{formatPrice(totalOriginalPrice)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">قیمت کل</span>
                  <span className="font-medium text-gray-800">{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">هزینه ارسال</span>
                  <span className="font-medium text-green-600">رایگان</span>
                </div>
                
                {/* ✅ تخفیف کل */}
                <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                  <span className="text-gray-500">تخفیف</span>
                  <span className="font-medium text-red-500">- {formatPrice(totalDiscount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-2">
                <span className="text-lg font-bold text-gray-800">جمع کل</span>
                <span className="text-xl font-bold text-[#800E2F]">{formatPrice(totalPrice)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-[#800E2F] hover:bg-[#6B0A26] text-white py-3.5 rounded-xl font-bold text-base transition duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
              >
                🚀 ثبت سفارش نهایی
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">با ثبت سفارش، اطلاعات شما برای پردازش ارسال می‌شود.</p>
            </div>
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onConfirm={handleAddressSubmit}
        loading={loading}
      />
    </div>
  );
}

export default CartPage;