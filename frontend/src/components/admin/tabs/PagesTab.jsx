// src/components/admin/tabs/PagesTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import PageHeader from '../../shared/PageHeader';

// ✅ اضافه کردن site-settings به لیست صفحات مجاز
const ALLOWED_PAGES = ['home', 'contact', 'support', 'site-settings'];

function PagesTab() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    content_json: {},
    seo_title: '',
    seo_keywords: '',
    seo_description: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ===== State برای آپلود عکس =====
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pages');
      if (res.data.success) {
        const filtered = res.data.data.filter(p => ALLOWED_PAGES.includes(p.slug));
        setPages(filtered);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت صفحات:', error);
      toast.error('خطا در دریافت صفحات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      const contentJson = item.content_json || {};
      setFormData({
        title: item.title || '',
        slug: item.slug || '',
        content: item.content || '',
        content_json: contentJson,
        seo_title: item.seo_title || '',
        seo_keywords: item.seo_keywords || '',
        seo_description: item.seo_description || '',
        is_active: item.is_active !== undefined ? item.is_active : true
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        content_json: {},
        seo_title: '',
        seo_keywords: '',
        seo_description: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const updateJsonField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        [field]: value
      }
    }));
  };

  // ===== تابع آپلود فایل =====
  const handleFileUpload = async (file, fieldName) => {
    if (!file) return;
    
    const setUploading = fieldName === 'logo' ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        const imageUrl = response.data.image_url;
        updateJsonField(fieldName, imageUrl);
        toast.success('عکس با موفقیت آپلود شد');
      } else {
        toast.error(response.data.message || 'خطا در آپلود عکس');
      }
    } catch (error) {
      console.error('❌ خطا در آپلود عکس:', error);
      toast.error('خطا در آپلود عکس');
    } finally {
      setUploading(false);
    }
  };

  const updateFaq = (index, field, value) => {
    const faqs = [...(formData.content_json.faqs || [])];
    if (!faqs[index]) return;
    faqs[index][field] = value;
    updateJsonField('faqs', faqs);
  };

  const addFaq = () => {
    const faqs = [...(formData.content_json.faqs || [])];
    faqs.push({ question: '', answer: '' });
    updateJsonField('faqs', faqs);
  };

  const removeFaq = (index) => {
    const faqs = [...(formData.content_json.faqs || [])];
    faqs.splice(index, 1);
    updateJsonField('faqs', faqs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('عنوان و نامک (slug) الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (editingItem) {
        await api.put(`/admin/pages/${editingItem.id}`, payload);
        toast.success('صفحه با موفقیت ویرایش شد');
      } else {
        await api.post('/admin/pages', payload);
        toast.success('صفحه با موفقیت ایجاد شد');
      }
      setShowModal(false);
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ذخیره صفحه');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/pages/${deleteTarget}`);
      toast.success('صفحه به سطل زباله منتقل شد');
      fetchPages();
    } catch (error) {
      toast.error('خطا در حذف صفحه');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/pages/${id}`, { is_active: !currentStatus });
      toast.success('وضعیت صفحه تغییر کرد');
      fetchPages();
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  // ===== بخش‌های اختصاصی هر صفحه =====

  const renderHomeFields = () => {
    const c = formData.content_json || {};
    return (
      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="font-bold text-gray-700 mb-3">🏠 بخش‌های صفحه اصلی (Hero)</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان اصلی</label>
            <input
              type="text"
              value={c.mainTitle || ''}
              onChange={(e) => updateJsonField('mainTitle', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">زیرعنوان</label>
            <input
              type="text"
              value={c.subtitle || ''}
              onChange={(e) => updateJsonField('subtitle', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <input
              type="text"
              value={c.description || ''}
              onChange={(e) => updateJsonField('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">آدرس تصویر Hero</label>
            <input
              type="text"
              value={c.imageUrl || ''}
              onChange={(e) => updateJsonField('imageUrl', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderContactFields = () => {
    const c = formData.content_json || {};
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-bold text-gray-700 mb-3">📞 بخش‌های صفحه تماس با ما</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان اصلی</label>
            <input
              type="text"
              value={c.mainTitle || ''}
              onChange={(e) => updateJsonField('mainTitle', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <input
              type="text"
              value={c.description || ''}
              onChange={(e) => updateJsonField('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
            <input
              type="text"
              value={c.address || ''}
              onChange={(e) => updateJsonField('address', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تلفن</label>
            <input
              type="text"
              value={c.phone || ''}
              onChange={(e) => updateJsonField('phone', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
            <input
              type="text"
              value={c.email || ''}
              onChange={(e) => updateJsonField('email', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ساعت کاری</label>
            <input
              type="text"
              value={c.workingHours || ''}
              onChange={(e) => updateJsonField('workingHours', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">کد نقشه (iframe)</label>
            <textarea
              value={c.mapEmbed || ''}
              onChange={(e) => updateJsonField('mapEmbed', e.target.value)}
              rows="2"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F] font-mono text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSupportFields = () => {
    const c = formData.content_json || {};
    const faqs = c.faqs || [];
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-bold text-gray-700 mb-3">🎫 بخش‌های صفحه پشتیبانی</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان اصلی</label>
            <input
              type="text"
              value={c.mainTitle || ''}
              onChange={(e) => updateJsonField('mainTitle', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <input
              type="text"
              value={c.description || ''}
              onChange={(e) => updateJsonField('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان بخش سوالات متداول</label>
          <input
            type="text"
            value={c.faqTitle || ''}
            onChange={(e) => updateJsonField('faqTitle', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">سوالات متداول</label>
            <button
              type="button"
              onClick={addFaq}
              className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition"
            >
              ➕ افزودن سوال
            </button>
          </div>
          {faqs.length === 0 ? (
            <p className="text-gray-400 text-sm py-2">هیچ سوالی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">سوال {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕ حذف
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={faq.question || ''}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F] text-sm"
                      placeholder="سوال..."
                    />
                    <textarea
                      value={faq.answer || ''}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F] text-sm"
                      placeholder="پاسخ..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // ✅ بخش تنظیمات عمومی سایت (site-settings) - بدون بخش سئو
  // ============================================================
  const renderSiteSettingsFields = () => {
    const c = formData.content_json || {};
    return (
      <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          ⚙️ تنظیمات عمومی سایت (Site Settings)
        </h4>
        <p className="text-xs text-gray-400 mb-3">
          مدیریت عنوان، لوگو و آیکون مرورگر (Favicon) سایت.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* عنوان سایت */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان سایت (Site Name)</label>
            <input
              type="text"
              value={c.siteName || 'HomeMart'}
              onChange={(e) => updateJsonField('siteName', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              placeholder="مثلاً HomeMart"
            />
            <p className="text-xs text-gray-400 mt-1">این عنوان در هدر و تگ‌های عنوان صفحه نمایش داده می‌شود.</p>
          </div>

          {/* لوگو */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">آدرس لوگو (Logo)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={c.logo || ''}
                onChange={(e) => updateJsonField('logo', e.target.value)}
                placeholder="/uploads/logo.png"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(file, 'logo');
                    }
                    e.target.value = '';
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-32"
                  disabled={uploadingLogo}
                />
                <button
                  type="button"
                  disabled={uploadingLogo}
                  className="px-3 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50 whitespace-nowrap"
                >
                  {uploadingLogo ? '⏳' : '📤 انتخاب'}
                </button>
              </div>
            </div>
            {c.logo && (
              <div className="mt-2 flex items-center gap-2">
                <img src={c.logo} alt="Logo Preview" className="h-12 w-auto border border-gray-200 rounded p-1 bg-white" />
                <span className="text-xs text-gray-400">پیش‌نمایش لوگو</span>
              </div>
            )}
          </div>

          {/* Favicon */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">آدرس Favicon (آیکون مرورگر)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={c.favicon || ''}
                onChange={(e) => updateJsonField('favicon', e.target.value)}
                placeholder="/uploads/favicon.ico"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(file, 'favicon');
                    }
                    e.target.value = '';
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-32"
                  disabled={uploadingFavicon}
                />
                <button
                  type="button"
                  disabled={uploadingFavicon}
                  className="px-3 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50 whitespace-nowrap"
                >
                  {uploadingFavicon ? '⏳' : '📤 انتخاب'}
                </button>
              </div>
            </div>
            {c.favicon && (
              <div className="mt-2 flex items-center gap-2">
                <img src={c.favicon} alt="Favicon Preview" className="h-10 w-10 border border-gray-200 rounded p-0.5 bg-white" />
                <span className="text-xs text-gray-400">پیش‌نمایش Favicon</span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">آدرس تصویر Favicon را وارد کنید (معمولاً با پسوند .ico یا .png).</p>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-700">
            💡 برای آپلود عکس، روی دکمه <strong>"📤 انتخاب"</strong> کلیک کنید و فایل مورد نظر را انتخاب کنید.
          </p>
        </div>
      </div>
    );
  };

  // ============================================================
  // رندر اصلی
  // ============================================================

  if (loading) return <Spinner />;

  const isHome = formData.slug === 'home' || (editingItem && editingItem.slug === 'home');
  const isContact = formData.slug === 'contact' || (editingItem && editingItem.slug === 'contact');
  const isSupport = formData.slug === 'support' || (editingItem && editingItem.slug === 'support');
  const isSiteSettings = formData.slug === 'site-settings' || (editingItem && editingItem.slug === 'site-settings');

  return (
    <div>
      <PageHeader 
        title="📄 مدیریت صفحات" 
        subtitle="ویرایش صفحات اصلی سایت" 
        className="mt-2"
      />

      <div className="overflow-x-auto mt-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              <th className="text-right py-2 px-3">عنوان</th>
              <th className="text-right py-2 px-3">نامک (slug)</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-500">هیچ صفحه‌ای یافت نشد</td></tr>
            ) : (
              pages.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-800">{item.title}</td>
                  <td className="py-2 px-3 text-gray-500">{item.slug}</td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => toggleStatus(item.id, item.is_active)}
                      className={`text-xs px-2 py-1 rounded-full transition ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}
                    >
                      {item.is_active ? '✅ فعال' : '❌ غیرفعال'}
                    </button>
                  </td>
                  <td className="py-2 px-3 flex gap-1.5">
                    <button onClick={() => handleOpenModal(item)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition">
                      ✏️ ویرایش
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingItem ? '✏️ ویرایش صفحه' : '➕ افزودن صفحه جدید'} size="xl">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نامک (slug) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
                placeholder="مثال: home, about, contact, terms, support, site-settings"
              />
            </div>
          </div>

          {/* ===== بخش‌های اختصاصی ===== */}
          {isHome && renderHomeFields()}
          {isContact && renderContactFields()}
          {isSupport && renderSupportFields()}
          {isSiteSettings && renderSiteSettingsFields()}

          {/* ===== بخش سئو - فقط برای صفحاتی که site-settings نیستند ===== */}
          {!isSiteSettings && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10h.01M9 10h.01M13 14h.01M9 14h.01" />
                </svg>
                تنظیمات سئو (متا تگ‌ها)
              </h4>
              <p className="text-xs text-gray-400 mb-3">با پر کردن این فیلدها، متا تگ‌های صفحه به‌صورت اختصاصی تنظیم می‌شوند.</p>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان سئو (Meta Title)</label>
                <input
                  type="text"
                  value={formData.seo_title || ''}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  placeholder="عنوانی که در گوگل نمایش داده می‌شود"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات سئو (Meta Description)</label>
                <textarea
                  value={formData.seo_description || ''}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  placeholder="توضیح مختصر برای نمایش در نتایج جستجو"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">کلمات کلیدی (Meta Keywords)</label>
                <input
                  type="text"
                  value={formData.seo_keywords || ''}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  placeholder="با کاما جدا کنید، مثال: تماس با ما, پشتیبانی, فروشگاه"
                />
              </div>
            </div>
          )}

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">محتوای صفحه (HTML)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows="6"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F] font-mono text-sm"
            />
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
              {editingItem ? '💾 ذخیره تغییرات' : '➕ افزودن صفحه'}
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
        title="⚠️ حذف صفحه"
        message="آیا از انتقال این صفحه به سطل زباله مطمئن هستید؟"
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
      />
    </div>
  );
}

export default PagesTab;