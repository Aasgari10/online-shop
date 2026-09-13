// src/components/admin/tabs/ThemeCustomizerTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

// سکشن‌های هر صفحه (بر اساس ساختار واقعی)
const sectionConfig = {
  home: [
    { id: 'hero', label: 'بخش اصلی (Hero)' },
    { id: 'featured', label: 'محصولات ویژه' },
    { id: 'testimonials', label: 'نظرات مشتریان' },
    { id: 'footer', label: 'فوتر' },
  ],
  // صفحات دیگر در صورت وجود
};

const sectionLabels = {
  hero: 'بخش اصلی (Hero)',
  featured: 'محصولات ویژه',
  testimonials: 'نظرات مشتریان',
  footer: 'فوتر',
};

const properties = [
  { key: 'background_color', label: 'رنگ پس‌زمینه', type: 'color' },
  { key: 'text_color', label: 'رنگ متن', type: 'color' },
  { key: 'heading_color', label: 'رنگ عنوان', type: 'color' },
  { key: 'button_color', label: 'رنگ دکمه', type: 'color' },
  { key: 'button_hover_color', label: 'رنگ دکمه هاور', type: 'color' },
  { key: 'button_text_color', label: 'رنگ متن دکمه', type: 'color' },
  { key: 'link_color', label: 'رنگ لینک', type: 'color' },
  { key: 'border_color', label: 'رنگ حاشیه', type: 'color' },
  { key: 'font_size', label: 'اندازه فونت (px)', type: 'number' },
  { key: 'padding', label: 'فاصله داخلی (rem)', type: 'number' },
  { key: 'title', label: 'عنوان', type: 'text' },
  { key: 'subtitle', label: 'زیرنویس', type: 'text' },
  { key: 'description', label: 'توضیحات', type: 'text' },
  { key: 'button_text', label: 'متن دکمه', type: 'text' },
];

