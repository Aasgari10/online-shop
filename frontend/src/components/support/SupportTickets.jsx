// src/components/support/SupportTickets.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import DOMPurify from 'dompurify';
import { useBottomNav } from '../../context/BottomNavContext';

function SupportTickets() {
  const location = useLocation();
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyMessage, setEditingReplyMessage] = useState('');
  const [editingReplyLoading, setEditingReplyLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ بارگذاری user فقط در کلاینت
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const parsed = user ? JSON.parse(user) : null;
      setUserData(parsed);
      setIsLoggedIn(!!parsed);
      setIsAdmin(parsed?.role === 'admin');
    }
  }, []);

  const renderSafeHTML = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  const fetchTickets = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/tickets', {
        params: { _t: Date.now() }
      });
      if (res.data.success) {
        const ticketsData = res.data.data;
        setTickets(ticketsData);
        await fetchUnreadCount('fetchTickets');
      }
    } catch (error) {
      toast.error('خطا در دریافت تیکت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async (source = 'unknown') => {
    try {
      const res = await api.get('/tickets/unread-count', {
        params: { _t: Date.now() }
      });
      if (res.data.success) {
        const newCount = res.data.data.unreadCount;
        setUnreadCount(newCount);
        window.dispatchEvent(new CustomEvent('ticket-count-update', {
          detail: { unreadCount: newCount, source: source }
        }));
      }
    } catch (error) {
      console.error('❌ [fetchUnreadCount] خطا:', error);
    }
  };

  useEffect(() => {
    fetchTickets();

    const interval = setInterval(() => {
      fetchTickets();
    }, 10000);

    if (location.state?.ticketId) {
      handleViewTicket(location.state.ticketId);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isLoggedIn, location.state]);

  useEffect(() => {
    const handleTicketReplied = (event) => {
      const repliedTicketId = event.detail?.ticketId;
      if (repliedTicketId) {
        fetchTickets();
        fetchUnreadCount('ticketReplied');
        toast.info('پاسخ جدیدی برای تیکت شما ثبت شد!');
      }
    };

    window.addEventListener('ticket-replied', handleTicketReplied);
    return () => {
      window.removeEventListener('ticket-replied', handleTicketReplied);
    };
  }, []);

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('موضوع و پیام نمی‌توانند خالی باشند');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/tickets', { subject, message });
      if (res.data.success) {
        toast.success('تیکت با موفقیت ثبت شد');
        setSubject('');
        setMessage('');
        setShowNewTicket(false);
        await fetchTickets();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        const errorMessages = error.response.data.errors.join('، ');
        toast.error(`خطا: ${errorMessages}`);
      } else {
        toast.error('خطا در ثبت تیکت');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        setReplyMessage('');
        setEditingReplyId(null);
        setEditingReplyMessage('');
        hideBottomNav();

        await fetchTickets();
        await fetchUnreadCount('viewTicket');
        window.dispatchEvent(new Event('ticket-read'));
      }
    } catch (error) {
      console.error('❌ [handleViewTicket] خطا:', error);
      toast.error('خطا در دریافت جزئیات');
    }
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setReplyMessage('');
    setEditingReplyId(null);
    setEditingReplyMessage('');
    showBottomNav();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('پیام پاسخ را وارد کنید');
      return;
    }
    setSubmitting(true);
    try {
      const ticketId = selectedTicket.ticket.id;

      const replyUrl = isAdmin
        ? `/admin/tickets/${ticketId}/reply`
        : `/tickets/${ticketId}/reply`;

      await api.post(replyUrl, { message: replyMessage });

      toast.success('پاسخ با موفقیت ثبت شد');
      setReplyMessage('');

      await fetchTickets();
      await fetchUnreadCount('replyTicket');
      window.dispatchEvent(new Event('ticket-read'));

      const updated = await api.get(`/tickets/${ticketId}`);
      if (updated.data.success) {
        setSelectedTicket(updated.data.data);
      }
    } catch (error) {
      console.error('❌ [handleReply] خطا:', error);
      toast.error(error.response?.data?.message || 'خطا در ثبت پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!window.confirm('آیا از بستن این تیکت مطمئن هستید؟')) return;
    try {
      await api.put(`/tickets/${ticketId}/close`);
      toast.success('تیکت بسته شد');
      await fetchTickets();
      await fetchUnreadCount('closeTicket');
      window.dispatchEvent(new Event('ticket-read'));
      if (selectedTicket) closeModal();
    } catch (error) {
      console.error('❌ [handleCloseTicket] خطا:', error);
      toast.error('خطا در بستن تیکت');
    }
  };

  const handleStartEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditingReplyMessage(reply.message);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyMessage('');
  };

  const handleSaveEditReply = async (replyId) => {
    if (!editingReplyMessage.trim()) {
      toast.error('پیام نمی‌تواند خالی باشد');
      return;
    }
    setEditingReplyLoading(true);
    try {
      await api.put(`/admin/tickets/replies/${replyId}`, {
        message: editingReplyMessage.trim(),
      });
      toast.success('پاسخ با موفقیت ویرایش شد');
      setEditingReplyId(null);
      setEditingReplyMessage('');
      await handleViewTicket(selectedTicket.ticket.id);
      await fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ویرایش پاسخ');
    } finally {
      setEditingReplyLoading(false);
    }
  };

  useEffect(() => {
    const handleExternalUpdate = (event) => {
      if (event.detail?.unreadCount !== undefined) {
        setUnreadCount(event.detail.unreadCount);
      }
    };
    window.addEventListener('ticket-count-updated', handleExternalUpdate);
    return () => window.removeEventListener('ticket-count-updated', handleExternalUpdate);
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-20 h-20 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">برای دسترسی به تیکت‌ها وارد شوید</h2>
          <p className="text-gray-500 mb-6">برای استفاده از سیستم پشتیبانی، لطفاً وارد حساب کاربری خود شوید.</p>
          <Link to="/login" className="inline-block bg-[#800E2F] hover:bg-[#6B0A26] text-white px-8 py-3 rounded-xl font-medium transition">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  const canReply = () => {
    if (!selectedTicket) return false;
    if (selectedTicket.ticket.status === 'closed') return false;
    if (isAdmin) return true;
    return selectedTicket.ticket.user_id === userData?.id;
  };

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">تیکت‌های من</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              {unreadCount} خوانده‌نشده
            </span>
            <Link to="/support" className="text-[#800E2F] hover:underline">
              بازگشت به پشتیبانی
            </Link>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-blue-700 text-sm">
            <span className="font-bold">👋 حالت ادمین:</span> شما می‌توانید به همه تیکت‌ها پاسخ دهید. همچنین
            <Link to="/admin" className="text-[#800E2F] font-bold mx-1 hover:underline">پنل مدیریت</Link>
            را برای مشاهده همه تیکت‌ها بررسی کنید.
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowNewTicket(!showNewTicket)}
            className="bg-[#800E2F] text-white px-6 py-2.5 rounded-lg hover:bg-[#6B0A26] transition"
          >
            {showNewTicket ? '✕ لغو' : '➕ ثبت تیکت جدید'}
          </button>
          <button
            onClick={() => fetchUnreadCount('manual')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg transition"
          >
            🔄 بروزرسانی شمارنده
          </button>
        </div>

        {showNewTicket && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">تیکت جدید</h2>
            <form onSubmit={handleSubmitTicket}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">موضوع</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">پیام</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#800E2F] text-white px-6 py-2 rounded-lg hover:bg-[#6B0A26] transition disabled:opacity-50"
              >
                {submitting ? 'در حال ارسال...' : 'ارسال تیکت'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>هیچ تیکتی ثبت نشده است.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tickets.map((ticket) => {
                const isUnread = !ticket.is_read && ticket.user_id === userData?.id && ticket.status !== 'closed';
                return (
                  <li
                    key={ticket.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${isUnread ? 'bg-[#800E2F]/5' : ''}`}
                    onClick={() => handleViewTicket(ticket.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isUnread && <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>}
                          <h3 className={`font-bold truncate ${isUnread ? 'text-[#800E2F]' : 'text-gray-800'}`}>
                            {ticket.subject}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(ticket.created_at).toLocaleDateString('fa-IR')}
                          {' - '}
                          {ticket.replies_count || 0} پاسخ
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ticket.status === 'closed'
                            ? 'bg-gray-300 text-gray-700'
                            : ticket.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {ticket.status === 'closed'
                          ? 'بسته شده'
                          : ticket.status === 'in_progress'
                          ? 'در حال بررسی'
                          : 'باز'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectedTicket && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleOverlayClick}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold truncate">{selectedTicket.ticket.subject}</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">
                  &times;
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800 text-sm">{selectedTicket.ticket.user_name}</span>
                  <span className="text-[8px] bg-gray-400 text-white px-1.5 py-0.5 rounded-full">کاربر</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">
                  <span dangerouslySetInnerHTML={renderSafeHTML(selectedTicket.ticket.message)} />
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(selectedTicket.ticket.created_at).toLocaleString('fa-IR')}
                </p>
              </div>

              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h3 className="font-bold text-gray-700">پاسخ‌ها</h3>
                  {selectedTicket.replies.map((reply) => {
                    const isEditing = editingReplyId === reply.id;
                    const isOwnReply = reply.is_admin && reply.user_id === userData?.id;

                    return (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-lg ${
                          reply.is_admin ? 'bg-[#800E2F]/10 border-r-4 border-[#800E2F]' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{reply.user_name}</span>
                            {reply.is_admin && (
                              <span className="text-xs bg-[#800E2F] text-white px-2 py-0.5 rounded-full">ادمین</span>
                            )}
                            <span className="text-gray-400 text-xs">
                              {new Date(reply.created_at).toLocaleString('fa-IR')}
                            </span>
                            {reply.updated_at && reply.updated_at !== reply.created_at && (
                              <span className="text-xs text-gray-400">
                                (ویرایش‌شده: {new Date(reply.updated_at).toLocaleString('fa-IR')})
                              </span>
                            )}
                          </div>
                          {isOwnReply && !isEditing && (
                            <button
                              onClick={() => handleStartEditReply(reply)}
                              className="text-xs text-blue-500 hover:text-blue-700 transition"
                            >
                              ✏️ ویرایش
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-2">
                            <textarea
                              value={editingReplyMessage}
                              onChange={(e) => setEditingReplyMessage(e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
                              disabled={editingReplyLoading}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveEditReply(reply.id)}
                                disabled={editingReplyLoading}
                                className="px-3 py-1 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50"
                              >
                                {editingReplyLoading ? 'در حال ذخیره...' : '💾 ذخیره'}
                              </button>
                              <button
                                onClick={handleCancelEditReply}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                              >
                                انصراف
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                            <span dangerouslySetInnerHTML={renderSafeHTML(reply.message)} />
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {canReply() && (
                <form onSubmit={handleReply} className="mt-4 border-t pt-4">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows="3"
                    placeholder="پاسخ خود را بنویسید..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50 resize-y"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-[#800E2F] hover:bg-[#6B0A26] text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
                    >
                      {submitting ? '...' : 'ارسال پاسخ'}
                    </button>
                    {selectedTicket.ticket.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={() => handleCloseTicket(selectedTicket.ticket.id)}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg font-medium transition"
                      >
                        بستن تیکت
                      </button>
                    )}
                  </div>
                </form>
              )}

              {selectedTicket.ticket.status === 'closed' && (
                <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  این تیکت بسته شده است.
                </div>
              )}

              {!canReply() && selectedTicket.ticket.status !== 'closed' && !isAdmin && (
                <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  شما فقط می‌توانید به تیکت‌های خود پاسخ دهید.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupportTickets;