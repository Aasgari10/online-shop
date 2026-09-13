// src/components/admin/tabs/CategoriesTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import PageHeader from '../../shared/PageHeader';

function CategoriesTab() {
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

  const filteredCategories = categories.filter(c =>
    c.id.toString().includes(searchTerm) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchCategories = async () => {
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

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('نام دسته‌بندی را وارد کنید');
      return;
    }
    try {
      const res = await api.post('/admin/categories', { name: newCategoryName.trim() });
      if (res.data.success) {
        toast.success('دسته‌بندی اضافه شد');
        setNewCategoryName('');
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در افزودن دسته‌بندی');
    }
  };

  const handleEdit = (id, name) => {
    setEditingId(id);
    setEditName(name || '');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) {
      toast.error('نام دسته‌بندی را وارد کنید');
      return;
    }
    try {
      const res = await api.put(`/admin/categories/${id}`, { name: editName.trim() });
      if (res.data.success) {
        toast.success('دسته‌بندی ویرایش شد');
        setEditingId(null);
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ویرایش دسته‌بندی');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

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
    } else {
      setSelectedItems(filteredCategories.map(c => c.id));
    }
    setSelectAll(!selectAll);
  };

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

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader 
        title="📂 مدیریت دسته‌بندی‌ها" 
        subtitle="افزودن، ویرایش و حذف دسته‌بندی‌ها" 
        className="mt-2"
      />

      {/* ===== ردیف ابزارها: جستجو و افزودن در یک ردیف سمت راست ===== */}
      <div className="flex flex-wrap items-center gap-2 mb-4 mt-5">
        {/* جستجو - ارتفاع یکسان با py-2 */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجو بر اساس شناسه یا نام..."
          className="w-56 px-3 py-2.5 mr-2 pr-1.7 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
        />

        {/* دکمه حذف گروهی - ارتفاع یکسان با py-2 */}
        {selectedItems.length > 0 && (
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition whitespace-nowrap"
          >
            🗑️ حذف گروهی ({selectedItems.length})
          </button>
        )}

        {/* فرم افزودن */}
        <form onSubmit={handleAddCategory} className="flex items-center gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="نام دسته‌بندی جدید..."
            className="w-64 px-3 py-2 pr-1.7 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#800E2F] text-white rounded-lg hover:bg-[#6B0A26] transition whitespace-nowrap"
          >
            ➕ افزودن
          </button>
        </form>
      </div>

      {/* ===== جدول ===== */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              <th className="text-right py-2 px-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  disabled={filteredCategories.length === 0}
                />
              </th>
              <th className="text-right py-2 px-3">شناسه</th>
              <th className="text-right py-2 px-3">نام</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  {searchTerm ? 'دسته‌بندی با این مشخصات یافت نشد' : 'هیچ دسته‌بندی وجود ندارد'}
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(cat.id)}
                      onChange={() => toggleSelection(cat.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                    />
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-gray-500">{cat.id}</td>
                  <td className="py-2 px-3">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] w-full"
                      />
                    ) : (
                      <span className="font-medium text-gray-800">{cat.name}</span>
                    )}
                  </td>
                  <td className="py-2 px-3 flex gap-2">
                    {editingId === cat.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(cat.id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">💾 ذخیره</button>
                        <button onClick={handleCancelEdit} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition">انصراف</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(cat.id, cat.name)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition">✏️ ویرایش</button>
                        <button onClick={() => handleDelete(cat.id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">🗑️ حذف</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی دسته‌بندی‌ها"
        message={`آیا از حذف ${selectedItems.length} دسته‌بندی انتخاب‌شده مطمئن هستید؟ این دسته‌بندی‌ها به سطل زباله منتقل خواهند شد.`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />
    </div>
  );
}

export default CategoriesTab;