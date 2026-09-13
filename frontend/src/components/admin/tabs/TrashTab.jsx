// src/components/admin/tabs/TrashTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import { formatPrice } from '../../../utils/formatPrice';
import PageHeader from '../../shared/PageHeader';

function TrashTab() {
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchRestoreConfirm, setShowBatchRestoreConfirm] = useState(false);
  const [showBatchForceDeleteConfirm, setShowBatchForceDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const subTabs = [
    { key: 'users', label: '👤 کاربران' },
    { key: 'products', label: '📦 محصولات' },
    { key: 'categories', label: '📂 دسته‌بندی‌ها' },
    { key: 'banners', label: '🖼️ بنرها' },
    { key: 'featured', label: '⭐ تخفیف‌دارها' },
    { key: 'orders', label: '📋 سفارشات' },
    { key: 'reviews', label: '💬 نظرات' },
    { key: 'tickets', label: '🎫 تیکت‌ها' },
    { key: 'discount-codes', label: '🎫 کدهای تخفیف' },
  ];

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const endpoints = {
        users: '/admin/trash/users',
        products: '/admin/trash/products',
        categories: '/admin/categories/trash',
        banners: '/admin/trash/banners',
        featured: '/admin/trash/featured',
        orders: '/admin/trash/orders',
        reviews: '/admin/trash/reviews',
        tickets: '/admin/trash/tickets',
        'discount-codes': '/admin/trash/discount-codes',
      };
      const res = await api.get(endpoints[activeSubTab]);
      if (res.data.success) {
        const rawData = res.data.data || [];
        setItems(rawData);
        setSelectedItems([]);
        setSelectAll(false);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت سطل زباله:', error);
      toast.error('خطا در دریافت سطل زباله');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [activeSubTab]);

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === items.length && items.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id || item.featured_id || item.ticket_id));
    }
    setSelectAll(!selectAll);
  };

  const getEndpoint = (action, id) => {
    const baseMap = {
      users: '/admin/trash/users',
      products: '/admin/trash/products',
      categories: '/admin/categories',
      banners: '/admin/trash/banners',
      featured: '/admin/trash/featured',
      orders: '/admin/trash/orders',
      reviews: '/admin/trash/reviews',
      tickets: '/admin/trash/tickets',
      'discount-codes': '/admin/trash/discount-codes',
    };
    const suffix = action === 'restore' ? '/restore' : '/force';
    const base = baseMap[activeSubTab] || baseMap.products;
    if (id) {
      return `${base}/${id}${suffix}`;
    }
    return `${base}${suffix}`;
  };

  const handleRestore = async (id) => {
    try {
      await api.put(getEndpoint('restore', id));
      toast.success('آیتم با موفقیت بازیابی شد');
      fetchTrash();
    } catch (error) {
      toast.error('خطا در بازیابی');
    }
  };

  const handleForceDelete = async (id) => {
    try {
      await api.delete(getEndpoint('force', id));
      toast.success('آیتم برای همیشه حذف شد');
      fetchTrash();
    } catch (error) {
      toast.error('خطا در حذف دائمی');
    }
  };

  // ✅ اصلاح: بازیابی گروهی به‌صورت سریالی (یکی پس از دیگری)
  const handleBatchRestore = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      for (const id of selectedItems) {
        await api.put(getEndpoint('restore', id));
      }
      toast.success(`${selectedItems.length} آیتم با موفقیت بازیابی شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchRestoreConfirm(false);
      fetchTrash();
    } catch (error) {
      toast.error('خطا در بازیابی گروهی');
    } finally {
      setBatchLoading(false);
    }
  };

  // ✅ اصلاح: حذف دائمی گروهی به‌صورت سریالی (یکی پس از دیگری)
  const handleBatchForceDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      for (const id of selectedItems) {
        await api.delete(getEndpoint('force', id));
      }
      toast.success(`${selectedItems.length} آیتم برای همیشه حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchForceDeleteConfirm(false);
      fetchTrash();
    } catch (error) {
      toast.error('خطا در حذف دائمی گروهی');
    } finally {
      setBatchLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      open: 'bg-green-100 text-green-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      closed: 'bg-gray-300 text-gray-700',
      'در انتظار پرداخت': 'bg-yellow-100 text-yellow-800',
      'پرداخت شده': 'bg-blue-100 text-blue-800',
      'ارسال شده': 'bg-purple-100 text-purple-800',
      'تحویل داده شده': 'bg-green-100 text-green-800',
      'لغو شده': 'bg-red-100 text-red-800',
    };
    const labels = {
      open: 'باز',
      in_progress: 'در حال بررسی',
      closed: 'بسته شده',
      'در انتظار پرداخت': 'در انتظار پرداخت',
      'پرداخت شده': 'پرداخت شده',
      'ارسال شده': 'ارسال شده',
      'تحویل داده شده': 'تحویل داده شده',
      'لغو شده': 'لغو شده',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader 
        title="🗑️ سطل زباله" 
        subtitle="بازیابی یا حذف دائمی آیتم‌ها" 
        className="mt-2"
      />

      <div className="flex items-center justify-between mb-5">
        {selectedItems.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => setShowBatchRestoreConfirm(true)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition">
              ♻️ بازیابی ({selectedItems.length})
            </button>
            <button onClick={() => setShowBatchForceDeleteConfirm(true)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition">
              💀 حذف دائمی ({selectedItems.length})
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b mr-2 border-gray-200 pb-3 ">
        {subTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`px-4 py-2 pr-2 text-sm font-medium rounded-lg transition ${
              activeSubTab === tab.key
                ? 'bg-[#800E2F] text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg">🗑️ سطل زباله خالی است</p>
          <p className="text-sm mt-1">هیچ آیتم حذف‌شده‌ای در این بخش وجود ندارد</p>
        </div>
      ) : (
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
                    disabled={items.length === 0}
                  />
                </th>
                {/* سرستون‌ها بر اساس activeSubTab */}
                {activeSubTab === 'users' && (
                  <>
                    <th className="text-right py-2 px-3">شناسه</th>
                    <th className="text-right py-2 px-3">نام</th>
                    <th className="text-right py-2 px-3">ایمیل</th>
                    <th className="text-right py-2 px-3">نقش</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'products' && (
                  <>
                    <th className="text-right py-2 px-3">شناسه</th>
                    <th className="text-right py-2 px-3">نام</th>
                    <th className="text-right py-2 px-3">قیمت</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'categories' && (
                  <>
                    <th className="text-right py-2 px-3">شناسه</th>
                    <th className="text-right py-2 px-3">نام</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'discount-codes' && (
                  <>
                    <th className="text-right py-2 px-3">شناسه</th>
                    <th className="text-right py-2 px-3">کد</th>
                    <th className="text-right py-2 px-3">نوع</th>
                    <th className="text-right py-2 px-3">مقدار</th>
                    <th className="text-right py-2 px-3">استفاده</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'featured' && (
                  <>
                    <th className="text-right py-2 px-3">شناسه</th>
                    <th className="text-right py-2 px-3">محصول</th>
                    <th className="text-right py-2 px-3">تخفیف</th>
                    <th className="text-right py-2 px-3">قیمت اصلی</th>
                    <th className="text-right py-2 px-3">قیمت فعلی</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'orders' && (
                  <>
                    <th className="text-right py-2 px-3">#</th>
                    <th className="text-right py-2 px-3">کاربر</th>
                    <th className="text-right py-2 px-3">مبلغ</th>
                    <th className="text-right py-2 px-3">وضعیت</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'reviews' && (
                  <>
                    <th className="text-right py-2 px-3">کاربر</th>
                    <th className="text-right py-2 px-3">محصول</th>
                    <th className="text-right py-2 px-3">امتیاز</th>
                    <th className="text-right py-2 px-3">نظر</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'tickets' && (
                  <>
                    <th className="text-right py-2 px-3">#</th>
                    <th className="text-right py-2 px-3">کاربر</th>
                    <th className="text-right py-2 px-3">موضوع</th>
                    <th className="text-right py-2 px-3">وضعیت</th>
                    <th className="text-right py-2 px-3">پاسخ‌ها</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
                {activeSubTab === 'banners' && (
                  <>
                    <th className="text-right py-2 px-3">شناسه</th>
                    <th className="text-right py-2 px-3">عنوان</th>
                    <th className="text-right py-2 px-3">تصویر</th>
                    <th className="text-right py-2 px-3">تاریخ حذف</th>
                    <th className="text-right py-2 px-3">عملیات</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const id = item.id || item.featured_id || item.ticket_id;
                const name = item.name || item.title || item.subject || item.code || 'بدون نام';
                const deletedAt = item.deleted_at || item.created_at;

                return (
                  <tr key={id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(id)}
                        onChange={() => toggleSelection(id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                      />
                    </td>
                    {/* ردیف‌ها بر اساس activeSubTab */}
                    {activeSubTab === 'users' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{id}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{item.name}</td>
                        <td className="py-2 px-3 text-gray-600">{item.email}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.role === 'admin' ? 'bg-[#800E2F]/10 text-[#800E2F]' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.role === 'admin' ? 'ادمین' : 'کاربر'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'products' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{id}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{name}</td>
                        <td className="py-2 px-3 text-[#800E2F]">{formatPrice(item.price || 0)} ت</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'categories' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{id}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{name}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'discount-codes' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{id}</td>
                        <td className="py-2 px-3 font-bold text-[#800E2F]">{item.code}</td>
                        <td className="py-2 px-3">{item.discount_type === 'percent' ? 'درصدی' : 'ثابت'}</td>
                        <td className="py-2 px-3">
                          {item.discount_type === 'percent'
                            ? `${item.discount_value}%`
                            : `${formatPrice(item.discount_value)} ت`}
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {item.used_count} {item.usage_limit ? `/ ${item.usage_limit}` : ''}
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'featured' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{id}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{item.product_name || name}</td>
                        <td className="py-2 px-3 text-green-600 font-medium">{item.discount_percent || 0}%</td>
                        <td className="py-2 px-3 text-gray-500">{formatPrice(item.original_price || 0)} ت</td>
                        <td className="py-2 px-3 text-[#800E2F] font-medium">{formatPrice(item.price || 0)} ت</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'orders' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">#{id}</td>
                        <td className="py-2 px-3 text-gray-600">{item.user_name || 'کاربر'}</td>
                        <td className="py-2 px-3 text-[#800E2F] font-medium">{formatPrice(item.total_price || 0)} ت</td>
                        <td className="py-2 px-3">{getStatusBadge(item.status)}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'reviews' && (
                      <>
                        <td className="py-2 px-3 text-gray-600">{item.user_name || 'کاربر'}</td>
                        <td className="py-2 px-3 text-gray-600">{item.product_name || 'محصول نامشخص'}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{item.comment || '-'}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'tickets' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">#{id}</td>
                        <td className="py-2 px-3 text-gray-600">{item.user_name || 'کاربر'}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{item.subject || 'بدون موضوع'}</td>
                        <td className="py-2 px-3">{getStatusBadge(item.status)}</td>
                        <td className="py-2 px-3 text-gray-600 text-center">{item.replies_count || 0}</td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                    {activeSubTab === 'banners' && (
                      <>
                        <td className="py-2 px-3 font-mono text-xs text-gray-500">{id}</td>
                        <td className="py-2 px-3 font-medium text-gray-800">{item.title || 'بدون عنوان'}</td>
                        <td className="py-2 px-3">
                          {item.image_url ? (
                            <img src={item.image_url.startsWith('http') ? item.image_url : `${item.image_url}`} alt={item.title} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <span className="text-xs text-gray-400">بدون تصویر</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-500">{new Date(deletedAt).toLocaleDateString('fa-IR')}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button onClick={() => handleRestore(id)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition">♻️ بازیابی</button>
                          <button onClick={() => handleForceDelete(id)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">💀 حذف دائمی</button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CustomConfirm
        isOpen={showBatchRestoreConfirm}
        onClose={() => setShowBatchRestoreConfirm(false)}
        onConfirm={handleBatchRestore}
        title="♻️ بازیابی گروهی"
        message={`آیا از بازیابی ${selectedItems.length} آیتم انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، بازیابی"
        cancelText="انصراف"
        variant="success"
        loading={batchLoading}
      />

      <CustomConfirm
        isOpen={showBatchForceDeleteConfirm}
        onClose={() => setShowBatchForceDeleteConfirm(false)}
        onConfirm={handleBatchForceDelete}
        title="💀 حذف دائمی گروهی"
        message={`آیا از حذف دائمی ${selectedItems.length} آیتم انتخاب‌شده مطمئن هستید؟ این عمل غیرقابل بازگشت است!`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />
    </div>
  );
}

export default TrashTab;