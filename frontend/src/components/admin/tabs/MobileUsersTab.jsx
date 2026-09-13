// src/components/admin/tabs/MobileUsersTab.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import api from '../../../services/api';

function MobileUsersTab({ users, onDelete, onUpdateRole, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toString().includes(searchTerm)
  );

  const toggleSelection = (id) => {
    console.log('🔄 [MobileUsersTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredUsers.length && filteredUsers.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileUsersTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredUsers.map(u => u.id);
      setSelectedItems(ids);
      setSelectAll(true);
      console.log('📊 همه انتخاب شدند:', ids.length);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileUsersTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} کاربر...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/users/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} کاربر با موفقیت حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileUsersTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی کاربران');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="pb-4">
      {/* جستجو */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی کاربر..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* انتخاب همه */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredUsers.length})</span>
        </div>
      )}

      {/* نوار عملیات گروهی */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button onClick={() => setShowBatchDeleteConfirm(true)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            🗑️ حذف
          </button>
        </div>
      )}

      {/* لیست کاربران */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">کاربری یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(user.id)}
                  onChange={() => toggleSelection(user.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">{user.name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-[10px] text-gray-400">{new Date(user.created_at).toLocaleDateString('fa-IR')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <select
                        value={user.role}
                        onChange={(e) => onUpdateRole(user.id, e.target.value)}
                        className="px-2 py-0.5 text-[10px] border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#800E2F] bg-white"
                      >
                        <option value="user">کاربر</option>
                        <option value="admin">ادمین</option>
                      </select>
                      <button
                        onClick={() => onDelete(user.id)}
                        className="px-2 py-0.5 text-[10px] bg-red-50 text-red-500 rounded hover:bg-red-100 transition"
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog حذف گروهی */}
      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی کاربران"
        message={`آیا از حذف ${selectedItems.length} کاربر انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />
    </div>
  );
}

export default MobileUsersTab;