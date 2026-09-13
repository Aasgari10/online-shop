// src/components/admin/tabs/MobileCategoriesTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';

function MobileCategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (error) {
      toast.error('خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toString().includes(searchTerm)
  );

  // ===== انتخاب گروهی =====
  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredCategories.length && filteredCategories.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(filteredCategories.map(c => c.id));
      setSelectAll(true);
    }
  };

  // ===== حذف گروهی =====
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.delete(`/admin/categories/${id}`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} دسته‌بندی با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      fetchCategories();
    } catch (error) {
      toast.error('خطا در حذف گروهی دسته‌بندی‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  // ===== حذف تکی =====
  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این دسته‌بندی مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('دسته‌بندی به سطل زباله منتقل شد');
      fetchCategories();
    } catch (error) {
      toast.error('خطا در حذف');
    }
  };

  // ===== ویرایش =====
  const handleEdit = (id, name) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      toast.error('نام را وارد کنید');
      return;
    }
    try {
      await api.put(`/admin/categories/${id}`, { name: editName.trim() });
      toast.success('ویرایش شد');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ویرایش');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  // ===== افزودن =====
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('نام دسته‌بندی را وارد کنید');
      return;
    }
    try {
      await api.post('/admin/categories', { name: newCategoryName.trim() });
      toast.success('دسته‌بندی اضافه شد');
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در افزودن');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="pb-4">
      {/* ===== سرتیتر ===== */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          📂 دسته‌بندی‌ها
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
      </div>

      {/* ===== جستجو و افزودن ===== */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی دسته‌بندی..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="نام جدید..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#800E2F] bg-white"
        />
        <button type="submit" className="px-3 py-2 bg-[#800E2F] text-white rounded-xl text-sm font-medium whitespace-nowrap">
          ➕ افزودن
        </button>
      </form>

      {/* ===== انتخاب همه ===== */}
      {filteredCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredCategories.length})</span>
        </div>
      )}

      {/* ===== نوار عملیات گروهی ===== */}
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

      {/* ===== لیست دسته‌بندی‌ها ===== */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">دسته‌بندی‌ای یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(cat.id)}
                  onChange={() => toggleSelection(cat.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                {editingId === cat.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                      autoFocus
                    />
                    <button onClick={() => handleSaveEdit(cat.id)} className="px-2 py-1 text-[10px] bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                      💾
                    </button>
                    <button onClick={handleCancelEdit} className="px-2 py-1 text-[10px] bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800">{cat.name}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleEdit(cat.id, cat.name)} className="px-2 py-1 text-[10px] bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="px-2 py-1 text-[10px] bg-red-50 text-red-500 rounded hover:bg-red-100 transition">
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Confirm Dialog ===== */}
      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی دسته‌بندی‌ها"
        message={`آیا از حذف ${selectedItems.length} دسته‌بندی انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />
    </div>
  );
}

export default MobileCategoriesTab;