// src/components/admin/tabs/TicketsTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import PageHeader from '../../shared/PageHeader';

function TicketsTab({ tickets: initialTickets, onDelete, onView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchCloseConfirm, setShowBatchCloseConfirm] = useState(false);
  const [showBatchMarkReadConfirm, setShowBatchMarkReadConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [tickets, setTickets] = useState(initialTickets || []);

  // State برای حذف تکی
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setTickets(initialTickets || []);
  }, [initialTickets]);

  useEffect(() => {
    const handleTicketReplied = (event) => {
      const repliedTicketId = event.detail?.ticketId;
      if (repliedTicketId) {
        const refreshTickets = async () => {
          try {
            const res = await api.get('/admin/tickets');
            if (res.data.success) {
              setTickets(res.data.data);
            }
          } catch (error) {
            console.error('❌ [TicketsTab] خطا در به‌روزرسانی تیکت‌ها:', error);
          }
        };
        refreshTickets();
      }
    };

    window.addEventListener('ticket-replied', handleTicketReplied);
    return () => {
      window.removeEventListener('ticket-replied', handleTicketReplied);
    };
  }, []);

  const filteredTickets = tickets.filter(t =>
    t.id.toString().includes(searchTerm) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredTickets.length && filteredTickets.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredTickets.map(t => t.id));
    }
    setSelectAll(!selectAll);
  };

  // ============================================================
  // ✅ حذف تکی با مودال کاستوم
  // ============================================================
  const handleSingleDelete = (id) => {
    console.log('🗑️ [TicketsTab] handleSingleDelete با id:', id);
    if (typeof id !== 'number' && !/^\d+$/.test(String(id))) {
      console.error('❌ [TicketsTab] شناسه نامعتبر برای حذف تکی:', id);
      toast.error('شناسه تیکت نامعتبر است');
      return;
    }
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmSingleDelete = async () => {
    console.log('🗑️ [TicketsTab] confirmSingleDelete برای id:', deleteTargetId);
    setDeleteLoading(true);
    try {
      // فقط عدد را به onDelete بفرست
      await onDelete(deleteTargetId);
      console.log('✅ [TicketsTab] onDelete با موفقیت انجام شد');
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error('❌ [TicketsTab] خطا در حذف:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API را صدا می‌زند، نه onDelete)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.delete(`/admin/tickets/${id}`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} تیکت با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      const res = await api.get('/admin/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در حذف گروهی تیکت‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchClose = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.put(`/tickets/${id}/close`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} تیکت با موفقیت بسته شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchCloseConfirm(false);
      const res = await api.get('/admin/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در بستن گروهی تیکت‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchMarkRead = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.put(`/tickets/${id}/read`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} تیکت به‌عنوان خوانده‌شده علامت‌گذاری شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchMarkReadConfirm(false);
      const res = await api.get('/admin/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در علامت‌گذاری گروهی');
    } finally {
      setBatchLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      'open': 'bg-green-100 text-green-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'closed': 'bg-gray-300 text-gray-700',
    };
    const labels = {
      'open': 'باز',
      'in_progress': 'در حال بررسی',
      'closed': 'بسته شده',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>;
  };

  return (
    <div>
      <PageHeader 
        title="🎫 مدیریت تیکت‌ها" 
        subtitle="پاسخ به تیکت‌های پشتیبانی کاربران" 
        className="mt-3"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex pt-3 pr-2.5 items-center gap-2 flex-wrap">
          {selectedItems.length > 0 && (
            <>
              <button
                onClick={() => setShowBatchMarkReadConfirm(true)}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
              >
                📖 خوانده‌شده ({selectedItems.length})
              </button>
              <button
                onClick={() => setShowBatchCloseConfirm(true)}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
              >
                🔒 بستن ({selectedItems.length})
              </button>
              <button
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                🗑️ حذف ({selectedItems.length})
              </button>
            </>
          )}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو..."
            className="w-56 px-3 py-1.5 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
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
                  disabled={filteredTickets.length === 0}
                />
              </th>
              <th className="text-right py-2 px-3">#</th>
              <th className="text-right py-2 px-3">کاربر</th>
              <th className="text-right py-2 px-3">موضوع</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">پاسخ‌ها</th>
              <th className="text-right py-2 px-3">تاریخ</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="py-2 px-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(t.id)}
                    onChange={() => toggleSelection(t.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  />
                </td>
                <td className="py-2 px-3 font-medium text-gray-800">#{t.id}</td>
                <td className="py-2 px-3 text-gray-600">{t.user_name || 'کاربر'}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    {!t.is_read_by_admin && (
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
                    )}
                    <span className={`font-medium ${!t.is_read_by_admin ? 'text-[#800E2F]' : 'text-gray-800'}`}>
                      {t.subject}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">{getStatusBadge(t.status)}</td>
                <td className="py-2 px-3 text-gray-600">{t.replies_count || 0}</td>
                <td className="py-2 px-3 text-gray-500 text-xs">
                  {new Date(t.created_at).toLocaleDateString('fa-IR')}
                </td>
                <td className="py-2 px-3 flex gap-2">
                  <button onClick={() => onView?.(t.id)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition">
                    👁️ جزئیات
                  </button>
                  <button 
                    onClick={() => handleSingleDelete(t.id)} 
                    className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition"
                  >
                    🗑️ حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTickets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'تیکتی با این مشخصات یافت نشد' : 'هیچ تیکتی یافت نشد'}
          </div>
        )}
      </div>

      {/* ============================================================
          ✅ Confirm Dialogs
          ============================================================ */}
      
      <CustomConfirm
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={confirmSingleDelete}
        title="⚠️ حذف تیکت"
        message="آیا از انتقال این تیکت به سطل زباله مطمئن هستید؟"
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={deleteLoading}
      />

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی تیکت‌ها"
        message={`آیا از حذف ${selectedItems.length} تیکت انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      <CustomConfirm
        isOpen={showBatchCloseConfirm}
        onClose={() => setShowBatchCloseConfirm(false)}
        onConfirm={handleBatchClose}
        title="🔒 بستن گروهی تیکت‌ها"
        message={`آیا از بستن ${selectedItems.length} تیکت انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، بستن"
        cancelText="انصراف"
        variant="warning"
        loading={batchLoading}
      />

      <CustomConfirm
        isOpen={showBatchMarkReadConfirm}
        onClose={() => setShowBatchMarkReadConfirm(false)}
        onConfirm={handleBatchMarkRead}
        title="📖 علامت‌گذاری گروهی"
        message={`آیا از علامت‌گذاری ${selectedItems.length} تیکت به‌عنوان خوانده‌شده مطمئن هستید؟`}
        confirmText="بله، علامت‌گذاری"
        cancelText="انصراف"
        variant="info"
        loading={batchLoading}
      />
    </div>
  );
}

export default TicketsTab;