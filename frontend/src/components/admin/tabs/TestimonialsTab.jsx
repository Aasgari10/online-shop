// src/components/admin/tabs/TestimonialsTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import PageHeader from '../../shared/PageHeader';

function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    comment: '',
    product: '',
    is_active: true,
    order_index: 0,
    date: new Date().toLocaleDateString('fa-IR')
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ===== تابع رندر ستاره‌ها با پشتیبانی از نیم‌ستاره (قرینه - RTL) =====
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return (
          <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-4 h-4">
            <svg className="absolute top-0 right-0 w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <svg className="absolute top-0 right-0 w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
        );
      } else {
        return (
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    });
  };

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/testimonials');
      if (res.data.success) {
        setTestimonials(res.data.data);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت نظرات:', error);
      toast.error('خطا در دریافت نظرات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        rating: item.rating || 5,
        comment: item.comment || '',
        product: item.product || '',
        is_active: item.is_active !== undefined ? item.is_active : true,
        order_index: item.order_index || 0,
        date: item.date || new Date().toLocaleDateString('fa-IR')
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        rating: 5,
        comment: '',
        product: '',
        is_active: true,
        order_index: 0,
        date: new Date().toLocaleDateString('fa-IR')
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.comment.trim()) {
      toast.error('نام و متن نظر الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/admin/testimonials/${editingItem.id}`, formData);
        toast.success('نظر با موفقیت ویرایش شد');
      } else {
        await api.post('/admin/testimonials', formData);
        toast.success('نظر با موفقیت ایجاد شد');
      }
      setShowModal(false);
      fetchTestimonials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ذخیره نظر');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/testimonials/${deleteTarget}`);
      toast.success('نظر به سطل زباله منتقل شد');
      fetchTestimonials();
    } catch (error) {
      toast.error('خطا در حذف نظر');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/testimonials/${id}`, { is_active: !currentStatus });
      toast.success('وضعیت نظر تغییر کرد');
      fetchTestimonials();
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-0 m-0">
      <PageHeader 
        title="📝 نظرات صفحه اصلی" 
        subtitle="مدیریت نظرات نمایش داده شده در صفحه اصلی" 
        className="mb-1 mt-2"
      />

      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => handleOpenModal()}
          className="px-3 py-2 bg-[#800E2F] mr-2 pr-1.5 text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
        >
          ➕ افزودن نظر جدید
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              <th className="text-right py-2 px-3">نام</th>
              <th className="text-right py-2 px-3">امتیاز</th>
              <th className="text-right py-2 px-3">نظر</th>
              <th className="text-right py-2 px-3">محصول</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">ترتیب</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">
                  هیچ نظری یافت نشد
                </td>
              </tr>
            ) : (
              testimonials.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-800">{item.name}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-0.5">
                      {renderStars(item.rating)}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{item.comment}</td>
                  <td className="py-2 px-3 text-gray-500">{item.product || '—'}</td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => toggleStatus(item.id, item.is_active)}
                      className={`text-xs px-2 py-1 rounded-full transition ${
                        item.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {item.is_active ? '✅ فعال' : '❌ غیرفعال'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-gray-500">{item.order_index}</td>
                  <td className="py-2 px-3 flex gap-1.5">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition"
                    >
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? '✏️ ویرایش نظر' : '➕ افزودن نظر جدید'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">امتیاز</label>
              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="text-2xl transition-colors"
                  >
                    <span className={star <= formData.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">متن نظر *</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">محصول (اختیاری)</label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="نام محصول"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ترتیب نمایش</label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#800E2F]"
              />
              فعال
            </label>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button type="submit" variant="primary" loading={submitting} className="flex-1">
              {editingItem ? '💾 ذخیره تغییرات' : '➕ افزودن نظر'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              انصراف
            </Button>
          </div>
        </form>
      </Modal>

      <CustomConfirm
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="⚠️ حذف نظر"
        message="آیا از انتقال این نظر به سطل زباله مطمئن هستید؟"
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
      />
    </div>
  );
}

export default TestimonialsTab;