// src/components/admin/modals/BatchEditFeaturedModal.jsx
import { useState } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';

function BatchEditFeaturedModal({ isOpen, onClose, items, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    discount_percent: '',
    end_time: null,
    order_index: '',
  });

  // ===== اعمال ویرایش گروهی =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hasChanges = formData.discount_percent !== '' || formData.end_time !== null || formData.order_index !== '';
    
    if (!hasChanges) {
      toast.error('حداقل یک فیلد را برای ویرایش انتخاب کنید');
      return;
    }

    setLoading(true);
    try {
      const updatePromises = items.map(async (item) => {
        const id = item.featured_id || item.id;
        const updateData = {};
        
        if (formData.discount_percent !== '') {
          updateData.discount_percent = parseFloat(formData.discount_percent);
        }
        if (formData.end_time !== null) {
          updateData.end_time = formData.end_time.getTime();
        }
        if (formData.order_index !== '') {
          updateData.order_index = parseInt(formData.order_index);
        }

        await api.put(`/admin/featured/${id}`, updateData);
      });

      await Promise.all(updatePromises);
      
      toast.success(`${items.length} تخفیف با موفقیت ویرایش شدند`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ خطا در ویرایش گروهی تخفیف‌ها:', error);
      toast.error('خطا در ویرایش گروهی تخفیف‌ها');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ ویرایش گروهی تخفیف‌ها" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-bold">{items.length}</span> تخفیف انتخاب‌شده
          </p>
        </div>

        {/* ===== تغییر درصد تخفیف ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            درصد تخفیف جدید
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.discount_percent}
            onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
            placeholder="مثلاً 20 (خالی = بدون تغییر)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
          />
        </div>

        {/* ===== تغییر زمان پایان ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            زمان پایان تخفیف
          </label>
          <SimplePersianDatePicker
            value={formData.end_time}
            onChange={(date) => setFormData({ ...formData, end_time: date })}
            className="w-full"
          />
          <p className="text-xs text-gray-400 mt-1">در صورت خالی گذاشتن، تخفیف نامحدود خواهد بود.</p>
        </div>

        {/* ===== تغییر ترتیب نمایش ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ترتیب نمایش
          </label>
          <input
            type="number"
            min="0"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
            placeholder="عدد بزرگتر = نمایش در ابتدا"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
          />
        </div>

        {/* ===== دکمه‌ها ===== */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            💾 اعمال تغییرات
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

export default BatchEditFeaturedModal;