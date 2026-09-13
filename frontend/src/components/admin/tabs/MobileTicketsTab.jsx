// src/components/admin/tabs/MobileTicketsTab.jsx
import { useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import { useBottomNav } from '../../../context/BottomNavContext';

function MobileTicketsTab({ tickets, onDelete, onRefresh }) {
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchCloseConfirm, setShowBatchCloseConfirm] = useState(false);
  const [showBatchReadConfirm, setShowBatchReadConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toString().includes(searchTerm)
  );

  const getStatusBadge = (status) => {
    const classes = {
      'open': 'bg-green-100 text-green-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'closed': 'bg-gray-300 text-gray-700',
    };
    const labels = { 'open': 'باز', 'in_progress': 'در حال بررسی', 'closed': 'بسته شده' };
    return <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${classes[status] || 'bg-gray-100 text-gray-700'}`}>{labels[status] || status}</span>;
  };

  // ===== انتخاب گروهی =====
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
      setSelectAll(false);
    } else {
      setSelectedItems(filteredTickets.map(t => t.id));
      setSelectAll(true);
    }
  };

  // ===== عملیات گروهی =====
  const handleBatchDelete = async () => {
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => onDelete(id));
      await Promise.all(promises);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
    } catch (error) {
      // خطا مدیریت شده
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchClose = async () => {
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.put(`/tickets/${id}/close`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} تیکت بسته شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchCloseConfirm(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('خطا در بستن گروهی تیکت‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchRead = async () => {
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.put(`/tickets/${id}/read`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} تیکت خوانده‌شده علامت‌گذاری شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchReadConfirm(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('خطا در علامت‌گذاری گروهی');
    } finally {
      setBatchLoading(false);
    }
  };

  // ===== پاسخ به تیکت (مودال) =====
  const handleOpenReply = async (ticketId) => {
    setLoadingTicket(true);
    setShowReplyModal(true);
    hideBottomNav();
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        setReplyMessage('');
        await api.put(`/tickets/${ticketId}/read`);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error('خطا در دریافت جزئیات تیکت');
      setShowReplyModal(false);
      showBottomNav();
    } finally {
      setLoadingTicket(false);
    }
  };

  const closeReplyModal = () => {
    setShowReplyModal(false);
    setSelectedTicket(null);
    setReplyMessage('');
    showBottomNav();
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('پیام پاسخ را وارد کنید');
      return;
    }
    setSubmittingReply(true);
    try {
      await api.post(`/admin/tickets/${selectedTicket.ticket.id}/reply`, {
        message: replyMessage.trim(),
      });
      await api.put(`/tickets/${selectedTicket.ticket.id}/read`);
      toast.success('پاسخ با موفقیت ثبت شد');
      setReplyMessage('');
      const res = await api.get(`/tickets/${selectedTicket.ticket.id}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
      }
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('خطا در ثبت پاسخ');
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderConversation = () => {
    if (!selectedTicket) return null;
    const { ticket, replies } = selectedTicket;
    const allMessages = [
      { ...ticket, is_admin: false, is_initial: true, user_name: ticket.user_name },
      ...(replies || []).map(r => ({ ...r, is_initial: false })),
    ];

    return allMessages.map((msg) => (
      <div key={msg.id} className={`flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msg.is_admin ? 'bg-[#800E2F] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`font-bold text-xs ${msg.is_admin ? 'text-white' : 'text-gray-700'}`}>{msg.user_name}</span>
            {msg.is_admin && <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">ادمین</span>}
            {msg.is_initial && <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${msg.is_admin ? 'bg-white/20 text-white' : 'bg-gray-400 text-white'}`}>اولیه</span>}
          </div>
          <p className={`whitespace-pre-wrap text-xs leading-relaxed ${msg.is_admin ? 'text-white' : 'text-gray-800'}`}>{msg.message}</p>
          <span className={`text-[8px] mt-1 block ${msg.is_admin ? 'text-white/70' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleString('fa-IR')}</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="pb-4">
      {/* ===== جستجو ===== */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی تیکت..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* ===== نوار عملیات گروهی ===== */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20 flex-wrap">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button onClick={() => setShowBatchReadConfirm(true)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            📖 خوانده‌شده
          </button>
          <button onClick={() => setShowBatchCloseConfirm(true)} className="px-2 py-1 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
            🔒 بستن
          </button>
          <button onClick={() => setShowBatchDeleteConfirm(true)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            🗑️ حذف
          </button>
        </div>
      )}

      {/* ===== لیست تیکت‌ها ===== */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">تیکتی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(ticket.id)}
                  onChange={() => toggleSelection(ticket.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!ticket.is_read_by_admin && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>}
                        <h3 className="font-medium text-gray-800 text-sm truncate">{ticket.subject}</h3>
                      </div>
                      <p className="text-xs text-gray-500">{ticket.user_name || 'کاربر'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(ticket.status)}
                        <span className="text-[9px] text-gray-400">{ticket.replies_count || 0} پاسخ</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {ticket.status !== 'closed' && (
                        <button onClick={() => handleOpenReply(ticket.id)} className="px-2 py-1 text-[10px] bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          پاسخ
                        </button>
                      )}
                      <button onClick={() => onDelete(ticket.id)} className="px-2 py-1 text-[10px] bg-red-50 text-red-500 rounded hover:bg-red-100 transition">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Confirm Dialogs ===== */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">⚠️ حذف گروهی تیکت‌ها</h3>
            <p className="text-sm text-gray-600 mb-4">آیا از حذف {selectedItems.length} تیکت انتخاب‌شده مطمئن هستید؟</p>
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

      {showBatchCloseConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🔒 بستن گروهی تیکت‌ها</h3>
            <p className="text-sm text-gray-600 mb-4">آیا از بستن {selectedItems.length} تیکت انتخاب‌شده مطمئن هستید؟</p>
            <div className="flex gap-3">
              <button onClick={handleBatchClose} disabled={batchLoading} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50">
                {batchLoading ? '...' : 'بله، بستن'}
              </button>
              <button onClick={() => setShowBatchCloseConfirm(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchReadConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">📖 علامت‌گذاری گروهی</h3>
            <p className="text-sm text-gray-600 mb-4">آیا از علامت‌گذاری {selectedItems.length} تیکت به‌عنوان خوانده‌شده مطمئن هستید؟</p>
            <div className="flex gap-3">
              <button onClick={handleBatchRead} disabled={batchLoading} className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50">
                {batchLoading ? '...' : 'بله، علامت‌گذاری'}
              </button>
              <button onClick={() => setShowBatchReadConfirm(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== مودال پاسخ به تیکت ===== */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4" onClick={(e) => { if (e.target === e.currentTarget) closeReplyModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">پاسخ به تیکت</h3>
              <button onClick={closeReplyModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            {loadingTicket ? <Spinner size="md" /> : (
              <>
                {selectedTicket && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">موضوع:</span>
                      <span className="text-sm font-medium text-gray-800">{selectedTicket.ticket.subject}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">وضعیت:</span>
                      {getStatusBadge(selectedTicket.ticket.status)}
                    </div>
                  </div>
                )}
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    تاریخچه گفتگو
                  </h4>
                  {renderConversation()}
                </div>
                {selectedTicket?.ticket?.status !== 'closed' && (
                  <form onSubmit={handleReplySubmit} className="border-t border-gray-200 pt-3">
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">پاسخ شما</label>
                      <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows="3" placeholder="پاسخ خود را بنویسید..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white resize-none" required />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={submittingReply} className="flex-1 py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-xl font-medium text-sm transition disabled:opacity-50">
                        {submittingReply ? 'در حال ارسال...' : 'ارسال پاسخ'}
                      </button>
                      <button type="button" onClick={closeReplyModal} className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium text-sm transition">
                        انصراف
                      </button>
                    </div>
                  </form>
                )}
                {selectedTicket?.ticket?.status === 'closed' && (
                  <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    این تیکت بسته شده است و نمی‌توان پاسخ داد.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileTicketsTab;