// src/components/admin/tabs/MobileOrdersTab.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../../utils/formatPrice';
import toast from 'react-hot-toast';
import api from '../../../services/api';

function MobileOrdersTab({ orders, onUpdateStatus, onDelete, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchStatusConfirm, setShowBatchStatusConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const statusOptions = ['در انتظار پرداخت', 'پرداخت شده', 'ارسال شده', 'تحویل داده شده', 'لغو شده'];

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.id.toString().includes(searchTerm) ||
      o.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter ? o.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      'تحویل داده شده': 'bg-green-100 text-green-700',
      'ارسال شده': 'bg-blue-100 text-blue-700',
      'پرداخت شده': 'bg-yellow-100 text-yellow-700',
      'در انتظار پرداخت': 'bg-orange-100 text-orange-700',
      'لغو شده': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // ===== انتخاب گروهی =====
  const toggleSelection = (id) => {
    console.log('🔄 [MobileOrdersTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredOrders.length && filteredOrders.length > 0);
      setShowBatchActions(newSelection.length > 0);
      console.log('📊 [MobileOrdersTab] تعداد انتخاب‌شده:', newSelection.length);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileOrdersTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchActions(false);
      console.log('📊 [MobileOrdersTab] همه انتخاب‌ها لغو شد');
    } else {
      const ids = filteredOrders.map(o => o.id);
      setSelectedItems(ids);
      setSelectAll(true);
      setShowBatchActions(true);
      console.log('📊 [MobileOrdersTab] تعداد انتخاب‌شده (همه):', ids.length);
    }
  };

  // ============================================================
  // ✅ حذف گروهی - مستقیماً API صدا زده می‌شود (بدون استفاده از onDelete)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileOrdersTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} سفارش...`);

    try {
      // ✅ عملیات حذف گروهی با Promise.all
      const deletePromises = selectedItems.map(id => {
        console.log(`🗑️ [MobileOrdersTab] حذف سفارش ${id}`);
        return api.delete(`/admin/orders/${id}`);
      });
      await Promise.all(deletePromises);

      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} سفارش با موفقیت حذف شدند`);
      console.log('✅ [MobileOrdersTab] حذف گروهی با موفقیت انجام شد');

      // ریست انتخاب‌ها
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchActions(false);
      setShowBatchDeleteConfirm(false);

      // رفرش لیست
      if (onRefresh) {
        console.log('🔄 [MobileOrdersTab] فراخوانی onRefresh');
        await onRefresh();
      }
    } catch (error) {
      console.error('❌ [MobileOrdersTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی سفارشات');
    } finally {
      setBatchLoading(false);
    }
  };

  // ============================================================
  // ✅ تغییر وضعیت گروهی - مستقیماً API صدا زده می‌شود (بدون استفاده از onUpdateStatus)
  // ============================================================
  const handleBatchStatusChange = async () => {
    if (selectedItems.length === 0 || !batchStatus) {
      console.warn('⚠️ [MobileOrdersTab] هیچ آیتمی انتخاب نشده یا وضعیت مشخص نیست');
      return;
    }
    console.log('🔄 [MobileOrdersTab] شروع تغییر وضعیت گروهی، تعداد:', selectedItems.length, 'وضعیت:', batchStatus);

    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال تغییر وضعیت ${selectedItems.length} سفارش...`);

    try {
      const statusPromises = selectedItems.map(id => {
        console.log(`🔄 [MobileOrdersTab] تغییر وضعیت سفارش ${id} به ${batchStatus}`);
        return api.put(`/admin/orders/${id}/status`, { status: batchStatus });
      });
      await Promise.all(statusPromises);

      toast.dismiss(loadingToast);
      toast.success(`وضعیت ${selectedItems.length} سفارش با موفقیت تغییر کرد`);
      console.log('✅ [MobileOrdersTab] تغییر وضعیت گروهی با موفقیت انجام شد');

      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchActions(false);
      setShowBatchStatusConfirm(false);

      if (onRefresh) {
        console.log('🔄 [MobileOrdersTab] فراخوانی onRefresh');
        await onRefresh();
      }
    } catch (error) {
      console.error('❌ [MobileOrdersTab] خطا در تغییر وضعیت گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در تغییر وضعیت گروهی سفارشات');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="pb-4">
      {/* ===== نوار جستجو و فیلتر ===== */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی سفارش..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex-shrink-0"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl p-3 border border-gray-200 mb-3">
          <div className="space-y-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
            >
              <option value="">همه وضعیت‌ها</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => { setStatusFilter(''); setSearchTerm(''); }}
              className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
            >
              حذف همه فیلترها
            </button>
          </div>
        </div>
      )}

      {/* ===== چک‌باکس انتخاب همه ===== */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredOrders.length})</span>
        </div>
      )}

      {/* ===== نوار عملیات گروهی ===== */}
      {showBatchActions && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <select
            value={batchStatus}
            onChange={(e) => setBatchStatus(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#800E2F] bg-white"
          >
            <option value="">تغییر وضعیت...</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => setShowBatchStatusConfirm(true)}
            disabled={!batchStatus}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            اعمال
          </button>
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            🗑️
          </button>
        </div>
      )}

      {/* ===== لیست سفارشات ===== */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">سفارشی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(order.id)}
                  onChange={() => toggleSelection(order.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 text-sm bg-gray-100 px-2 py-0.5 rounded">#{order.id}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{order.user_name || 'کاربر'}</span>
                    <span className="font-bold text-[#800E2F]">{formatPrice(order.total_price)} ت</span>
                  </div>
                  {order.tracking_code && (
                    <div className="text-[10px] text-gray-400 mb-2">کد پیگیری: <span className="font-mono">{order.tracking_code}</span></div>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                      className="flex-1 px-2 py-1 text-[10px] border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#800E2F] bg-white"
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Link to={`/order/${order.id}`} className="px-3 py-1 text-[10px] bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                      👁️
                    </Link>
                    <button
                      onClick={() => onDelete(order.id)}
                      className="px-3 py-1 text-[10px] bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Confirm Dialog حذف گروهی ===== */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">⚠️ حذف گروهی</h3>
            <p className="text-sm text-gray-600 mb-4">آیا از حذف {selectedItems.length} سفارش انتخاب‌شده مطمئن هستید؟</p>
            <div className="flex gap-3">
              <button onClick={handleBatchDelete} disabled={batchLoading} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50">
                {batchLoading ? '...' : 'بله، حذف کن'}
              </button>
              <button onClick={() => setShowBatchDeleteConfirm(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirm Dialog تغییر وضعیت گروهی ===== */}
      {showBatchStatusConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🔄 تغییر وضعیت گروهی</h3>
            <p className="text-sm text-gray-600 mb-4">آیا از تغییر وضعیت {selectedItems.length} سفارش به "{batchStatus}" مطمئن هستید؟</p>
            <div className="flex gap-3">
              <button onClick={handleBatchStatusChange} disabled={batchLoading} className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50">
                {batchLoading ? '...' : 'بله، تغییر بده'}
              </button>
              <button onClick={() => setShowBatchStatusConfirm(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileOrdersTab;