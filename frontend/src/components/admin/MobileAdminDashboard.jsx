// src/components/admin/MobileAdminDashboard.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

// تب‌های موجود
import MobileDashboardTab from './tabs/MobileDashboardTab';
import MobileOrdersTab from './tabs/MobileOrdersTab';
import MobileProductsTab from './tabs/MobileProductsTab';
import MobileReviewsTab from './tabs/MobileReviewsTab';
import MobileUsersTab from './tabs/MobileUsersTab';
import MobileTicketsTab from './tabs/MobileTicketsTab';
import MobileBannersTab from './tabs/MobileBannersTab';
import MobileFeaturedTab from './tabs/MobileFeaturedTab';
import MobileDiscountCodesTab from './tabs/MobileDiscountCodesTab';
import MobileTrashTab from './tabs/MobileTrashTab';
import MobileTestimonialsTab from './tabs/MobileTestimonialsTab';
import MobilePagesTab from './tabs/MobilePagesTab';
import MobileCategoriesTab from './tabs/MobileCategoriesTab';
import MobileReportsTab from './tabs/MobileReportsTab';

function MobileAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

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

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [banners, setBanners] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [discountCodes, setDiscountCodes] = useState([]);
  const [trashData, setTrashData] = useState({});

  const bottomNavRef = useRef(null);
  const tabRefs = useRef({});

  const { notifications, fetchNotifications } = useAdminNotifications(30000);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) setStats(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت آمار:', error);
    }
  }, []);

  const fetchOrdersData = useCallback(async () => {
    try {
      const res = await api.get('/admin/orders');
      if (res.data.success) setOrders(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت سفارشات:', error);
    }
  }, []);

  const fetchProductsData = useCallback(async () => {
    try {
      const res = await api.get('/products?limit=50');
      if (res.data.success) setProducts(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت محصولات:', error);
    }
  }, []);

  const fetchReviewsData = useCallback(async () => {
    try {
      const res = await api.get('/admin/reviews');
      if (res.data.success) setReviews(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت نظرات:', error);
    }
  }, []);

  const fetchUsersData = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت کاربران:', error);
    }
  }, []);

  const fetchTicketsData = useCallback(async () => {
    try {
      const res = await api.get('/admin/tickets');
      if (res.data.success) setTickets(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت تیکت‌ها:', error);
    }
  }, []);

  const fetchBannersData = useCallback(async () => {
    try {
      const res = await api.get('/admin/banners');
      if (res.data.success) setBanners(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت بنرها:', error);
    }
  }, []);

  const fetchFeaturedData = useCallback(async () => {
    try {
      const res = await api.get('/admin/featured');
      if (res.data.success) setFeatured(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت تخفیف‌ها:', error);
    }
  }, []);

  const fetchDiscountCodesData = useCallback(async () => {
    try {
      const res = await api.get('/admin/discount-codes');
      if (res.data.success) setDiscountCodes(res.data.data);
    } catch (error) {
      console.error('❌ خطا در دریافت کدهای تخفیف:', error);
    }
  }, []);

  const fetchTrashData = useCallback(async () => {
    try {
      const [usersRes, productsRes, categoriesRes, bannersRes, featuredRes, ordersRes, reviewsRes, ticketsRes, discountCodesRes] = await Promise.all([
        api.get('/admin/trash/users'),
        api.get('/admin/trash/products'),
        api.get('/admin/categories/trash'),
        api.get('/admin/trash/banners'),
        api.get('/admin/trash/featured'),
        api.get('/admin/trash/orders'),
        api.get('/admin/trash/reviews'),
        api.get('/admin/trash/tickets'),
        api.get('/admin/trash/discount-codes'),
      ]);
      setTrashData({
        users: usersRes.data.data || [],
        products: productsRes.data.data || [],
        categories: categoriesRes.data.data || [],
        banners: bannersRes.data.data || [],
        featured: featuredRes.data.data || [],
        orders: ordersRes.data.data || [],
        reviews: reviewsRes.data.data || [],
        tickets: ticketsRes.data.data || [],
        discountCodes: discountCodesRes.data.data || [],
      });
    } catch (error) {
      console.error('❌ خطا در دریافت سطل زباله:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        switch (activeTab) {
          case 'dashboard':
            await fetchDashboardData();
            break;
          case 'orders':
            await fetchOrdersData();
            break;
          case 'products':
            await fetchProductsData();
            break;
          case 'reviews':
            await fetchReviewsData();
            break;
          case 'users':
            await fetchUsersData();
            break;
          case 'tickets':
            await fetchTicketsData();
            break;
          case 'banners':
            await fetchBannersData();
            break;
          case 'featured':
            await fetchFeaturedData();
            break;
          case 'discount-codes':
            await fetchDiscountCodesData();
            break;
          case 'trash':
            await fetchTrashData();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('❌ خطا در بارگذاری داده:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab, fetchDashboardData, fetchOrdersData, fetchProductsData, fetchReviewsData, fetchUsersData, fetchTicketsData, fetchBannersData, fetchFeaturedData, fetchDiscountCodesData, fetchTrashData]);

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success('وضعیت سفارش به‌روز شد');
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (error) {
      toast.error('خطا در به‌روزرسانی وضعیت');
    }
  };

  const handleDeleteOrder = async (id) => {
    try {
      await api.delete(`/admin/orders/${id}`);
      toast.success('سفارش به سطل زباله منتقل شد');
      await fetchOrdersData();
    } catch (error) {
      toast.error('خطا در حذف سفارش');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.success('محصول به سطل زباله منتقل شد');
      await fetchProductsData();
    } catch (error) {
      toast.error('خطا در حذف محصول');
    }
  };

  const handleToggleBanner = async (id, currentStatus) => {
    try {
      await api.put(`/admin/banners/${id}`, { is_active: !currentStatus });
      toast.success('وضعیت بنر تغییر کرد');
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
    } catch (error) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const handleDeleteBanner = async (id) => {
    try {
      await api.delete(`/admin/banners/${id}`);
      toast.success('بنر به سطل زباله منتقل شد');
      await fetchBannersData();
    } catch (error) {
      toast.error('خطا در حذف بنر');
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
      await fetchBannersData();
    } catch (error) {
      toast.error('خطا در ویرایش بنر');
    }
  };

  const handleAddBanner = async (data) => {
    const formData = new FormData();
    formData.append('image', data.file);
    formData.append('title', data.title || '');
    formData.append('link', data.link || '');
    formData.append('position', data.position || 'home');
    formData.append('is_active', data.is_active !== undefined ? data.is_active : true);
    try {
      const res = await api.post('/admin/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('بنر با موفقیت اضافه شد');
        await fetchBannersData();
        return res;
      } else {
        throw new Error(res.data.message || 'خطا در افزودن بنر');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در افزودن بنر');
      throw error;
    }
  };

  const handleDeleteFeatured = async (id) => {
    try {
      await api.delete(`/admin/featured/${id}`);
      toast.success('تخفیف به سطل زباله منتقل شد');
      await fetchFeaturedData();
    } catch (error) {
      toast.error('خطا در حذف تخفیف');
    }
  };

  const handleAddDiscount = async (data) => {
    try {
      const productRes = await api.get(`/products/${data.product_id}`);
      if (!productRes.data.success) {
        toast.error('محصول یافت نشد');
        throw new Error('محصول یافت نشد');
      }
      const product = productRes.data.data;
      const originalPrice = product.price;
      const discountedPrice = Math.round(originalPrice * (1 - data.discount_percent / 100));

      await api.put(`/products/${data.product_id}`, {
        name: product.name,
        description: product.description,
        price: discountedPrice,
        stock: product.stock,
        category_id: product.category_id,
        brand: product.brand || null,
        model: product.model || null,
        weight: product.weight || null,
        dimensions: product.dimensions || null,
        custom_attributes: product.custom_attributes || {},
      });

      const payload = {
        product_id: data.product_id,
        type: 'discount',
        discount_percent: data.discount_percent,
        original_price: originalPrice,
        end_time: data.end_time || null,
        order_index: 0,
      };
      await api.post('/admin/featured', payload);
      toast.success('تخفیف با موفقیت اعمال شد');
      await fetchFeaturedData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در افزودن تخفیف');
      throw error;
    }
  };

  const handleEditFeatured = async (id, data) => {
    try {
      await api.put(`/admin/featured/${id}`, {
        discount_percent: data.discount_percent,
        end_time: data.end_time || null,
      });
      toast.success('تخفیف با موفقیت ویرایش شد');
      await fetchFeaturedData();
    } catch (error) {
      toast.error('خطا در ویرایش تخفیف');
      throw error;
    }
  };

  const handleAddDiscountCode = async (data) => {
    try {
      await api.post('/admin/discount-codes', data);
      toast.success('کد تخفیف با موفقیت ایجاد شد');
      await fetchDiscountCodesData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ایجاد کد تخفیف');
      throw error;
    }
  };

  const handleEditDiscountCode = async (id, data) => {
    try {
      await api.put(`/admin/discount-codes/${id}`, data);
      toast.success('کد تخفیف با موفقیت ویرایش شد');
      await fetchDiscountCodesData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ویرایش کد تخفیف');
      throw error;
    }
  };

  const handleDeleteDiscountCode = async (id) => {
    try {
      await api.delete(`/admin/discount-codes/${id}`);
      toast.success('کد تخفیف به سطل زباله منتقل شد');
      await fetchDiscountCodesData();
    } catch (error) {
      toast.error('خطا در حذف کد تخفیف');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('کاربر به سطل زباله منتقل شد');
      await fetchUsersData();
    } catch (error) {
      toast.error('خطا در حذف کاربر');
    }
  };

  const handleUpdateUserRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success('نقش کاربر تغییر کرد');
      setUsers(users.map(u => u.id === id ? { ...u, role } : u));
    } catch (error) {
      toast.error('خطا در تغییر نقش');
    }
  };

  const handleDeleteTicket = async (id) => {
    try {
      await api.delete(`/admin/tickets/${id}`);
      toast.success('تیکت به سطل زباله منتقل شد');
      await fetchTicketsData();
    } catch (error) {
      toast.error('خطا در حذف تیکت');
    }
  };

  const handleDeleteReview = async (id) => {
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('نظر به سطل زباله منتقل شد');
      await fetchReviewsData();
    } catch (error) {
      toast.error('خطا در حذف نظر');
    }
  };

  const handleApproveReview = async (id) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`);
      toast.success('نظر تأیید شد');
      setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: 1 } : r));
    } catch (error) {
      toast.error('خطا در تأیید نظر');
    }
  };

  const getRestoreEndpoint = (type, id) => {
    const endpoints = {
      users: `/admin/trash/users/${id}/restore`,
      products: `/admin/trash/products/${id}/restore`,
      categories: `/admin/categories/${id}/restore`,
      banners: `/admin/trash/banners/${id}/restore`,
      featured: `/admin/trash/featured/${id}/restore`,
      orders: `/admin/trash/orders/${id}/restore`,
      reviews: `/admin/trash/reviews/${id}/restore`,
      tickets: `/admin/trash/tickets/${id}/restore`,
      discountCodes: `/admin/trash/discount-codes/${id}/restore`,
    };
    return endpoints[type];
  };

  const getForceDeleteEndpoint = (type, id) => {
    const endpoints = {
      users: `/admin/trash/users/${id}/force`,
      products: `/admin/trash/products/${id}/force`,
      categories: `/admin/categories/${id}/force`,
      banners: `/admin/trash/banners/${id}/force`,
      featured: `/admin/trash/featured/${id}/force`,
      orders: `/admin/trash/orders/${id}/force`,
      reviews: `/admin/trash/reviews/${id}/force`,
      tickets: `/admin/trash/tickets/${id}/force`,
      discountCodes: `/admin/trash/discount-codes/${id}/force`,
    };
    return endpoints[type];
  };

  const handleRestore = async (type, id) => {
    const endpoint = getRestoreEndpoint(type, id);
    if (!endpoint) throw new Error('نوع آیتم نامعتبر است');
    await api.put(endpoint);
    await fetchTrashData();
  };

  const handleForceDelete = async (type, id) => {
    const endpoint = getForceDeleteEndpoint(type, id);
    if (!endpoint) throw new Error('نوع آیتم نامعتبر است');
    await api.delete(endpoint);
    await fetchTrashData();
  };

  useEffect(() => {
    if (location.state?.returnToTab) {
      setActiveTab(location.state.returnToTab);
      sessionStorage.removeItem('returnToTab');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleTabChange = (event) => {
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab);
      }
    };
    window.addEventListener('admin-tab-change', handleTabChange);
    return () => window.removeEventListener('admin-tab-change', handleTabChange);
  }, []);

  useEffect(() => {
    const scrollToActiveTab = () => {
      const tabElement = tabRefs.current[activeTab];
      const container = bottomNavRef.current;
      
      if (tabElement && container) {
        const containerRect = container.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();
        const scrollOffset = tabRect.left - containerRect.left + (tabRect.width / 2) - (containerRect.width / 2);
        container.scrollTo({
          left: container.scrollLeft + scrollOffset,
          behavior: 'smooth'
        });
      }
    };
    const timer = setTimeout(scrollToActiveTab, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
  };

  if (loading) return <Spinner />;

  const allTabs = [
    { key: 'dashboard', label: '📊 داشبورد' },
    { key: 'orders', label: '📋 سفارشات', badge: notifications.newOrders > 0 ? notifications.newOrders : null },
    { key: 'products', label: '📦 محصولات' },
    { key: 'reviews', label: '💬 نظرات', badge: notifications.pendingReviews > 0 ? notifications.pendingReviews : null },
    { key: 'users', label: '👥 کاربران' },
    { key: 'tickets', label: '🎫 تیکت‌ها', badge: notifications.unreadTickets > 0 ? notifications.unreadTickets : null },
    { key: 'banners', label: '🖼️ بنرها' },
    { key: 'featured', label: '⭐ تخفیف‌دارها' },
    { key: 'discount-codes', label: '🎫 کد تخفیف' },
    { key: 'trash', label: '🗑️ سطل زباله' },
    { key: 'testimonials', label: '📝 نظرات صفحه اصلی' },
    { key: 'pages', label: '📄 صفحات' },
    { key: 'categories', label: '📂 دسته‌بندی‌ها' },
    { key: 'reports', label: '📊 گزارش‌ها' },
  ];

  return (
    <div className="min-h-screen bg-[#E8DCC8] pb-24">
      <div className="px-3 pt-2">
        {activeTab === 'dashboard' && <MobileDashboardTab stats={stats} />}
        {activeTab === 'orders' && (
          <MobileOrdersTab
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            onDelete={handleDeleteOrder}
            onRefresh={fetchOrdersData}
          />
        )}
        {activeTab === 'products' && (
          <MobileProductsTab
            products={products}
            onDelete={handleDeleteProduct}
            onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
            onRefresh={fetchProductsData}
          />
        )}
        {activeTab === 'reviews' && (
          <MobileReviewsTab
            reviews={reviews}
            onDelete={handleDeleteReview}
            onApprove={handleApproveReview}
            onRefresh={fetchReviewsData}
          />
        )}
        {activeTab === 'users' && (
          <MobileUsersTab
            users={users}
            onDelete={handleDeleteUser}
            onUpdateRole={handleUpdateUserRole}
            onRefresh={fetchUsersData}
          />
        )}
        {activeTab === 'tickets' && (
          <MobileTicketsTab
            tickets={tickets}
            onDelete={handleDeleteTicket}
            onRefresh={fetchTicketsData}
          />
        )}
        {activeTab === 'banners' && (
          <MobileBannersTab
            banners={banners}
            onToggle={handleToggleBanner}
            onDelete={handleDeleteBanner}
            onEdit={handleEditBanner}
            onAdd={handleAddBanner}
            onRefresh={fetchBannersData}
          />
        )}
        {activeTab === 'featured' && (
          <MobileFeaturedTab
            featured={featured}
            onDelete={handleDeleteFeatured}
            onEdit={handleEditFeatured}
            onAdd={handleAddDiscount}
            onRefresh={fetchFeaturedData}
          />
        )}
        {activeTab === 'discount-codes' && (
          <MobileDiscountCodesTab
            discountCodes={discountCodes}
            onDelete={handleDeleteDiscountCode}
            onAdd={handleAddDiscountCode}
            onEdit={handleEditDiscountCode}
            onRefresh={fetchDiscountCodesData}
          />
        )}
        {activeTab === 'trash' && (
          <MobileTrashTab
            trashData={trashData}
            onRestore={handleRestore}
            onForceDelete={handleForceDelete}
            onRefresh={fetchTrashData}
          />
        )}
        {activeTab === 'testimonials' && <MobileTestimonialsTab />}
        {activeTab === 'pages' && <MobilePagesTab />}
        {activeTab === 'categories' && <MobileCategoriesTab />}
        {activeTab === 'reports' && <MobileReportsTab />}
      </div>

      <div 
        ref={bottomNavRef}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg pb-1 overflow-x-auto bottom-nav"
        style={{
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
          scrollbarColor: '#800E2F #f1f1f1',
        }}
      >
        <style>{`
          .bottom-nav::-webkit-scrollbar {
            height: 5px;
          }
          .bottom-nav::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          .bottom-nav::-webkit-scrollbar-thumb {
            background: #800E2F;
            border-radius: 3px;
          }
          .bottom-nav::-webkit-scrollbar-thumb:hover {
            background: #6B0A26;
          }
        `}</style>

        <div className="flex py-2 px-1">
          {allTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                ref={(el) => (tabRefs.current[tab.key] = el)}
                onClick={() => handleTabClick(tab.key)}
                className={`flex-shrink-0 min-w-[75px] px-3.5 py-2 text-center text-xs font-medium transition relative rounded-lg mx-0.5 ${
                  isActive
                    ? 'bg-[#800E2F]/10 text-[#800E2F]'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {tab.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base leading-none">{tab.label.split(' ')[0]}</span>
                  <span className="leading-tight whitespace-nowrap">{tab.label.split(' ').slice(1).join(' ')}</span>
                </div>
                {isActive && (
                  <span className="absolute -bottom-0 right-1/2 translate-x-1/2 w-8 h-0.5 bg-[#800E2F] rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MobileAdminDashboard;