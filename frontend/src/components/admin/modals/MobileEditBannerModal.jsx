// src/components/admin/modals/MobileEditBannerModal.jsx
import { useState, useEffect } from 'react';
import { useBottomNav } from '../../../context/BottomNavContext';

function MobileEditBannerModal({ isOpen, onClose, banner, onSave }) {
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [position, setPosition] = useState('home');
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (banner) {
      setTitle(banner.title || '');
      setLink(banner.link || '');
      setPosition(banner.position || 'home');
      setIsActive(banner.is_active ?? true);
      if (banner.image_url) {
        setPreview(banner.image_url.startsWith('http') ? banner.image_url : `${banner.image_url}`);
      }
    }
  }, [banner]);

  useEffect(() => {
    if (isOpen) hideBottomNav();
    else showBottomNav();
    return () => showBottomNav();
  }, [isOpen, hideBottomNav, showBottomNav]);

  if (!isOpen || !banner) return null;

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
    onSave(banner.id, { title, link, position, is_active: isActive, file });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">✏️ ویرایش بنر</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">لینک</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">موقعیت</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
            >
              <option value="home">صفحه اصلی (بزرگ)</option>
              <option value="double">دوگانه (پایین صفحه)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تصویر جدید (اختیاری)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white file:mr-2 file:py-1 file:px-3 file:text-xs file:font-medium file:border-0 file:rounded-lg file:bg-[#800E2F]/10 file:text-[#800E2F] hover:file:bg-[#800E2F]/20"
            />
            {preview && (
              <div className="mt-2 w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                <img src={preview} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                {!file && (
                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-2 py-0.5 rounded-full">تصویر فعلی</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_edit_banner"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#800E2F]"
            />
            <label htmlFor="is_active_edit_banner" className="text-sm text-gray-700 font-medium">فعال</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
            >
              💾 ذخیره
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

export default MobileEditBannerModal;