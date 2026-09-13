// src/components/admin/modals/MobileAddBannerModal.jsx
import { useState, useEffect } from 'react';
import { useBottomNav } from '../../../context/BottomNavContext';

function MobileAddBannerModal({ isOpen, onClose, onSave }) {
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [position, setPosition] = useState('home');
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      hideBottomNav();
    } else {
      showBottomNav();
    }
    return () => showBottomNav();
  }, [isOpen, hideBottomNav, showBottomNav]);

  // ریست فرم هنگام بسته شدن
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setLink('');
      setPosition('home');
      setIsActive(true);
      setFile(null);
      setPreview(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('لطفاً یک تصویر برای بنر انتخاب کنید');
      return;
    }
    setLoading(true);
    onSave({ title, link, position, is_active: isActive, file })
      .finally(() => setLoading(false));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 animate-[fadeIn_0.2s_ease-out]">
        {/* هدر مودال */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">➕ افزودن بنر جدید</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* عنوان */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان (اختیاری)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
              placeholder="عنوان بنر"
            />
          </div>

          {/* لینک */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">لینک (اختیاری)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
              placeholder="/shop یا https://..."
            />
          </div>

          {/* موقعیت */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">موقعیت</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white appearance-none bg-no-repeat"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'left 0.75rem center',
                backgroundSize: '1.25rem',
              }}
            >
              <option value="home">صفحه اصلی (بزرگ)</option>
              <option value="double">دوگانه (پایین صفحه)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              موقعیت 'دوگانه' برای دو بنر کنار هم در پایین صفحه استفاده می‌شود.
            </p>
          </div>

          {/* تصویر */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تصویر بنر *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none bg-white file:mr-2 file:py-1 file:px-3 file:text-xs file:font-medium file:border-0 file:rounded-lg file:bg-[#800E2F]/10 file:text-[#800E2F] hover:file:bg-[#800E2F]/20"
            />
            {preview && (
              <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                <img src={preview} alt="پیش‌نمایش" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* فعال/غیرفعال */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 font-medium">فعال</label>
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-xl font-medium text-sm transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'در حال ثبت...' : '➕ افزودن بنر'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium text-sm transition"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MobileAddBannerModal;