// src/components/admin/tabs/StaticPagesTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import CustomConfirm from '../../shared/CustomConfirm';

function StaticPagesTab() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
  });

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/pages');
      if (res.data.success) {
        setPages(res.data.data);
        // 
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

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        slug: page.slug || '',
        title: page.title || '',
        content: page.content || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        meta_keywords: page.meta_keywords || '',
        is_active: page.is_active !== undefined ? page.is_active : true,
      });
    } else {
      setEditingPage(null);
      setFormData({
        slug: '',
        title: '',
        content: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.slug.trim() || !formData.title.trim() || !formData.content.trim()) {
      toast.error('اسلاگ، عنوان و محتوا الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      if (editingPage) {
        await api.put(`/admin/pages/${editingPage.id}`, formData);
        toast.success('صفحه با موفقیت ویرایش شد');
      } else {
        await api.post('/admin/pages', formData);
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

  const handleDelete = (id) => setDeleteTarget(id);
  
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

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">📄 مدیریت صفحات</h3>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
        >
          ➕ افزودن صفحه جدید
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              <th className="text-right py-2 px-3">شناسه</th>
              <th className="text-right py-2 px-3">عنوان</th>
              <th className="text-right py-2 px-3">اسلاگ</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">تاریخ</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  هیچ صفحه‌ای یافت نشد
                </td>
              </tr>
            ) : (
              pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-mono text-xs text-gray-500">{page.id}</td>
                  <td className="py-2 px-3 font-medium text-gray-800">{page.title}</td>
                  <td className="py-2 px-3 font-mono text-xs text-[#800E2F]">/{page.slug}</td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => toggleStatus(page.id, page.is_active)}
                      className={`text-xs px-2 py-1 rounded-full transition ${
                        page.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {page.is_active ? '✅ فعال' : '❌ غیرفعال'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-500">
                    {new Date(page.updated_at).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="py-2 px-3 flex gap-1.5">
                    <button
                      onClick={() => handleOpenModal(page)}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                    >
                      ✏️ ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition"
                    >
                      🗑️ حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* مودال افزودن/ویرایش */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPage ? '✏️ ویرایش صفحه' : '➕ افزودن صفحه جدید'}
        size="lg"
      >
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
              <label className="block text-sm font-medium text-gray-700 mb-1">اسلاگ * (شناسه یکتا)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
              />
              <p className="text-xs text-gray-400 mt-1">مثلاً: about, contact, terms</p>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">محتوا *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows="6"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              required
            />
            <p className="text-xs text-gray-400 mt-1">می‌توانید از تگ‌های HTML استفاده کنید</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان سئو (اختیاری)</label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کلمات کلیدی سئو (اختیاری)</label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات سئو (اختیاری)</label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border rounded-lg"
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
              {editingPage ? '💾 ذخیره تغییرات' : '➕ افزودن صفحه'}
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

export default StaticPagesTab;