// src/components/admin/modals/MobileEditFeaturedModal.jsx
import { useState, useEffect } from 'react';
import { useBottomNav } from '../../../context/BottomNavContext';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import Button from '../../shared/Button';

function MobileEditFeaturedModal({ isOpen, onClose, item, onSave }) {
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [discountPercent, setDiscountPercent] = useState('');
  const [endDate, setEndDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setDiscountPercent(item.discount_percent?.toString() || '');
      setEndDate(item.end_time ? new Date(item.end_time) : null);
    }
  }, [item]);

  const getVariationLabel = (variation) => {
    if (!variation) return 'همه ترکیبات';
    const attrs = variation.attribute_values || {};
    let label = '';
    if (attrs['1']) label += `رنگ: ${attrs['1']}`;
    if (variation.color_name) label += label ? ` - ${variation.color_name}` : `رنگ: ${variation.color_name}`;
    if (variation.size_name) label += label ? ` - سایز: ${variation.size_name}` : `سایز: ${variation.size_name}`;
    for (const [key, value] of Object.entries(attrs)) {
      if (key !== '1' && key !== 'price' && key !== 'stock') {
        label += label ? ` - ${key}: ${value}` : `${key}: ${value}`;
      }
    }
    if (!label) label = `ترکیب #${variation.id}`;
    return label;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!discountPercent || parseFloat(discountPercent) <= 0 || parseFloat(discountPercent) > 100) {
      alert('درصد تخفیف باید بین ۱ تا ۱۰۰ باشد');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        discount_percent: parseFloat(discountPercent),
        end_time: endDate ? endDate.getTime() : null,
      };
      await onSave(item.featured_id || item.id, payload);
      onClose();
    } catch (error) {
      // خطا در onSave مدیریت می‌شود
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">✏️ ویرایش تخفیف</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* نمایش محصول */}
          <div>
            <label className="block text-sm font-medium text-gray-700">محصول</label>
            <div className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-gray-400 ml-2">(ID: {item.product_id})</span>
            </div>
          </div>

          {/* نمایش ترکیب */}
          {item.variation_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700">ترکیب</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                <span className="font-medium">{getVariationLabel(item.cheapest_variation || {})}</span>
              </div>
            </div>
          )}

          {/* درصد تخفیف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">درصد تخفیف جدید *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              required
            />
            <p className="text-xs text-gray-400 mt-1">فعلی: {item.discount_percent}%</p>
          </div>

          {/* تاریخ پایان */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان جدید (اختیاری)</label>
            <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-full" />
            {item.end_time && (
              <p className="text-xs text-gray-400 mt-1">فعلی: {new Date(item.end_time).toLocaleDateString('fa-IR')}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50"
            >
              {submitting ? 'در حال ذخیره...' : '💾 ذخیره'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MobileEditFeaturedModal;