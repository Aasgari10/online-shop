// src/components/support/MobileSupportTickets.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import DOMPurify from 'dompurify';
import { useBottomNav } from '../../context/BottomNavContext';

function MobileSupportTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submittingNew, setSubmittingNew] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [initialTicketId, setInitialTicketId] = useState(null);
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

  useEffect(() => {
    if (isAdmin) {
      toast.info('لطفاً از پنل مدیریت به تیکت‌ها دسترسی پیدا کنید');
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (location.state?.ticketId) {
      setInitialTicketId(location.state.ticketId);
    }
  }, [location.state]);

  const fetchTickets = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
        if (initialTicketId) {
          const found = res.data.data.find(t => t.id === initialTicketId);
          if (found) {
            handleViewTicket(initialTicketId);
          }
          setInitialTicketId(null);
        }
      }
    } catch (error) {
      console.error('خطا در دریافت تیکت‌ها:', error);
      toast.error('خطا در دریافت تیکت‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [isLoggedIn]);

  const handleViewTicket = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        setShowDetail(true);
        setReplyMessage('');
        hideBottomNav();
        const ticket = res.data.data.ticket;
        if (!ticket.is_read_by_user) {
          await api.put(`/tickets/${ticketId}/read`);
          await fetchTickets();
        }
      }
    } catch (error) {
      toast.error('خطا در دریافت جزئیات');
    }
  };

  const closeModal = () => {
    setShowDetail(false);
    setSelectedTicket(null);
    setReplyMessage('');
    showBottomNav();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('پیام پاسخ را وارد کنید');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/tickets/${selectedTicket.ticket.id}/reply`, {
        message: replyMessage.trim(),
      });
      await api.put(`/tickets/${selectedTicket.ticket.id}/read`);
      toast.success('پاسخ با موفقیت ثبت شد');
      setReplyMessage('');
      const res = await api.get(`/tickets/${selectedTicket.ticket.id}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
      }
      await fetchTickets();
    } catch (error) {
      toast.error('خطا در ثبت پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!confirm('آیا از بستن این تیکت مطمئن هستید؟')) return;
    try {
      await api.put(`/tickets/${ticketId}/close`);
      await api.put(`/tickets/${ticketId}/read`);
      toast.success('تیکت بسته شد');
      closeModal();
      await fetchTickets();
    } catch (error) {
      toast.error('خطا در بستن تیکت');
    }
  };

  const handleNewTicketSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('موضوع و پیام نمی‌توانند خالی باشند');
      return;
    }
    setSubmittingNew(true);
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
      toast.error('خطا در ثبت تیکت');
    } finally {
      setSubmittingNew(false);
    }
  };

  const renderSafeHTML = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">برای دسترسی به تیکت‌ها وارد شوید</h2>
          <p className="text-sm text-gray-500 mb-6">لطفاً وارد حساب کاربری خود شوید تا تیکت‌های پشتیبانی را مشاهده و مدیریت کنید.</p>
          <Link to="/login" className="inline-block bg-[#800E2F] hover:bg-[#6B0A26] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-[#E8DCC8] pb-24">
      <div className="sticky top-0 z-30 bg-[#E8DCC8] px-4 py-3 flex items-center justify-between border-b border-gray-200/60">
        <button onClick={() => navigate(-1)} className="p-1 -mr-2">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          تیکت‌های من
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <div className="w-6"></div>
      </div>

      <div className="mx-1 mt-3">
        <button
          onClick={() => setShowNewTicket(!showNewTicket)}
          className="w-full py-2.5 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
        >
          {showNewTicket ? '✕ لغو' : '➕ تیکت جدید'}
        </button>
      </div>

      {showNewTicket && (
        <div className="mx-1 mt-3 bg-white rounded-2xl p-4 border border-gray-200/60 shadow-sm">
          <form onSubmit={handleNewTicketSubmit}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">موضوع *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="موضوع درخواست خود را وارد کنید"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">پیام *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                placeholder="توضیحات کامل درخواست خود را بنویسید..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white resize-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submittingNew}
              className="w-full py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {submittingNew ? 'در حال ارسال...' : 'ارسال تیکت'}
            </button>
          </form>
        </div>
      )}

      <div className="mx-1 mt-3 space-y-3">
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-200/60 shadow-sm">
            <p className="text-sm text-gray-500">هیچ تیکتی ثبت نشده است.</p>
            <p className="text-xs text-gray-400 mt-1">برای دریافت پاسخ کارشناسان، تیکت جدید ثبت کنید.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const isUnread = !ticket.is_read_by_user;
            return (
              <div
                key={ticket.id}
                onClick={() => handleViewTicket(ticket.id)}
                className={`bg-white rounded-2xl p-3 border shadow-sm cursor-pointer transition ${
                  isUnread ? 'border-[#800E2F]/40 bg-[#800E2F]/5' : 'border-gray-200/60 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isUnread && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>}
                      <h3 className={`font-medium text-sm truncate ${isUnread ? 'text-[#800E2F]' : 'text-gray-800'}`}>
                        {ticket.subject}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</span>
                      <span>•</span>
                      <span>{ticket.replies_count || 0} پاسخ</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
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
              </div>
            );
          })
        )}
      </div>

      {showDetail && selectedTicket && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800 truncate">{selectedTicket.ticket.subject}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-gray-800">{selectedTicket.ticket.user_name}</span>
                <span className="text-[8px] bg-gray-400 text-white px-1.5 py-0.5 rounded-full">کاربر</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                <span dangerouslySetInnerHTML={renderSafeHTML(selectedTicket.ticket.message)} />
              </p>
              <p className="text-[9px] text-gray-400 mt-2">
                {new Date(selectedTicket.ticket.created_at).toLocaleString('fa-IR')}
              </p>
            </div>

            {selectedTicket.replies && selectedTicket.replies.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  پاسخ‌ها
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {selectedTicket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`flex flex-col ${reply.is_admin ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                          reply.is_admin
                            ? 'bg-[#800E2F] text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`font-bold text-xs ${reply.is_admin ? 'text-white' : 'text-gray-700'}`}>
                            {reply.user_name}
                          </span>
                          {reply.is_admin && (
                            <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">ادمین</span>
                          )}
                        </div>
                        <p className={`whitespace-pre-wrap text-xs leading-relaxed ${reply.is_admin ? 'text-white' : 'text-gray-800'}`}>
                          <span dangerouslySetInnerHTML={renderSafeHTML(reply.message)} />
                        </p>
                        <span className={`text-[8px] mt-1 block ${reply.is_admin ? 'text-white/70' : 'text-gray-400'}`}>
                          {new Date(reply.created_at).toLocaleString('fa-IR')}
                          {reply.updated_at && reply.updated_at !== reply.created_at && (
                            <span className="mr-1">(ویرایش‌شده)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTicket.ticket.status !== 'closed' && (
              <form onSubmit={handleReplySubmit} className="border-t border-gray-200 pt-3">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">پاسخ شما</label>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows="3"
                    placeholder="پاسخ خود را بنویسید..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-xl font-medium text-sm transition disabled:opacity-50"
                  >
                    {submitting ? 'در حال ارسال...' : 'ارسال پاسخ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCloseTicket(selectedTicket.ticket.id)}
                    className="flex-1 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-xl font-medium text-sm transition"
                  >
                    بستن تیکت
                  </button>
                </div>
              </form>
            )}

            {selectedTicket.ticket.status === 'closed' && (
              <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                این تیکت بسته شده است.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MobileSupportTickets;