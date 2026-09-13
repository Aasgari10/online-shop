// src/components/admin/tabs/SettingsTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import Button from '../../shared/Button';

function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/settings');
        if (res.data.success) {
          const settingsObj = {};
          res.data.data.forEach(item => {
            settingsObj[item.key] = item.value;
          });
          setSettings(settingsObj);
        }
      } catch (error) {
        console.error('❌ خطا در دریافت تنظیمات:', error);
        toast.error('خطا در دریافت تنظیمات');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', { settings });
      toast.success('تنظیمات با موفقیت ذخیره شد');
    } catch (error) {
      console.error('❌ خطا در ذخیره تنظیمات:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">⚙️ تنظیمات صفحات</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ===== بخش تنظیمات هدر (لوگو) ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">🏷️ تنظیمات هدر (لوگو)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان اصلی</label>
              <input
                type="text"
                value={settings.header_title || 'HomeMart'}
                onChange={(e) => handleChange('header_title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="مثلاً HomeMart"
              />
              <p className="text-xs text-gray-400 mt-1">این متن در هدر به‌عنوان عنوان اصلی نمایش داده می‌شود.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">زیرعنوان</label>
              <input
                type="text"
                value={settings.header_subtitle || 'Everything for Home'}
                onChange={(e) => handleChange('header_subtitle', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="مثلاً Everything for Home"
              />
              <p className="text-xs text-gray-400 mt-1">زیرنویس کوچک زیر عنوان اصلی.</p>
            </div>
          </div>
        </div>

        {/* ===== بخش تماس با ما ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">📞 صفحه تماس با ما</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان صفحه</label>
              <input
                type="text"
                value={settings.contact_page_title || ''}
                onChange={(e) => handleChange('contact_page_title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <input
                type="text"
                value={settings.contact_page_description || ''}
                onChange={(e) => handleChange('contact_page_description', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
              <input
                type="text"
                value={settings.contact_address || ''}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تلفن</label>
              <input
                type="text"
                value={settings.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
              <input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ساعت کاری</label>
              <input
                type="text"
                value={settings.contact_working_hours || ''}
                onChange={(e) => handleChange('contact_working_hours', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">کد Embed نقشه (اختیاری)</label>
              <textarea
                value={settings.contact_map_embed || ''}
                onChange={(e) => handleChange('contact_map_embed', e.target.value)}
                rows="2"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="کد iframe نقشه را وارد کنید"
              />
              <p className="text-xs text-gray-400 mt-1">می‌توانید از Google Maps embed کد استفاده کنید</p>
            </div>
          </div>
        </div>

        {/* ===== بخش پشتیبانی ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">🎫 صفحه پشتیبانی</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان صفحه</label>
              <input
                type="text"
                value={settings.support_page_title || ''}
                onChange={(e) => handleChange('support_page_title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <input
                type="text"
                value={settings.support_page_description || ''}
                onChange={(e) => handleChange('support_page_description', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان بخش سوالات متداول</label>
              <input
                type="text"
                value={settings.support_faq_title || ''}
                onChange={(e) => handleChange('support_faq_title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">سوالات متداول (JSON)</label>
              <textarea
                value={settings.support_faq_items || '[]'}
                onChange={(e) => handleChange('support_faq_items', e.target.value)}
                rows="6"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F] font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                فرمت: {`{"question":"سوال","answer":"پاسخ"}`} 
                برای راهنمایی به مستندات مراجعه کنید.
              </p>
            </div>
          </div>
        </div>

        {/* ===== دکمه ذخیره ===== */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving} className="px-8 py-2.5">
            💾 ذخیره تنظیمات
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SettingsTab;