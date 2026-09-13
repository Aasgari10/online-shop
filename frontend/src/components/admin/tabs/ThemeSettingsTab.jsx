// src/components/admin/tabs/ThemeSettingsTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import Button from '../../shared/Button';

function ThemeSettingsTab() {
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
      toast.success('تنظیمات ظاهر با موفقیت ذخیره شد');
      window.dispatchEvent(new CustomEvent('theme-updated', { detail: settings }));
    } catch (error) {
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const colorFields = [
    { key: 'primary_color', label: 'رنگ اصلی', default: '#800E2F' },
    { key: 'secondary_color', label: 'رنگ ثانویه', default: '#6B0A26' },
    { key: 'background_color', label: 'رنگ پس‌زمینه', default: '#E8DCC8' },
    { key: 'text_color', label: 'رنگ متن', default: '#1F2937' },
    { key: 'footer_bg_color', label: 'رنگ پس‌زمینه فوتر', default: '#810E2F' },
    { key: 'button_hover_color', label: 'رنگ دکمه در هاور', default: '#6B0A26' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">🎨 تنظیمات ظاهر سایت</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">🎨 رنگ‌ها</h4>
          <p className="text-sm text-gray-500 mb-4">
            با تغییر هر رنگ، بلافاصله در کل سایت اعمال می‌شود. برای دیدن تغییرات، صفحه را رفرش کنید.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings[field.key] || field.default}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-12 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings[field.key] || field.default}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] font-mono text-sm"
                    placeholder={field.default}
                  />
                </div>
                <p className="text-xs text-gray-400">پیش‌فرض: {field.default}</p>
              </div>
            ))}
          </div>
        </div>

        {/* پیش‌نمایش زنده */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">👁️ پیش‌نمایش زنده</h4>
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: settings.background_color || '#E8DCC8',
              color: settings.text_color || '#1F2937',
            }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: settings.primary_color || '#800E2F' }}
              >
                دکمه نمونه
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: settings.button_hover_color || '#6B0A26' }}
              >
                هاور دکمه
              </button>
              <span className="text-sm">متن نمونه با رنگ {settings.text_color || '#1F2937'}</span>
            </div>
            <div
              className="mt-4 p-3 rounded-lg text-white"
              style={{ backgroundColor: settings.footer_bg_color || '#810E2F' }}
            >
              <span className="text-sm">پس‌زمینه فوتر نمونه</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving} className="px-8 py-2.5">
            💾 ذخیره تنظیمات ظاهر
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ThemeSettingsTab;