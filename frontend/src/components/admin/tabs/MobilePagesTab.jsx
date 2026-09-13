// src/components/admin/tabs/MobilePagesTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import { useBottomNav } from '../../../context/BottomNavContext';

// ✅ اضافه کردن site-settings به لیست صفحات مجاز
const ALLOWED_PAGES = ['home', 'contact', 'support', 'site-settings'];

function MobilePagesTab() {
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  // ===== State برای آپلود عکس (موبایل) =====
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
      console.error('❌ [MobilePagesTab] خطا در دریافت صفحات:', error);
      toast.error('خطا در دریافت صفحات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const filteredPages = pages.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredPages.length && filteredPages.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredPages.map(item => item.id);
      setSelectedItems(ids);
      setSelectAll(true);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} صفحه...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/pages/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} صفحه با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      await fetchPages();
    } catch (error) {
      console.error('❌ [MobilePagesTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی صفحات');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این صفحه مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/pages/${id}`);
      toast.success('صفحه به سطل زباله منتقل شد');
      await fetchPages();
    } catch (error) {
      toast.error('خطا در حذف');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/pages/${id}`, { is_active: !currentStatus });
      toast.success('وضعیت تغییر کرد');
      await fetchPages();
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const updateJsonField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      content_json: { ...prev.content_json, [field]: value }
    }));
  };

  // ===== تابع آپلود فایل برای موبایل =====
  const handleMobileFileUpload = async (file, fieldName) => {
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
    hideBottomNav();
  };

  const closeModal = () => {
    setShowModal(false);
    showBottomNav();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('عنوان و نامک الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/admin/pages/${editingItem.id}`, formData);
        toast.success('صفحه ویرایش شد');
      } else {
        await api.post('/admin/pages', formData);
        toast.success('صفحه ایجاد شد');
      }
      closeModal();
      await fetchPages();
    } catch (error) {
      console.error('❌ [MobilePagesTab] خطا در ذخیره:', error);
      toast.error(error.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  const isHome = formData.slug === 'home' || (editingItem && editingItem.slug === 'home');
  const isContact = formData.slug === 'contact' || (editingItem && editingItem.slug === 'contact');
  const isSupport = formData.slug === 'support' || (editingItem && editingItem.slug === 'support');
  const isSiteSettings = formData.slug === 'site-settings' || (editingItem && editingItem.slug === 'site-settings');

  const renderSiteSettingsFields = () => {
    const c = formData.content_json || {};
    return (
      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 space-y-3">
        <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          ⚙️ تنظیمات عمومی
        </h4>
        <p className="text-[10px] text-gray-400">مدیریت عنوان، لوگو و آیکون مرورگر</p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">عنوان سایت</label>
            <input
              type="text"
              value={formData.content_json.siteName || 'HomeMart'}
              onChange={(e) => updateJsonField('siteName', e.target.value)}
              placeholder="HomeMart"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">آدرس لوگو</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={formData.content_json.logo || ''}
                onChange={(e) => updateJsonField('logo', e.target.value)}
                placeholder="/uploads/logo.png"
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
              <div className="relative flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleMobileFileUpload(file, 'logo');
                    }
                    e.target.value = '';
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-12"
                />
                <button
                  type="button"
                  className="px-2 py-1.5 bg-[#800E2F] text-white rounded-lg text-[10px] font-medium hover:bg-[#6B0A26] transition whitespace-nowrap"
                >
                  📤
                </button>
              </div>
            </div>
            {formData.content_json.logo && (
              <div className="mt-1 flex items-center gap-2">
                <img src={formData.content_json.logo} alt="Logo" className="h-8 w-auto border rounded p-0.5 bg-white" />
                <span className="text-[8px] text-gray-400">پیش‌نمایش</span>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">آدرس Favicon</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={formData.content_json.favicon || ''}
                onChange={(e) => updateJsonField('favicon', e.target.value)}
                placeholder="/uploads/favicon.ico"
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg"
              />
              <div className="relative flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleMobileFileUpload(file, 'favicon');
                    }
                    e.target.value = '';
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-12"
                />
                <button
                  type="button"
                  className="px-2 py-1.5 bg-[#800E2F] text-white rounded-lg text-[10px] font-medium hover:bg-[#6B0A26] transition whitespace-nowrap"
                >
                  📤
                </button>
              </div>
            </div>
            {formData.content_json.favicon && (
              <div className="mt-1 flex items-center gap-2">
                <img src={formData.content_json.favicon} alt="Favicon" className="h-6 w-6 border rounded p-0.5 bg-white" />
                <span className="text-[8px] text-gray-400">پیش‌نمایش</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-1 p-1.5 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-[8px] text-yellow-700">با کلیک روی 📤 عکس را آپلود کن</p>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          📄 صفحات
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-3 py-1.5 bg-[#800E2F] text-white rounded-xl text-sm font-medium hover:bg-[#6B0A26] transition"
        >
          ➕ جدید
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی صفحه..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredPages.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredPages.length})</span>
        </div>
      )}

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

      {filteredPages.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">صفحه‌ای یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPages.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleSelection(item.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500">slug: {item.slug}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {item.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <button onClick={() => toggleStatus(item.id, item.is_active)} className="flex-1 px-2 py-0.5 text-[9px] bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                      {item.is_active ? 'غیرفعال' : 'فعال'}
                    </button>
                    <button onClick={() => handleOpenModal(item)} className="flex-1 px-2 py-0.5 text-[9px] bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="flex-1 px-2 py-0.5 text-[9px] bg-red-50 text-red-500 rounded hover:bg-red-100">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی صفحات"
        message={`آیا از حذف ${selectedItems.length} صفحه انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800">{editingItem ? '✏️ ویرایش صفحه' : '➕ صفحه جدید'}</h3>
              <button onClick={closeModal} className="text-gray-400 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="عنوان *"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
              />

              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                placeholder="نامک (slug) *"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
              />

              {isHome && (
                <div className="bg-purple-50 p-2 rounded-lg border border-purple-200 space-y-2">
                  <input type="text" value={formData.content_json.mainTitle || ''} onChange={(e) => updateJsonField('mainTitle', e.target.value)} placeholder="عنوان اصلی هیرو" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.subtitle || ''} onChange={(e) => updateJsonField('subtitle', e.target.value)} placeholder="زیرعنوان" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.description || ''} onChange={(e) => updateJsonField('description', e.target.value)} placeholder="توضیحات" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.imageUrl || ''} onChange={(e) => updateJsonField('imageUrl', e.target.value)} placeholder="آدرس تصویر هیرو" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                </div>
              )}

              {isContact && (
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 space-y-2">
                  <input type="text" value={formData.content_json.address || ''} onChange={(e) => updateJsonField('address', e.target.value)} placeholder="آدرس" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.phone || ''} onChange={(e) => updateJsonField('phone', e.target.value)} placeholder="تلفن" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.email || ''} onChange={(e) => updateJsonField('email', e.target.value)} placeholder="ایمیل" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.workingHours || ''} onChange={(e) => updateJsonField('workingHours', e.target.value)} placeholder="ساعت کاری" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <textarea value={formData.content_json.mapEmbed || ''} onChange={(e) => updateJsonField('mapEmbed', e.target.value)} rows="2" placeholder="کد نقشه" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                </div>
              )}

              {isSupport && (
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 space-y-2">
                  <input type="text" value={formData.content_json.mainTitle || ''} onChange={(e) => updateJsonField('mainTitle', e.target.value)} placeholder="عنوان اصلی" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.description || ''} onChange={(e) => updateJsonField('description', e.target.value)} placeholder="توضیحات" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.content_json.faqTitle || ''} onChange={(e) => updateJsonField('faqTitle', e.target.value)} placeholder="عنوان سوالات متداول" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">سوالات متداول</span>
                    <button type="button" onClick={addFaq} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">➕</button>
                  </div>
                  {formData.content_json.faqs?.map((faq, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-gray-200 space-y-1">
                      <input type="text" value={faq.question || ''} onChange={(e) => updateFaq(idx, 'question', e.target.value)} placeholder="سوال" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                      <textarea value={faq.answer || ''} onChange={(e) => updateFaq(idx, 'answer', e.target.value)} rows="1" placeholder="پاسخ" className="w-full px-2 py-1 text-xs border border-gray-300 rounded" />
                      <button type="button" onClick={() => removeFaq(idx)} className="text-xs text-red-500">✕ حذف</button>
                    </div>
                  ))}
                </div>
              )}

              {isSiteSettings && renderSiteSettingsFields()}

              {!isSiteSettings && (
                <div className="border-t border-gray-200 pt-2 space-y-2">
                  <h4 className="text-xs font-bold text-gray-700">تنظیمات سئو</h4>
                  <input type="text" value={formData.seo_title || ''} onChange={(e) => setFormData({...formData, seo_title: e.target.value})} placeholder="عنوان سئو" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <textarea value={formData.seo_description || ''} onChange={(e) => setFormData({...formData, seo_description: e.target.value})} rows="2" placeholder="توضیحات سئو" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                  <input type="text" value={formData.seo_keywords || ''} onChange={(e) => setFormData({...formData, seo_keywords: e.target.value})} placeholder="کلمات کلیدی" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active_page" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-[#800E2F]" />
                <label htmlFor="is_active_page" className="text-sm text-gray-700">فعال</label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {submitting ? 'در حال ذخیره...' : '💾 ذخیره'}
                </button>
                <button type="button" onClick={closeModal} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobilePagesTab;