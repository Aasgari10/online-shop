// src/components/admin/tabs/OrdersTab.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../../utils/formatPrice';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import PageHeader from '../../shared/PageHeader';

function OrdersTab({ orders: initialOrders, onUpdateStatus, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [orders, setOrders] = useState(initialOrders || []);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchStatusConfirm, setShowBatchStatusConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setOrders(initialOrders || []);
  }, [initialOrders]);

  const filteredOrders = orders.filter(o =>
    o.id.toString().includes(searchTerm) ||
    o.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const markOrderAsRead = async (orderId) => {
    try {
      await api.put(`/admin/orders/${orderId}/read`);
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId ? { ...o, is_admin_read: true } : o
        )
      );
      window.dispatchEvent(new CustomEvent('order-read', { detail: { orderId } }));
    } catch (error) {
      console.error('❌ خطا در علامت‌گذاری سفارش:', error);
    }
  };

  const markAllOrdersAsRead = async () => {
    try {
      await api.put('/admin/orders/mark-read');
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.status === 'پرداخت شده' ? { ...o, is_admin_read: true } : o
        )
      );
      window.dispatchEvent(new CustomEvent('order-read'));
      toast.success('همه سفارشات به عنوان خوانده‌شده علامت‌گذاری شدند');
    } catch (error) {
      console.error('❌ خطا در علامت‌گذاری گروهی:', error);
    }
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredOrders.length && filteredOrders.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredOrders.map(o => o.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSingleDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmSingleDelete = async () => {
    setDeleteLoading(true);
    try {
      await onDelete(deleteTargetId);
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (error) {
      // error handled in onDelete
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ اصلاح شده: selectedItems رو به id تبدیل کن
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      const ids = selectedItems.map(item => typeof item === 'object' ? item.id : item);
      const promises = ids.map(id => api.delete(`/admin/orders/${id}`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} سفارش با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      const res = await api.get('/admin/orders');
      if (res.data.success) {
        setOrders(res.data.data);
        if (onDelete) onDelete(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در حذف گروهی سفارشات');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchStatusChange = async () => {
    if (selectedItems.length === 0 || !batchStatus) return;
    setBatchLoading(true);
    try {
      const ids = selectedItems.map(item => typeof item === 'object' ? item.id : item);
      const promises = ids.map(id => api.put(`/admin/orders/${id}/status`, { status: batchStatus }));
      await Promise.all(promises);
      toast.success(`وضعیت ${selectedItems.length} سفارش به "${batchStatus}" تغییر یافت`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchStatusConfirm(false);
      const res = await api.get('/admin/orders');
      if (res.data.success) {
        setOrders(res.data.data);
        if (onDelete) onDelete(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در تغییر وضعیت گروهی سفارشات');
    } finally {
      setBatchLoading(false);
    }
  };

  const statusOptions = ['در انتظار پرداخت', 'پرداخت شده', 'ارسال شده', 'تحویل داده شده', 'لغو شده'];

  return (
    <div>
      <PageHeader 
        title="📋 مدیریت سفارشات" 
        subtitle="پیگیری و مدیریت تمام سفارشات" 
        className="mt-3"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 mr-2 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={markAllOrdersAsRead}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
          >
            ✅ همه را خوانده‌شده علامت‌گذاری کن
          </button>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو..."
            className="w-56 px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          
          {selectedItems.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <select
                  value={batchStatus}
                  onChange={(e) => setBatchStatus(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
                >
                  <option value="">تغییر وضعیت...</option>
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={() => setShowBatchStatusConfirm(true)}
                  disabled={!batchStatus}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50"
                >
                  اعمال ({selectedItems.length})
                </button>
              </div>
              <button
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                🗑️ حذف ({selectedItems.length})
              </button>
            </>
          )}
        </div>
      </div>

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
                  disabled={filteredOrders.length === 0}
                />
              </th>
              <th className="text-right py-2 px-3">#</th>
              <th className="text-right py-2 px-3">کد پیگیری</th>
              <th className="text-right py-2 px-3">کاربر</th>
              <th className="text-right py-2 px-3">مبلغ</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">تاریخ</th>
              <th className="text-right py-2 px-3">جزئیات</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8 text-gray-500">
                  {searchTerm ? 'سفارشی با این مشخصات یافت نشد' : 'سفارشی یافت نشد'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const isUnread = o.status === 'پرداخت شده' && !o.is_admin_read;
                
                return (
                  <tr 
                    key={o.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50/50 transition ${isUnread ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(o.id)}
                        onChange={() => toggleSelection(o.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                      />
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-800 flex items-center gap-2">
                      #{o.id}
                      {isUnread && (
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-[#800E2F]">{o.tracking_code || '---'}</td>
                    <td className="py-2 px-3 text-gray-600">{o.user_name || 'کاربر'}</td>
                    <td className="py-2 px-3 text-right">
                      {o.has_discount || o.discount_amount > 0 ? (
                        <div className="flex flex-col items-end">
                          {o.original_total_price && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(o.original_total_price)} ت
                            </span>
                          )}
                          <span className="text-[#800E2F] font-bold">
                            {formatPrice(o.total_price)} ت
                          </span>
                          {o.discount_amount > 0 && (
                            <span className="text-xs text-green-600">
                              تخفیف کد: {formatPrice(o.discount_amount)} ت
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#800E2F] font-medium">{formatPrice(o.total_price)} ت</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={o.status}
                        onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border-0 focus:ring-1 focus:ring-[#800E2F] ${
                          o.status === 'تحویل داده شده' ? 'bg-green-100 text-green-700' :
                          o.status === 'ارسال شده' ? 'bg-blue-100 text-blue-700' :
                          o.status === 'پرداخت شده' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleDateString('fa-IR')}</td>
                    <td className="py-2 px-3">
                      <Link 
                        to={`/order/${o.id}`} 
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition whitespace-nowrap"
                        onClick={() => {
                          if (isUnread) {
                            markOrderAsRead(o.id);
                          }
                        }}
                      >
                        👁️ جزئیات
                      </Link>
                    </td>
                    <td className="py-2 px-3">
                      <button 
                        onClick={() => handleSingleDelete(o.id)} 
                        className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition"
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CustomConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmSingleDelete}
        title="⚠️ حذف سفارش"
        message="آیا از انتقال این سفارش به سطل زباله مطمئن هستید؟"
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={deleteLoading}
      />

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی سفارشات"
        message={`آیا از حذف ${selectedItems.length} سفارش انتخاب‌شده مطمئن هستید؟ این سفارشات به سطل زباله منتقل خواهند شد.`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      <CustomConfirm
        isOpen={showBatchStatusConfirm}
        onClose={() => setShowBatchStatusConfirm(false)}
        onConfirm={handleBatchStatusChange}
        title="🔄 تغییر وضعیت گروهی"
        message={`آیا از تغییر وضعیت ${selectedItems.length} سفارش به "${batchStatus}" مطمئن هستید؟`}
        confirmText="بله، تغییر بده"
        cancelText="انصراف"
        variant="info"
        loading={batchLoading}
      />
    </div>
  );
}

export default OrdersTab;