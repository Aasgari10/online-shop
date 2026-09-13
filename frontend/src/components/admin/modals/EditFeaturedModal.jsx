// src/components/admin/modals/EditFeaturedModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import api from '../../../services/api';
import toast from 'react-hot-toast';

function EditFeaturedModal({ isOpen, onClose, item, onSave }) {
  const [discountPercent, setDiscountPercent] = useState('');
  const [endDate, setEndDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      console.log('🔵 [EditFeaturedModal] مودال باز شد با item:', item);
      console.log('🔵 [EditFeaturedModal] item.featured_id:', item.featured_id);
      console.log('🔵 [EditFeaturedModal] item.id:', item.id);

      setDiscountPercent(item.discount_percent?.toString() || '');
      setEndDate(item.end_time ? new Date(item.end_time) : null);
    }
  }, [isOpen, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔵 [EditFeaturedModal] handleSubmit اجرا شد');
    console.log('🔵 [EditFeaturedModal] item:', item);
    console.log('🔵 [EditFeaturedModal] discountPercent:', discountPercent);
    console.log('🔵 [EditFeaturedModal] endDate:', endDate);

    if (!discountPercent || parseFloat(discountPercent) <= 0 || parseFloat(discountPercent) > 100) {
      toast.error('درصد تخفیف باید بین ۱ تا ۱۰۰ باشد');
      return;
    }

    setSubmitting(true);

    try {
      const featuredId = item.featured_id || item.id;
      console.log('🔵 [EditFeaturedModal] featuredId نهایی:', featuredId);

      const payload = {
        discount_percent: parseFloat(discountPercent),
        end_time: endDate ? endDate.getTime() : null,
      };

      console.log('🔵 [EditFeaturedModal] ارسال درخواست PUT به /admin/featured/' + featuredId);
      console.log('🔵 [EditFeaturedModal] payload:', payload);

      await onSave(featuredId, payload);

      onClose();
    } catch (error) {
      console.error('🔴 [EditFeaturedModal] خطا در ویرایش:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ ویرایش تخفیف" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">محصول</label>
            <div className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-gray-400 ml-2">(ID: {item.product_id})</span>
            </div>
          </div>

          {item.variation_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700">ترکیب انتخاب‌شده</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium">ترکیب #{item.variation_id}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">درصد تخفیف جدید *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => {
                console.log('🔄 [EditFeaturedModal] onChange مقدار جدید:', e.target.value);
                setDiscountPercent(e.target.value);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              required
            />
            <p className="text-xs text-gray-400 mt-1">مقدار فعلی: {item.discount_percent}%</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان جدید (اختیاری)</label>
            <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-full" />
            {item.end_time && (
              <p className="text-xs text-gray-400 mt-1">فعلی: {new Date(item.end_time).toLocaleDateString('fa-IR')}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" variant="primary" loading={submitting} className="flex-1">
              💾 ذخیره تغییرات
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              انصراف
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default EditFeaturedModal;