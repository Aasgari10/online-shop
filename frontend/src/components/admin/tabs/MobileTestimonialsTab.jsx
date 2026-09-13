// src/components/admin/tabs/MobileTestimonialsTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import { useBottomNav } from '../../../context/BottomNavContext';

function MobileTestimonialsTab() {
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return (
          <svg key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-3.5 h-3.5">
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
        );
      } else {
        return (
          <svg key={i} className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
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
      if (res.data.success) setTestimonials(res.data.data);
    } catch (error) {
      toast.error('خطا در دریافت نظرات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const filteredTestimonials = testimonials.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id) => {
    console.log('🔄 [MobileTestimonialsTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredTestimonials.length && filteredTestimonials.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileTestimonialsTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredTestimonials.map(item => item.id);
      setSelectedItems(ids);
      setSelectAll(true);
      console.log('📊 همه انتخاب شدند:', ids.length);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileTestimonialsTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} نظر...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/testimonials/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} نظر با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      await fetchTestimonials();
    } catch (error) {
      console.error('❌ [MobileTestimonialsTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی نظرات');
    } finally {
      setBatchLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rating: 5,
      comment: '',
      product: '',
      is_active: true,
      order_index: 0,
      date: new Date().toLocaleDateString('fa-IR')
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item) => {
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
    setShowForm(true);
    hideBottomNav();
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
        toast.success('نظر ویرایش شد');
      } else {
        await api.post('/admin/testimonials', formData);
        toast.success('نظر اضافه شد');
      }
      resetForm();
      await fetchTestimonials();
      showBottomNav();
    } catch (error) {
      console.error('❌ [MobileTestimonialsTab] خطا در ذخیره:', error);
      toast.error(error.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این نظر مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      toast.success('نظر به سطل زباله منتقل شد');
      await fetchTestimonials();
    } catch (error) {
      toast.error('خطا در حذف');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/testimonials/${id}`, { is_active: !currentStatus });
      toast.success('وضعیت تغییر کرد');
      await fetchTestimonials();
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="pb-4">
      {/* سرتیتر */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          📝 نظرات صفحه اصلی
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <button
          onClick={() => { setShowForm(true); hideBottomNav(); }}
          className="px-3 py-1.5 bg-[#800E2F] text-white rounded-xl text-sm font-medium hover:bg-[#6B0A26] transition"
        >
          ➕ جدید
        </button>
      </div>

      {/* جستجو */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نظر..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* انتخاب همه */}
      {filteredTestimonials.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredTestimonials.length})</span>
        </div>
      )}

      {/* نوار عملیات گروهی */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="px-2 py-1 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            🗑️ حذف
          </button>
        </div>
      )}

      {/* فرم افزودن/ویرایش */}
      {showForm && (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">{editingItem ? '✏️ ویرایش نظر' : '➕ نظر جدید'}</h3>
            <button onClick={() => { resetForm(); showBottomNav(); }} className="text-gray-400 text-xl">&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="نام *"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              required
            />
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-700">امتیاز:</span>
              {[1,2,3,4,5].map(star => (
                <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})} className="text-xl">
                  <span className={star <= formData.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                </button>
              ))}
            </div>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              rows="3"
              placeholder="متن نظر *"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              required
            />
            <input
              type="text"
              value={formData.product}
              onChange={(e) => setFormData({...formData, product: e.target.value})}
              placeholder="محصول (اختیاری)"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
            <input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
              placeholder="ترتیب نمایش"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-[#800E2F]"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">فعال</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {submitting ? 'در حال ذخیره...' : '💾 ذخیره'}
              </button>
              <button type="button" onClick={() => { resetForm(); showBottomNav(); }} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* لیست نظرات */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">نظری یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTestimonials.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">{item.name}</span>
                        <div className="flex items-center gap-0.5">{renderStars(item.rating)}</div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.comment}</p>
                      {item.product && <p className="text-[10px] text-gray-400">محصول: {item.product}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button onClick={() => toggleStatus(item.id, item.is_active)} className="px-2 py-0.5 text-[9px] bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                        {item.is_active ? 'غیرفعال' : 'فعال'}
                      </button>
                      <button onClick={() => handleEdit(item)} className="px-2 py-0.5 text-[9px] bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="px-2 py-0.5 text-[9px] bg-red-50 text-red-500 rounded hover:bg-red-100">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog حذف گروهی */}
      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی نظرات"
        message={`آیا از حذف ${selectedItems.length} نظر انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />
    </div>
  );
}

export default MobileTestimonialsTab;