// src/components/admin/modals/BatchDiscountModal.jsx
import { useState } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';

function BatchDiscountModal({ isOpen, onClose, products, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [endTime, setEndTime] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const discount = parseFloat(discountPercent);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      toast.error('درصد تخفیف باید بین ۱ تا ۱۰۰ باشد');
      return;
    }

    setLoading(true);
    try {
      const promises = products.map(async (product) => {
        // ۱. دریافت اطلاعات کامل محصول
        const productRes = await api.get(`/products/${product.id}`);
        const currentProduct = productRes.data.data;
        const originalPrice = currentProduct.price;
        const discountedPrice = Math.round(originalPrice * (1 - discount / 100));

        // ۲. به‌روزرسانی قیمت محصول
        await api.put(`/products/${product.id}`, {
          name: currentProduct.name,
          description: currentProduct.description,
          price: discountedPrice,
          stock: currentProduct.stock,
          category_id: currentProduct.category_id,
        });

        // ۳. ثبت تخفیف در جدول featured_products
        const featuredRes = await api.get('/admin/featured');
        const existing = featuredRes.data.data.find(
          f => f.product_id === product.id && f.type === 'discount'
        );

        const endTimeValue = endTime ? endTime.getTime() : null;

        if (existing) {
          await api.put(`/admin/featured/${existing.id}`, {
            discount_percent: discount,
            original_price: originalPrice,
            end_time: endTimeValue,
            order_index: 0,
          });
        } else {
          await api.post('/admin/featured', {
            product_id: product.id,
            type: 'discount',
            discount_percent: discount,
            original_price: originalPrice,
            end_time: endTimeValue,
            order_index: 0,
          });
        }
      });

      await Promise.all(promises);
      toast.success(`تخفیف ${discount}٪ با موفقیت به ${products.length} محصول اعمال شد`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ خطا در اعمال تخفیف گروهی:', error);
      toast.error('خطا در اعمال تخفیف گروهی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏷️ اعمال تخفیف گروهی" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-bold">{products.length}</span> محصول انتخاب‌شده
          </p>
        </div>

        {/* ===== درصد تخفیف ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            درصد تخفیف *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            placeholder="مثلاً ۲۰"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
            required
          />
          <p className="text-xs text-gray-400 mt-1">درصد تخفیف برای همه محصولات انتخاب‌شده اعمال خواهد شد.</p>
        </div>

        {/* ===== زمان پایان ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            زمان پایان تخفیف (اختیاری)
          </label>
          <SimplePersianDatePicker
            value={endTime}
            onChange={setEndTime}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">در صورت خالی گذاشتن، تخفیف نامحدود خواهد بود.</p>
        </div>

        {/* ===== پیش‌نمایش قیمت جدید ===== */}
        {discountPercent && products.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">پیش‌نمایش قیمت جدید:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {products.slice(0, 5).map((p) => {
                const newPrice = Math.round(p.price * (1 - parseFloat(discountPercent) / 100));
                return (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{p.name}</span>
                    <span>
                      <span className="line-through text-gray-400 ml-2">{formatPrice(p.price)}</span>
                      <span className="text-[#800E2F] font-bold">{formatPrice(newPrice)} ت</span>
                    </span>
                  </div>
                );
              })}
              {products.length > 5 && (
                <p className="text-xs text-gray-400">و {products.length - 5} محصول دیگر...</p>
              )}
            </div>
          </div>
        )}

        {/* ===== دکمه‌ها ===== */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            💾 اعمال تخفیف
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            انصراف
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// تابع کمکی برای فرمت قیمت (در صورت عدم وجود import)
const formatPrice = (price) => {
  return Math.round(price).toLocaleString('en-US');
};

export default BatchDiscountModal;