function ThemeCustomizerTab() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('home');
  const [selectedSection, setSelectedSection] = useState('hero');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  // ===== دریافت لیست صفحات =====
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await api.get('/theme/pages');
        if (res.data.success) {
          setPages(res.data.data);
          // اگر صفحه‌ای وجود داشت، اولین صفحه را انتخاب کن
          if (res.data.data.length > 0) {
            setSelectedPage(res.data.data[0].slug);
          }
        }
      } catch (error) {
        console.error('خطا در دریافت صفحات:', error);
        // fallback به صفحات پیش‌فرض
        setPages([
          { slug: 'home', title: 'صفحه اصلی' },
        ]);
      }
    };
    fetchPages();
  }, []);

  // ===== بارگذاری تنظیمات سکشن انتخاب‌شده =====
  const loadSettings = async () => {
    if (!selectedPage || !selectedSection) return;
    setLoading(true);
    try {
      const res = await api.get(`/theme/page/${selectedPage}/section/${selectedSection}`);
      if (res.data.success) {
        setSettings(res.data.data);
      } else {
        setSettings({});
      }
    } catch (error) {
      console.error('خطا در دریافت تنظیمات:', error);
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [selectedPage, selectedSection]);

  // ===== تغییر مقدار =====
  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // ===== اعمال تغییرات (بدون ذخیره در دیتابیس) =====
  const handleApply = async () => {
    setApplying(true);
    try {
      // ذخیره در دیتابیس
      await api.put(`/admin/theme/page/${selectedPage}/section/${selectedSection}`, settings);
      
      // ارسال رویداد برای به‌روزرسانی صفحه
      window.dispatchEvent(new CustomEvent('theme-applied', { 
        detail: { page: selectedPage, section: selectedSection, settings } 
      }));
      
      toast.success('تغییرات با موفقیت اعمال شد');
    } catch (error) {
      toast.error('خطا در اعمال تغییرات');
    } finally {
      setApplying(false);
    }
  };

  // ===== ذخیره و اعمال =====
  const handleSaveAndApply = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/theme/page/${selectedPage}/section/${selectedSection}`, settings);
      
      window.dispatchEvent(new CustomEvent('theme-applied', { 
        detail: { page: selectedPage, section: selectedSection, settings } 
      }));
      
      toast.success('تنظیمات با موفقیت ذخیره و اعمال شد');
    } catch (error) {
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  // ===== ریست به پیش‌فرض (سیاه) =====
  const handleResetToBlack = () => {
    const blackSettings = {};
    properties.forEach(prop => {
      if (prop.type === 'color') {
        blackSettings[prop.key] = '#000000';
      } else if (prop.type === 'number') {
        blackSettings[prop.key] = 0;
      } else {
        blackSettings[prop.key] = '';
      }
    });
    setSettings(blackSettings);
    toast.info('همه مقادیر به سیاه تنظیم شد. برای اعمال، دکمه "اعمال تغییرات" را بزنید.');
  };

  if (loading) return <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>;

  const currentSections = sectionConfig[selectedPage] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">🎨 شخصی‌سازی ظاهر</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetToBlack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
          >
            ⚫ ریست به سیاه
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAndApply} className="space-y-6">
        {/* انتخاب صفحه */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب صفحه</label>
          <div className="flex flex-wrap gap-2">
            {pages.map(page => (
              <button
                key={page.slug}
                type="button"
                onClick={() => setSelectedPage(page.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedPage === page.slug
                    ? 'bg-[#800E2F] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page.title}
              </button>
            ))}
          </div>
        </div>

        {/* انتخاب سکشن */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب سکشن</label>
          <div className="flex flex-wrap gap-2">
            {currentSections.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedSection === section.id
                    ? 'bg-[#800E2F] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
          {currentSections.length === 0 && (
            <p className="text-sm text-gray-400 mt-2">هیچ سکشنی برای این صفحه تعریف نشده است.</p>
          )}
        </div>

        {/* تنظیمات سکشن */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">
            {sectionLabels[selectedSection] || selectedSection}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(prop => (
              <div key={prop.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {prop.label}
                </label>
                {prop.type === 'color' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings[prop.key] || '#000000'}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                      className="w-12 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings[prop.key] || '#000000'}
                      onChange={(e) => handleChange(prop.key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                ) : prop.type === 'number' ? (
                  <input
                    type="number"
                    step="0.1"
                    value={settings[prop.key] || ''}
                    onChange={(e) => handleChange(prop.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="مقدار عددی"
                  />
                ) : (
                  <input
                    type="text"
                    value={settings[prop.key] || ''}
                    onChange={(e) => handleChange(prop.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="متن"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* پیش‌نمایش */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">👁️ پیش‌نمایش</h4>
          <div
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: settings.background_color || '#000000',
              color: settings.text_color || '#ffffff',
              padding: settings.padding ? `${settings.padding}rem` : '2rem',
            }}
          >
            <h3 style={{ color: settings.heading_color || '#ffffff', fontSize: settings.font_size || '1.5rem' }}>
              {settings.title || 'عنوان نمونه'}
            </h3>
            <p style={{ fontSize: settings.font_size || '1rem' }}>
              {settings.subtitle || 'متن نمونه برای نمایش تنظیمات'}
            </p>
            {settings.button_text && (
              <button
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: settings.button_color || '#000000',
                  color: settings.button_text_color || '#ffffff',
                  fontSize: settings.font_size || '1rem',
                }}
              >
                {settings.button_text}
              </button>
            )}
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {applying ? 'در حال اعمال...' : '✅ اعمال تغییرات'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره...' : '💾 ذخیره و اعمال'}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-left">
          * دکمه "اعمال تغییرات" تنظیمات را بدون ذخیره در دیتابیس اعمال می‌کند (برای تست).  
          * دکمه "ذخیره و اعمال" تنظیمات را در دیتابیس ذخیره و اعمال می‌کند.
        </p>
      </form>
    </div>
  );
}

export default ThemeCustomizerTab;