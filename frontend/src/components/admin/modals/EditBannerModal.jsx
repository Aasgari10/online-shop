// src/components/admin/modals/EditBannerModal.jsx
import { useState, useEffect } from 'react';

function EditBannerModal({ isOpen, onClose, banner, onSave }) {
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
    }
  }, [banner]);

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">ویرایش بنر</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">لینک</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">موقعیت</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
            >
              <option value="home">صفحه اصلی (بزرگ)</option>
              <option value="double">دوگانه (پایین صفحه)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              موقعیت 'دوگانه' برای دو بنر کنار هم در پایین صفحه استفاده می‌شود.
            </p>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">تصویر جدید (اختیاری)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {preview && <img src={preview} alt="پیش‌نمایش" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
            {!preview && banner.image_url && (
              <img
                src={banner.image_url.startsWith('http') ? banner.image_url : `${banner.image_url}`}
                alt="تصویر فعلی"
                className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-200"
              />
            )}
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
              />
              فعال
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-[#800E2F] text-white py-2 rounded-lg font-medium hover:bg-[#6B0A26] transition">
              💾 ذخیره
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition">
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditBannerModal;