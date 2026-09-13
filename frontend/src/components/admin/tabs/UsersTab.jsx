// src/components/admin/tabs/UsersTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import PageHeader from '../../shared/PageHeader';

function UsersTab() {
  // 

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchUsers = async () => {
    // 
    try {
      const res = await api.get('/admin/users');
      // 
      if (res.data.success) {
        setUsers(res.data.data);
        // 
      }
    } catch (error) {
      console.error('❌ [UsersTab] خطا در دریافت کاربران:', error);
      toast.error('خطا در دریافت کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSel = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSel.length === users.length && users.length > 0);
      return newSel;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(users.map(u => u.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteClick = (id, name) => {
    setDeleteTarget({ id, name });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setBatchLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast.success(`کاربر "${deleteTarget.name}" با موفقیت حذف شد`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      console.error('❌ [UsersTab] خطا در حذف کاربر:', error);
      toast.error('خطا در حذف کاربر');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.delete(`/admin/users/${id}`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} کاربر با موفقیت حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error('❌ [UsersTab] خطا در حذف گروهی:', error);
      toast.error('خطا در حذف گروهی کاربران');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success('نقش کاربر تغییر یافت');
      fetchUsers();
    } catch (error) {
      console.error('❌ [UsersTab] خطا در تغییر نقش:', error);
      toast.error('خطا در تغییر نقش');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader 
        title="👥 مدیریت کاربران" 
        subtitle="مشاهده، ویرایش نقش و حذف کاربران" 
      />

      <div className="flex items-center justify-between mb-0">
        {selectedItems.length > 0 && (
          <button
            onClick={handleBatchDelete}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
          >
            🗑️ حذف گروهی ({selectedItems.length})
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm mt-5">
          <thead >
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              <th className="text-right py-2 px-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  disabled={users.length === 0}
                />
              </th>
              <th className="text-right py-2 px-3">شناسه</th>
              <th className="text-right py-2 px-3">نام</th>
              <th className="text-right py-2 px-3">ایمیل</th>
              <th className="text-right py-2 px-3">نقش</th>
              <th className="text-right py-2 px-3">تاریخ عضویت</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="py-2 px-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(u.id)}
                    onChange={() => toggleSelection(u.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  />
                </td>
                <td className="py-2 px-3 font-mono text-xs text-gray-500">{u.id}</td>
                <td className="py-2 px-3 font-medium text-gray-800">{u.name}</td>
                <td className="py-2 px-3 text-gray-600">{u.email}</td>
                <td className="py-2 px-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="px-2 py-0.5 rounded text-xs font-medium border-0 focus:ring-1 focus:ring-[#800E2F] bg-gray-100"
                  >
                    <option value="user">کاربر</option>
                    <option value="admin">ادمین</option>
                  </select>
                </td>
                <td className="py-2 px-3 text-xs text-gray-500">
                  {new Date(u.created_at).toLocaleDateString('fa-IR')}
                </td>
                <td className="py-2 px-3 flex gap-2">
                  <button
                    onClick={() => handleDeleteClick(u.id, u.name)}
                    className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition"
                  >
                    🗑️ حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center py-8 text-gray-500">هیچ کاربری یافت نشد</p>}
      </div>

      <CustomConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="⚠️ حذف کاربر"
        message={`آیا از حذف کاربر "${deleteTarget?.name}" مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />
    </div>
  );
}

export default UsersTab;