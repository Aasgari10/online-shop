// src/components/support/SupportPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import DOMPurify from 'dompurify';

function SupportPage() {
  const [pageContent, setPageContent] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyMessage, setEditingReplyMessage] = useState('');
  const [editingReplyLoading, setEditingReplyLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await api.get('/pages/support');
        if (res.data.success) {
          setPageContent(res.data.data);
        }
      } catch (err) {
        console.error('❌ خطا در دریافت صفحه پشتیبانی:', err);
        setPageError('خطا در دریافت اطلاعات صفحه');
      } finally {
        setPageLoading(false);
      }
    };
    fetchPage();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/tickets/unread-count');
      if (res.data.success) {
        const count = res.data.data.unreadCount;
        setUnreadCount(count);
        window.dispatchEvent(new CustomEvent('ticket-count-update', {
          detail: { unreadCount: count }
        }));
      }
    } catch (error) {
      console.error('❌ [SupportPage] خطا در دریافت تعداد:', error);
    }
  };

  const fetchTickets = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/tickets');
      if (res.data.success) setTickets(res.data.data);
    } catch (error) {
      console.error('خطا در دریافت تیکت‌ها:', error);
      toast.error('خطا در دریافت تیکت‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchTickets();
      fetchUnreadCount();
      const interval = setInterval(() => {
        fetchTickets();
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleTicketRead = () => {
      fetchUnreadCount();
      fetchTickets();
    };
    const handleTicketCountUpdate = (event) => {
      if (event.detail?.unreadCount !== undefined) {
        setUnreadCount(event.detail.unreadCount);
      }
    };
    window.addEventListener('ticket-read', handleTicketRead);
    window.addEventListener('ticket-count-update', handleTicketCountUpdate);
    return () => {
      window.removeEventListener('ticket-read', handleTicketRead);
      window.removeEventListener('ticket-count-update', handleTicketCountUpdate);
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
        await fetchUnreadCount();
        window.dispatchEvent(new Event('ticket-read'));
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
        const ticket = res.data.data.ticket;
        if (!ticket.is_read) {
          await api.put(`/tickets/${ticketId}/read`);
          await fetchTickets();
          await fetchUnreadCount();
          window.dispatchEvent(new Event('ticket-read'));
        }
      }
    } catch (error) {
      toast.error('خطا در دریافت جزئیات');
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
      await handleViewTicket(selectedTicket.ticket.id);
      await fetchTickets();
      await fetchUnreadCount();
      window.dispatchEvent(new Event('ticket-read'));
    } catch (error) {
      toast.error('خطا در ثبت پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!window.confirm('آیا از بستن این تیکت مطمئن هستید؟')) return;
    try {
      await api.put(`/tickets/${ticketId}/close`);
      await api.put(`/tickets/${ticketId}/read`);
      toast.success('تیکت بسته شد');
      await fetchTickets();
      await fetchUnreadCount();
      window.dispatchEvent(new Event('ticket-read'));
      if (selectedTicket) setSelectedTicket(null);
    } catch (error) {
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ویرایش پاسخ');
    } finally {
      setEditingReplyLoading(false);
    }
  };

  const faqs = pageContent?.content_json?.faqs || [];
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  if (pageLoading) return <Spinner />;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">پشتیبانی</h1>
            <p className="text-gray-600 mt-2">برای دسترسی به سیستم تیکت‌ها، لطفاً وارد حساب کاربری خود شوید.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">برای ثبت تیکت وارد شوید</h2>
            <p className="text-gray-500 mb-6">برای استفاده از سیستم پشتیبانی، لطفاً وارد حساب کاربری خود شوید.</p>
            <Link to="/login" className="inline-block bg-[#800E2F] hover:bg-[#6B0A26] text-white px-8 py-3 rounded-xl font-medium transition">
              ورود به حساب
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  const contentJson = pageContent?.content_json || {};
  const mainTitle = contentJson.mainTitle || 'پشتیبانی';
  const description = contentJson.description || '';

  return (
    <>
      {/* متا تگ‌های اختصاصی با React 19 */}
      <title>پشتیبانی | فروشگاه اینترنتی HomeMart</title>
      <meta name="description" content="پشتیبانی و پاسخگویی به سوالات و مشکلات شما. تیکت‌های پشتیبانی." />
      <meta property="og:title" content="پشتیبانی | HomeMart" />
      <meta property="og:description" content="پشتیبانی و پاسخگویی به سوالات و مشکلات شما. تیکت‌های پشتیبانی." />

      <div className="min-h-screen bg-[#E8DCC8] py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 relative inline-block">
              {mainTitle}
              <span className="absolute -bottom-2 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
            </h1>
            {description && (
              <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
            <button
              onClick={() => setShowNewTicket(!showNewTicket)}
              className="bg-[#800E2F] hover:bg-[#6B0A26] text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2 shadow-md"
            >
              {showNewTicket ? '✕ لغو' : '➕ تیکت جدید'}
            </button>

            <Link
              to="/support/tickets"
              className="relative bg-[#800E2F] hover:bg-[#6B0A26] text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2 shadow-md"
            >
              📋 تیکت‌های من
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white/30 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>

          {showNewTicket && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                تیکت جدید
              </h2>
              <form onSubmit={handleSubmitTicket}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">موضوع *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="موضوع درخواست خود را وارد کنید"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">پیام *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="4"
                    placeholder="توضیحات کامل درخواست خود را بنویسید..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 resize-y"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#800E2F] hover:bg-[#6B0A26] text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'در حال ارسال...' : 'ارسال تیکت'}
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                آخرین تیکت‌ها
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{tickets.length} تیکت</span>
            </div>

            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>هنوز هیچ تیکتی ثبت نکرده‌اید.</p>
                <p className="text-sm text-gray-400 mt-1">برای دریافت پاسخ کارشناسان، تیکت جدید ثبت کنید.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                {tickets.slice(0, 5).map((ticket) => {
                  const isUnread = !ticket.is_read && ticket.user_id === userData?.id && ticket.status !== 'closed';
                  return (
                    <li
                      key={ticket.id}
                      onClick={() => handleViewTicket(ticket.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between ${isUnread ? 'bg-[#800E2F]/5' : ''}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isUnread && (
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold truncate ${isUnread ? 'text-[#800E2F]' : 'text-gray-800'}`}>
                            {ticket.subject}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                            <span>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</span>
                            <span>•</span>
                            <span>{ticket.replies_count || 0} پاسخ</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
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
                    </li>
                  );
                })}
                {tickets.length > 5 && (
                  <div className="p-3 text-center">
                    <Link to="/support/tickets" className="text-[#800E2F] hover:underline text-sm font-medium">
                      مشاهده همه {tickets.length} تیکت
                    </Link>
                  </div>
                )}
              </ul>
            )}
          </div>

          {selectedTicket && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 truncate">{selectedTicket.ticket.subject}</h2>
                  <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-gray-700 text-2xl">
                    &times;
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">پیام اولیه:</p>
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

                {isAdmin && selectedTicket.ticket.status !== 'closed' && (
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
                      <button
                        type="button"
                        onClick={() => handleCloseTicket(selectedTicket.ticket.id)}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg font-medium transition"
                      >
                        بستن تیکت
                      </button>
                    </div>
                  </form>
                )}

                {!isAdmin && selectedTicket.ticket.status !== 'closed' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleCloseTicket(selectedTicket.ticket.id)}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg font-medium transition"
                    >
                      بستن تیکت
                    </button>
                  </div>
                )}

                {selectedTicket.ticket.status === 'closed' && (
                  <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    این تیکت بسته شده است.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {contentJson.faqTitle || 'سوالات متداول'}
            </h2>

            {faqs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">هیچ سوالی ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-4 text-right bg-gray-50/50 hover:bg-gray-100/70 transition duration-200"
                    >
                      <span className="text-base font-medium text-gray-800 flex-1 ml-4">{faq.question}</span>
                      <svg
                        className={`w-5 h-5 text-[#800E2F] transition-transform duration-300 flex-shrink-0 ${
                          openFaq === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-white">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <Link to="/" className="inline-flex items-center gap-2 text-[#800E2F] hover:text-[#6B0A26] font-medium transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default SupportPage;