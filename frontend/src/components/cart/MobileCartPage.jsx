// src/components/cart/MobileCartPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';
import AddressModal from './AddressModal';
import api from '../../services/api';

// ✅ تابع تولید متن کامل ویژگی‌ها (همانند نسخه دسکتاپ)
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

function MobileCartPage() {
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

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  };

  const renderHeader = () => (
    <div className="sticky top-0 z-30 bg-[#E8DCC8] px-4 py-2 flex items-center justify-center border-b border-gray-200/60">
      <h1 className="text-lg md:text-xl font-bold text-gray-800 relative inline-block pb-2">
        سبد خرید
        <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
      </h1>
    </div>
  );

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#E8DCC8]">
        {renderHeader()}
        <div className="flex items-center justify-center px-4 py-0" style={{ minHeight: 'calc(10vh - 56px)' }}>
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
            <div className="w-24 h-24 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">سبد خرید خالی است</h2>
            <p className="text-sm md:text-base text-gray-500 mb-6">هنوز کالایی به سبد خرید اضافه نکرده‌اید.</p>
            <Link to="/shop" className="inline-block bg-[#800E2F] hover:bg-[#6B0A26] text-white px-8 py-3 rounded-xl text-base font-medium transition">
              🛍️ شروع خرید
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DCC8]">
      {renderHeader()}

      <div className="mx-1 mt-1 space-y-3 pb-4">
        {cartItems.map((item) => {
          const variationText = getVariationText(item);
          const itemOriginalPrice = item.original_price || item.price;
          const itemDiscount = (itemOriginalPrice - item.price) * item.quantity;

          return (
            <div
              key={`${item.id}-${item.variation_id || item.variationId}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border border-gray-100/80 group flex flex-row items-stretch h-[130px] relative"
            >
              <div className="flex-shrink-0 w-[130px] h-[130px] bg-gray-50 overflow-hidden relative">
                {item.image_url ? (
                  <img
                    src={getImageUrl(item.image_url)}
                    alt={item.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                    onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-100">
                    بدون تصویر
                  </div>
                )}
              </div>

              <div className="flex-1 p-2 pr-3 text-right flex flex-col h-full min-h-0">
                <div className="flex-1 min-h-0">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#800E2F] transition">
                    {item.name}
                  </h3>
                  {variationText && (
                    <div className="text-right text-[10px] text-gray-500 mt-1 break-words">
                      {variationText}
                    </div>
                  )}
                  {/* نمایش تخفیف هر آیتم */}
                  {itemDiscount > 0 && (
                    <div className="text-[9px] text-green-600 mt-0.5">
                      تخفیف: {formatPrice(itemDiscount)} ت
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">کد: #{item.id}</p>
                </div>

                <div className="flex-shrink-0">
                  <div className="flex items-center justify-between -mb-1">
                    <div className="flex flex-col items-end">
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-[8px] text-gray-400 line-through">
                          {formatPrice(item.original_price)} ت
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-[#800E2F]">
                        {formatPrice(item.price * item.quantity)} تومان
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">تعداد: {item.quantity}</span>
                      <button
                        onClick={() => {
                          removeFromCart(item.id, item.variation_id || item.variationId);
                          toast.success(`${item.name} از سبد خرید حذف شد`);
                        }}
                        className="p-0.5 rounded-full hover:bg-gray-100 transition"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {cartItems.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('آیا از خالی کردن سبد خرید مطمئن هستید؟')) {
                clearCart();
                toast.success('سبد خرید خالی شد');
              }
            }}
            className="w-full py-3 bg-white/80 text-red-500 rounded-2xl text-sm font-medium border border-red-200 hover:bg-red-50 transition"
          >
            🗑️ خالی کردن سبد خرید
          </button>
        )}

        <div className="bg-white border-t border-gray-200 shadow-lg p-4 mt-4 rounded-2xl">
          {/* ✅ قیمت کل بدون تخفیف */}
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">قیمت کل بدون تخفیف</span>
              <span className="text-xs text-gray-400 line-through">{formatPrice(totalOriginalPrice)} تومان</span>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm md:text-base font-medium text-gray-600">جمع کل:</span>
            <span className="text-base md:text-lg font-bold text-[#800E2F]">{formatPrice(totalPrice)} تومان</span>
          </div>
          
          {/* ✅ تخفیف کل */}
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">تخفیف</span>
              <span className="text-xs font-bold text-red-500">- {formatPrice(totalDiscount)} تومان</span>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={handleCheckout}
              className="flex-1 py-3.5 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-xl font-bold text-sm transition active:scale-95"
            >
              🚀 ثبت سفارش
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition"
            >
              ادامه خرید
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">با ثبت سفارش، اطلاعات شما برای پردازش ارسال می‌شود.</p>
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

export default MobileCartPage;