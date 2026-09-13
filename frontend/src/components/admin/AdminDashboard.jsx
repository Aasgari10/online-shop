// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

// تب‌ها
import ProductsTab from './tabs/ProductsTab';
import UsersTab from './tabs/UsersTab';
import BannersTab from './tabs/BannersTab';
import OrdersTab from './tabs/OrdersTab';
import ReviewsTab from './tabs/ReviewsTab';
import TrashTab from './tabs/TrashTab';
import TicketsTab from './tabs/TicketsTab';
import CategoriesTab from './tabs/CategoriesTab';
import ReportsTab from './tabs/ReportsTab';
import DiscountCodesTab from './tabs/DiscountCodesTab';
import FeaturedTab from './tabs/FeaturedTab';
import TestimonialsTab from './tabs/TestimonialsTab';
import PagesTab from './tabs/PagesTab';

// مودال‌ها
import EditBannerModal from './modals/EditBannerModal';
import EditFeaturedModal from './modals/EditFeaturedModal';
import EditReviewModal from './modals/EditReviewModal';
import AddDiscountModal from './modals/AddDiscountModal';

function AdminDashboard() {
  const navigate = useNavigate();

  // ✅ خواندن مستقیم userData از localStorage در بدنه کامپوننت
  const userData = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user') || '{}') 
    : {};

  // ✅ بررسی دسترسی در بدنه (قبل از هر useEffect)
  if (userData.role !== 'admin') {
    toast.error('شما دسترسی به این صفحه ندارید');
    navigate('/');
    return null;
  }

  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [banners, setBanners] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [featured, setFeatured] = useState([]);

  const { notifications, fetchNotifications } = useAdminNotifications(30000);

  const [editingBanner, setEditingBanner] = useState(null);
  const [editingFeatured, setEditingFeatured] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editingReviewLoading, setEditingReviewLoading] = useState(false);
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyMessage, setEditingReplyMessage] = useState('');
  const [editingReplyLoading, setEditingReplyLoading] = useState(false);

  // ===== رفرش‌کننده‌ها =====
  const refreshReviews = async () => {
    try {
      const res = await api.get('/admin/reviews');
      if (res.data.success) {
        setReviews(res.data.data);
        await fetchNotifications();
      }
    } catch (error) {
      console.error('❌ خطا در به‌روزرسانی نظرات:', error);
    }
  };

  const refreshOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      if (res.data.success) {
        setOrders(res.data.data);
        try {
          await fetchNotifications();
        } catch (notifError) {
          console.error('❌ خطا در به‌روزرسانی نوتیفیکیشن‌ها:', notifError);
        }
      }
    } catch (error) {
      console.error('❌ خطا در به‌روزرسانی سفارشات:', error);
    }
  };

  const refreshFeatured = async () => {
    try {
      const res = await api.get('/admin/featured');
      if (res.data.success) {
        setFeatured(res.data.data);
      }
    } catch (error) {
      console.error('❌ [AdminDashboard] خطا در رفرش تخفیف‌ها:', error);
    }
  };

  const refreshTickets = async () => {
    try {
      const res = await api.get('/admin/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
        try {
          await fetchNotifications();
        } catch (notifError) {
          console.error('❌ خطا در به‌روزرسانی نوتیفیکیشن‌ها:', notifError);
        }
      }
    } catch (error) {
      console.error('❌ خطا در به‌روزرسانی تیکت‌ها:', error);
    }
  };

  // ===== دریافت داده‌ها بر اساس تب فعال =====
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'products') {
          setLoading(false);
          return;
        } else if (activeTab === 'banners') {
          const res = await api.get('/admin/banners');
          setBanners(res.data.data);
        } else if (activeTab === 'orders') {
          await refreshOrders();
        } else if (activeTab === 'reviews') {
          const res = await api.get('/admin/reviews');
          setReviews(res.data.data);
        } else if (activeTab === 'tickets') {
          await refreshTickets();
        } else if (activeTab === 'featured') {
          await refreshFeatured();
        }
      } catch (error) {
        console.error(`❌ خطا در fetchData برای تب ${activeTab}:`, error);
        toast.error('خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // ===== هندلرها =====
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
  };

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`آیا از انتقال محصول "${name}" به سطل زباله مطمئن هستید؟`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('محصول به سطل زباله منتقل شد');
    } catch (error) {
      console.error('خطا در حذف محصول:', error);
      toast.error('خطا در حذف محصول');
    }
  };

  const handleAddBanner = async (file, title, link, position, isActive) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title || '');
    formData.append('link', link || '');
    formData.append('position', position || 'home');
    formData.append('is_active', isActive !== undefined ? isActive : true);
    try {
      const res = await api.post('/admin/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('بنر اضافه شد');
      const bannersRes = await api.get('/admin/banners');
      setBanners(bannersRes.data.data);
    } catch (error) {
      console.error('خطا در افزودن بنر:', error);
      toast.error('خطا در افزودن بنر');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm('آیا از انتقال این بنر به سطل زباله مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      toast.success('بنر به سطل زباله منتقل شد');
      setBanners(banners.filter(b => b.id !== id));
    } catch (error) {
      console.error('خطا در حذف بنر:', error);
      toast.error('خطا در حذف بنر');
    }
  };

  const handleToggleBanner = async (id, currentStatus) => {
    try {
      await api.put(`/admin/banners/${id}`, { is_active: !currentStatus });
      toast.success('وضعیت بنر تغییر کرد');
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (error) {
      console.error('خطا در تغییر وضعیت بنر:', error);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const handleEditBanner = async (id, data) => {
    const formData = new FormData();
    formData.append('title', data.title || '');
    formData.append('link', data.link || '');
    formData.append('position', data.position || 'home');
    formData.append('is_active', data.is_active !== undefined ? data.is_active : true);
    if (data.file) formData.append('image', data.file);
    try {
      await api.put(`/admin/banners/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('بنر ویرایش شد');
      const bannersRes = await api.get('/admin/banners');
      setBanners(bannersRes.data.data);
      setEditingBanner(null);
    } catch (error) {
      console.error('خطا در ویرایش بنر:', error);
      toast.error('خطا در ویرایش بنر');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success('وضعیت سفارش به‌روز شد');
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (error) {
      console.error('خطا در تغییر وضعیت سفارش:', error);
      toast.error('خطا در به‌روزرسانی وضعیت');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (typeof orderId !== 'number' && !/^\d+$/.test(String(orderId))) {
      console.log('❌ شناسه سفارش نامعتبر است:', orderId);
      return;
    }
    try {
      const response = await api.delete(`/admin/orders/${orderId}`);
      if (response.data.success) {
        toast.success('سفارش به سطل زباله منتقل شد');
        try {
          await refreshOrders();
        } catch (refreshError) {
          console.error('❌ خطا در به‌روزرسانی لیست سفارشات:', refreshError);
        }
      } else {
        toast.error(response.data.message || 'خطا در حذف سفارش');
      }
    } catch (error) {
      toast.error('خطا در حذف سفارش');
      console.error('❌ خطا:', error);
    }
  };

  const handleDeleteFeatured = async (id) => {
    try {
      const response = await api.delete(`/admin/featured/${id}`);
      if (response.data.success) {
        toast.success('تخفیف به سطل زباله منتقل شد');
        try {
          await refreshFeatured();
        } catch (refreshError) {
          console.error('❌ خطا در به‌روزرسانی لیست تخفیف‌ها:', refreshError);
        }
      } else {
        toast.error(response.data.message || 'خطا در حذف تخفیف');
      }
    } catch (error) {
      toast.error('خطا در حذف تخفیف');
      console.error('❌ خطا:', error);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    console.log('🗑️ [handleDeleteTicket] ورودی دریافت شد:', ticketId);

    if (Array.isArray(ticketId) && ticketId.length === 0) {
      console.warn('⚠️ [handleDeleteTicket] آرایه خالی دریافت شد، عملیات لغو شد');
      return;
    }

    let id = ticketId;
    if (Array.isArray(id) && id.length > 0) {
      console.warn('⚠️ [handleDeleteTicket] آرایه دریافت شد، استخراج id از اولین عنصر');
      const firstItem = id[0];
      if (typeof firstItem === 'object' && firstItem !== null && firstItem.id) {
        id = firstItem.id;
      } else {
        id = firstItem;
      }
    }
    if (typeof id === 'object' && id !== null && id.id) {
      console.warn('⚠️ [handleDeleteTicket] شیء دریافت شد، استخراج id');
      id = id.id;
    }

    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
      console.error('❌ [handleDeleteTicket] شناسه نامعتبر:', id);
      toast.error('شناسه تیکت نامعتبر است');
      return;
    }

    console.log('🗑️ [handleDeleteTicket] شروع حذف با id:', numericId);

    try {
      const response = await api.delete(`/admin/tickets/${numericId}`);
      if (response.data.success) {
        toast.success('تیکت به سطل زباله منتقل شد');
        try {
          await refreshTickets();
        } catch (refreshError) {
          console.error('❌ [handleDeleteTicket] خطا در رفرش لیست:', refreshError);
        }
      } else {
        toast.error(response.data.message || 'خطا در حذف تیکت');
      }
    } catch (error) {
      console.error('❌ [handleDeleteTicket] خطای غیرمنتظره:', error);
      toast.error('خطا در حذف تیکت');
    }
  };

  const handleDeleteReview = async (id) => {
    const reviewId = Number(id);
    if (!confirm('آیا از انتقال این نظر به سطل زباله مطمئن هستید؟')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('نظر به سطل زباله منتقل شد');
      await refreshReviews();
    } catch (error) {
      console.error('خطا در حذف نظر:', error);
      toast.error('خطا در حذف نظر');
    }
  };

  const handleEditReview = async (reviewId, data) => {
    setEditingReviewLoading(true);
    try {
      await api.put(`/reviews/${reviewId}`, {
        rating: data.rating,
        comment: data.comment,
      });
      toast.success('نظر با موفقیت ویرایش شد');
      setEditingReview(null);
      await refreshReviews();
    } catch (error) {
      console.error('خطا در ویرایش نظر:', error);
      toast.error(error.response?.data?.message || 'خطا در ویرایش نظر');
    } finally {
      setEditingReviewLoading(false);
    }
  };

  const handleEditFeatured = async (id, data) => {
    try {
      const payload = {
        discount_percent: data.discount_percent,
        end_time: data.end_time || null,
      };
      const response = await api.put(`/admin/featured/${id}`, payload);
      if (response.data.success) {
        toast.success('تخفیف با موفقیت ویرایش شد');
        await refreshFeatured();
        setEditingFeatured(null);
      } else {
        toast.error(response.data.message || 'خطا در ویرایش تخفیف');
        throw new Error(response.data.message || 'خطا در ویرایش تخفیف');
      }
    } catch (error) {
      console.error('🔴 [AdminDashboard] خطا در ویرایش تخفیف:', error);
      toast.error(error.response?.data?.message || 'خطا در ویرایش تخفیف');
      throw error;
    }
  };

  const handleAddDiscountSuccess = () => {
    setShowAddDiscountModal(false);
    refreshFeatured();
    toast.success('تخفیف با موفقیت اعمال شد');
  };

  const handleViewTicket = async (ticketId) => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.data.success) {
        setSelectedTicket(res.data.data);
        setReplyMessage('');
        setEditingReplyId(null);
        setEditingReplyMessage('');
        await refreshTickets();
        await fetchNotifications();
      }
    } catch (error) {
      console.error('خطا در مشاهده تیکت:', error);
      toast.error(error.response?.data?.message || 'خطا در دریافت جزئیات تیکت');
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('پیام پاسخ را وارد کنید');
      return;
    }
    setSubmittingReply(true);
    const ticketId = selectedTicket.ticket.id;
    try {
      await api.post(`/admin/tickets/${ticketId}/reply`, { message: replyMessage });
      toast.success('پاسخ با موفقیت ثبت شد');
      setReplyMessage('');
      await refreshTickets();
      await fetchNotifications();
      const updated = await api.get(`/tickets/${ticketId}`);
      if (updated.data.success) setSelectedTicket(updated.data.data);
      window.dispatchEvent(new CustomEvent('ticket-replied', {
        detail: { ticketId: ticketId }
      }));
    } catch (error) {
      console.error('خطا در ارسال پاسخ:', error);
      toast.error(error.response?.data?.message || 'خطا در ثبت پاسخ');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!confirm('آیا از بستن این تیکت مطمئن هستید؟')) return;
    try {
      await api.put(`/tickets/${ticketId}/close`);
      toast.success('تیکت بسته شد');
      if (selectedTicket) setSelectedTicket(null);
      await refreshTickets();
      await fetchNotifications();
    } catch (error) {
      console.error('خطا در بستن تیکت:', error);
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
      const updated = await api.get(`/tickets/${selectedTicket.ticket.id}`);
      if (updated.data.success) setSelectedTicket(updated.data.data);
      await refreshTickets();
      await fetchNotifications();
    } catch (error) {
      console.error('خطا در ویرایش پاسخ:', error);
      toast.error(error.response?.data?.message || 'خطا در ویرایش پاسخ');
    } finally {
      setEditingReplyLoading(false);
    }
  };

  const tabs = [
    { key: 'products', label: '📦 محصولات' },
    { key: 'users', label: '👥 کاربران' },
    { key: 'banners', label: '🖼️ بنرها' },
    { key: 'featured', label: '⭐ تخفیف‌دارها' },
    { 
      key: 'orders', 
      label: '📋 سفارشات',
      badge: notifications.newOrders > 0 ? notifications.newOrders : null
    },
    { 
      key: 'reviews', 
      label: '💬 نظرات',
      badge: notifications.pendingReviews > 0 ? notifications.pendingReviews : null
    },
    { key: 'testimonials', label: '📝 نظرات صفحه اصلی' },
    { key: 'pages', label: '📄 صفحات' },
    { 
      key: 'tickets', 
      label: '🎫 تیکت‌ها',
      badge: notifications.unreadTickets > 0 ? notifications.unreadTickets : null
    },
    { key: 'categories', label: '📂 دسته‌بندی‌ها' },
    { key: 'reports', label: '📊 گزارش‌ها' },
    { key: 'discount-codes', label: '🎫 کد تخفیف' },
    { key: 'trash', label: '🗑️ سطل زباله' },
  ];

  if (loading && activeTab !== 'products') {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-[#E8DCC8] pb-8">
      <div className="container mx-auto px-4 max-w-7xl pt-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-wrap border-b border-gray-200 bg-gray-50/50">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-3 text-sm font-medium transition border-b-2 relative ${
                  activeTab === tab.key 
                    ? 'border-[#800E2F] text-[#800E2F] bg-white shadow-sm' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white animate-pulse">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6 pt-0">
            {activeTab === 'products' && (
              <ProductsTab
                onDelete={handleDeleteProduct}
                onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
              />
            )}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'banners' && (
              <BannersTab
                banners={banners}
                onAdd={handleAddBanner}
                onDelete={handleDeleteBanner}
                onToggle={handleToggleBanner}
                onEdit={(banner) => setEditingBanner(banner)}
              />
            )}
            {activeTab === 'featured' && (
              <FeaturedTab
                featured={featured}
                onEdit={(item) => setEditingFeatured(item)}
                onDelete={handleDeleteFeatured}
                onRefresh={refreshFeatured}
                onAddDiscount={() => setShowAddDiscountModal(true)}
              />
            )}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                onDelete={handleDeleteOrder}
              />
            )}
            {activeTab === 'reviews' && (
              <ReviewsTab
                reviews={reviews}
                onDelete={handleDeleteReview}
                onEdit={(review) => setEditingReview(review)}
                onRefresh={refreshReviews}
              />
            )}
            {activeTab === 'testimonials' && <TestimonialsTab />}
            {activeTab === 'pages' && <PagesTab />}
            {activeTab === 'tickets' && (
              <TicketsTab
                tickets={tickets}
                onDelete={handleDeleteTicket}
                onView={handleViewTicket}
              />
            )}
            {activeTab === 'categories' && <CategoriesTab />}
            {activeTab === 'reports' && <ReportsTab />}
            {activeTab === 'discount-codes' && <DiscountCodesTab />}
            {activeTab === 'trash' && <TrashTab />}
          </div>
        </div>

        <EditBannerModal
          isOpen={!!editingBanner}
          onClose={() => setEditingBanner(null)}
          banner={editingBanner}
          onSave={handleEditBanner}
        />

        <EditFeaturedModal
          isOpen={!!editingFeatured}
          onClose={() => setEditingFeatured(null)}
          item={editingFeatured}
          onSave={handleEditFeatured}
        />

        <AddDiscountModal
          isOpen={showAddDiscountModal}
          onClose={() => setShowAddDiscountModal(false)}
          onSuccess={handleAddDiscountSuccess}
        />

        <EditReviewModal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          review={editingReview}
          onSave={handleEditReview}
        />

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
                <p className="text-gray-800 whitespace-pre-wrap">{selectedTicket.ticket.message}</p>
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
                          <p className="text-gray-700 mt-1 whitespace-pre-wrap">{reply.message}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {userData?.role === 'admin' && selectedTicket.ticket.status !== 'closed' && (
                <form onSubmit={handleReplyTicket} className="mt-4 border-t pt-4">
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
                      disabled={submittingReply}
                      className="bg-[#800E2F] hover:bg-[#6B0A26] text-white px-5 py-2 rounded-lg font-medium transition disabled:opacity-50"
                    >
                      {submittingReply ? '...' : 'ارسال پاسخ'}
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

              {selectedTicket.ticket.status === 'closed' && (
                <div className="mt-4 text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  این تیکت بسته شده است.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;