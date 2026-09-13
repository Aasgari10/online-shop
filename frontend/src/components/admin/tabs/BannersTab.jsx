// src/components/admin/tabs/BannersTab.jsx
import { useState } from 'react';
import PageHeader from '../../shared/PageHeader';

// ✅ ایمپورت عکس پیش‌فرض از پوشه assets
import defaultBannerImage from '../../../assets/phone.png';

function BannersTab({ banners, onAdd, onDelete, onToggle, onEdit }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [position, setPosition] = useState('home');
  const [isActive, setIsActive] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ===== اصلاح تابع handleAdd =====
  const handleAdd = async () => {
    let fileToUpload = selectedFile;

    // ✅ اگر فایلی انتخاب نشده، از عکس پیش‌فرض استفاده کن
    if (!fileToUpload) {
      try {
        // بارگذاری عکس پیش‌فرض از assets
        const response = await fetch(defaultBannerImage);
        const blob = await response.blob();
        fileToUpload = new File([blob], 'phone.png', { type: blob.type || 'image/png' });
        // 
      } catch (error) {
        console.error('❌ [BannersTab] خطا در بارگذاری عکس پیش‌فرض:', error);
        alert('خطا در بارگذاری عکس پیش‌فرض. لطفاً یک تصویر انتخاب کنید.');
        return;
      }
    }

    // ارسال به onAdd (همانند قبل)
    onAdd(fileToUpload, title, link, position, isActive);

    // ریست فرم
    setSelectedFile(null);
    setPreview(null);
    setTitle('');
    setLink('');
    setPosition('home');
    setIsActive(true);
    setShowForm(false);
    document.getElementById('bannerFileInput').value = '';
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setTitle('');
    setLink('');
    setPosition('home');
    setIsActive(true);
    setShowForm(false);
    document.getElementById('bannerFileInput').value = '';
  };

  const getPositionLabel = (pos) => {
    const labels = {
      home: 'صفحه اصلی (بزرگ)',
      double: 'دوگانه (پایین صفحه)'
    };
    return labels[pos] || pos;
  };

  return (
    <div className="p-0 m-0">
      <PageHeader 
        title="🖼️ مدیریت بنرها" 
        subtitle="افزودن و ویرایش بنرهای تبلیغاتی" 
        className="mb-8 mt-0"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 mt-1">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2.5 bg-[#800E2F] text-white rounded-xl text-sm font-medium hover:bg-[#6B0A26] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 mr-4"
        >
          {showForm ? (
            <span className="flex items-center gap-0">✕ لغو</span>
          ) : (
            <span className="flex items-center gap-0">➕ افزودن بنر جدید</span>
          )} 
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">عنوان بنر</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان (اختیاری)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-white/80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">لینک بنر</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="مثلاً /shop"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-white/80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">موقعیت بنر</label>
              <select
                value={position}
                onChange={(e) => {
                  // 
                  setPosition(e.target.value);
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-white/80"
              >
                <option value="home">صفحه اصلی (بزرگ)</option>
                <option value="double">دوگانه (پایین صفحه)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">تصویر بنر</label>
              <input
                id="bannerFileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-white/80"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                در صورت عدم انتخاب تصویر، از تصویر پیش‌فرض استفاده می‌شود.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded-lg border-gray-300 text-[#800E2F] focus:ring-2 focus:ring-[#800E2F] focus:ring-offset-2 cursor-pointer"
              />
              <span className="font-medium">فعال</span>
            </label>
            {preview && (
              <div className="flex items-center gap-3">
                <img src={preview} alt="پیش‌نمایش" className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm" />
                <span className="text-xs text-gray-400">پیش‌نمایش</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleAdd}
              className="px-6 py-2.5 bg-[#800E2F] text-white rounded-xl font-medium hover:bg-[#6B0A26] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
            >
              💾 ذخیره بنر
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* ===== کارت‌های بنر ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 px-4 pb-4">
        {banners.map((banner) => {
          // ✅ console.log کاملاً حذف شد - خطوط ناقص پاک شدند
          return (
            <div 
              key={banner.id} 
              className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:border-[#800E2F]/20"
            >
              <div className="relative overflow-hidden bg-gray-100 h-44">
                <img
                  src={banner.image_url?.startsWith('http') ? banner.image_url : `${banner.image_url}`}
                  alt={banner.title || 'بنر'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                />
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
                  banner.is_active 
                    ? 'bg-green-500/90 text-white' 
                    : 'bg-gray-600/90 text-white'
                }`}>
                  {banner.is_active ? '✅ فعال' : '⛔ غیرفعال'}
                </div>
              </div>

              <div className="p-4">
                <h4 className="text-base font-bold text-gray-800 truncate">
                  {banner.title || 'بدون عنوان'}
                </h4>
                
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 py-0.5 px-2 rounded-full">
                    {getPositionLabel(banner.position)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onToggle(banner.id, banner.is_active)}
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                      banner.is_active 
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-sm' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100 hover:shadow-sm'
                    }`}
                  >
                    {banner.is_active ? 'غیرفعال' : 'فعال'}
                  </button>
                  
                  <button
                    onClick={() => onEdit(banner)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition-all duration-300"
                  >
                    ✏️ ویرایش
                  </button>
                  
                  <button
                    onClick={() => onDelete(banner.id)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 hover:shadow-sm transition-all duration-300"
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {banners.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white/50 rounded-2xl border border-dashed border-gray-300">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="text-lg font-medium">هیچ بنری یافت نشد</p>
          <p className="text-sm mt-1">با کلیک روی دکمه «افزودن بنر جدید» اولین بنر خود را اضافه کنید.</p>
        </div>
      )}
    </div>
  );
}

export default BannersTab;