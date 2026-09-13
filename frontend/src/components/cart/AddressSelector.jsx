// src/components/cart/AddressSelector.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';

function AddressSelector({ selectedAddressId, onAddressSelect, onAddressChange, compact = false }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    province: '',
    city: '',
    address: '',
    postal_code: '',
    phone: '',
    receiver_name: '',
    is_default: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      if (res.data.success) {
        setAddresses(res.data.data);
        if (!selectedAddressId && res.data.data.length > 0) {
          const defaultAddr = res.data.data.find(a => a.is_default) || res.data.data[0];
          onAddressSelect(defaultAddr.id);
        }
      }
    } catch (error) {
      toast.error('خطا در دریافت آدرس‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.province || !formData.city || !formData.address) {
      toast.error('استان، شهر و آدرس الزامی هستند');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/addresses', formData);
      if (res.data.success) {
        toast.success('آدرس با موفقیت اضافه شد');
        setShowForm(false);
        setFormData({
          province: '',
          city: '',
          address: '',
          postal_code: '',
          phone: '',
          receiver_name: '',
          is_default: false,
        });
        await fetchAddresses();
        onAddressSelect(res.data.data.id);
        if (onAddressChange) onAddressChange(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در افزودن آدرس');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('آدرس حذف شد');
      await fetchAddresses();
      if (selectedAddressId === id) {
        onAddressSelect(null);
      }
    } catch (error) {
      toast.error('خطا در حذف آدرس');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/default`);
      toast.success('آدرس پیش‌فرض تنظیم شد');
      await fetchAddresses();
    } catch (error) {
      toast.error('خطا در تنظیم آدرس پیش‌فرض');
    }
  };

  if (loading) return <Spinner size="sm" />;

  return (
    <div className={compact ? 'space-y-2' : 'bg-white rounded-xl border border-gray-200 p-3 sm:p-4'}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            آدرس تحویل
          </h4>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs sm:text-sm text-[#800E2F] hover:text-[#6B0A26] font-medium transition"
          >
            {showForm ? '✕ لغو' : '➕ افزودن آدرس جدید'}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">استان *</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="مثلاً تهران"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">شهر *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="مثلاً تهران"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">آدرس کامل *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="2"
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="خیابان، پلاک، واحد..."
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">کد پستی</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="کد پستی"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">تلفن</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="تلفن تماس"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">نام گیرنده</label>
              <input
                type="text"
                value={formData.receiver_name}
                onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="نام شخص تحویل‌گیرنده"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
            />
            <label htmlFor="is_default" className="text-xs sm:text-sm text-gray-700">آدرس پیش‌فرض</label>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50"
          >
            {submitting ? 'در حال ثبت...' : '💾 ثبت آدرس'}
          </button>
        </form>
      )}

      {addresses.length === 0 ? (
        <p className="text-gray-500 text-xs sm:text-sm py-4 text-center">هیچ آدرسی ثبت نشده است. لطفاً یک آدرس اضافه کنید.</p>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border rounded-lg p-2 sm:p-3 cursor-pointer transition ${
                selectedAddressId === addr.id
                  ? 'border-[#800E2F] bg-[#800E2F]/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onAddressSelect(addr.id)}
            >
              {/* ===== ردیف وضعیت‌ها + دکمه حذف ===== */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5 sm:mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {addr.is_default && (
                    <span className="text-[10px] bg-[#800E2F] text-white px-2 py-0.5 rounded-full">پیش‌فرض</span>
                  )}
                  {selectedAddressId === addr.id && (
                    <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">انتخاب‌شده</span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                  className="text-[10px] text-red-500 hover:text-red-700 transition bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full"
                >
                  🗑️ حذف
                </button>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-xs sm:text-sm">{addr.receiver_name || 'گیرنده'}</span>
                  </div>
                  
                  {/* ===== آدرس کامل با بک‌گراند ملایم ===== */}
                  <div className="bg-gray-50/80 rounded-lg px-2 py-1">
                    <p className="text-[10px] sm:text-xs text-gray-600">{addr.address}</p>
                  </div>
                  
                  {/* ===== استان و شهر با بک‌گراند ملایم ===== */}
                  <div className="bg-blue-50/60 rounded-lg px-2 py-1">
                    <p className="text-[10px] sm:text-xs text-gray-600">{addr.province}، {addr.city}</p>
                  </div>
                  
                  {/* ===== کد پستی و تلفن با بک‌گراند ملایم ===== */}
                  {(addr.postal_code || addr.phone) && (
                    <div className="bg-gray-50/80 rounded-lg px-2 py-1">
                      <p className="text-[9px] sm:text-[10px] text-gray-500">
                        {addr.postal_code && `کد پستی: ${addr.postal_code}`}
                        {addr.postal_code && addr.phone && ' | '}
                        {addr.phone && `تلفن: ${addr.phone}`}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* ===== دکمه پیش‌فرض ===== */}
                {!addr.is_default && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDefault(addr.id); }}
                    className="flex-shrink-0 mr-2 text-[9px] sm:text-[10px] text-blue-500 hover:text-blue-700 transition"
                  >
                    ⭐ پیش‌فرض
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressSelector; 