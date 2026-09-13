// src/components/admin/tabs/ReviewsTab.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import Spinner from '../../shared/Spinner';
import PageHeader from '../../shared/PageHeader';

function ReviewsTab({ reviews: initialReviews, onDelete, onEdit, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('main');

  const [autoApprove, setAutoApprove] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [reviews, setReviews] = useState(initialReviews || []);

  // ===== تابع رندر ستاره‌ها با پشتیبانی از نیم‌ستاره =====
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return (
          <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-4 h-4">
            <svg className="absolute top-0 right-0 w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <svg className="absolute top-0 right-0 w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
        );
      } else {
        return (
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    });
  };

  const renderStatus = (review) => {
    if (review.deleted_at) {
      return <span className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full">🗑️ حذف شده</span>;
    }
    if (review.is_approved === 0) {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ در انتظار</span>;
    }
    if (review.is_approved === 1) {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ تأیید شده</span>;
    }
    return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">نامشخص</span>;
  };

  useEffect(() => {
    setReviews(initialReviews || []);
  }, [initialReviews]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        const autoApproveSetting = res.data.data.find(s => s.key === 'auto_approve_reviews');
        setAutoApprove(autoApproveSetting ? autoApproveSetting.value === '1' : false);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت تنظیمات:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchPendingReviews = async () => {
    setPendingLoading(true);
    try {
      const res = await api.get('/admin/reviews/pending');
      if (res.data.success) {
        setPendingReviews(res.data.data);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت نظرات در انتظار:', error);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchPendingReviews();
  }, []);

  const handleToggleAutoApprove = async () => {
    const newValue = !autoApprove;
    try {
      await api.put('/admin/settings', {
        settings: { auto_approve_reviews: newValue }
      });
      setAutoApprove(newValue);
      toast.success(`تایید خودکار نظرات ${newValue ? 'فعال' : 'غیرفعال'} شد`);
      await fetchPendingReviews();
      if (onRefresh) {
        await onRefresh();
      } else {
        const res = await api.get('/admin/reviews');
        if (res.data.success) setReviews(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در تغییر تنظیمات');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`);
      toast.success('نظر با موفقیت تأیید شد');
      setPendingReviews(prev => prev.filter(r => r.id !== id));
      await fetchPendingReviews();
      if (onRefresh) {
        await onRefresh();
      } else {
        const res = await api.get('/admin/reviews');
        if (res.data.success) setReviews(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در تأیید نظر');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('آیا از رد این نظر مطمئن هستید؟')) return;
    try {
      await api.put(`/admin/reviews/${id}/reject`);
      toast.success('نظر با موفقیت رد شد');
      setPendingReviews(prev => prev.filter(r => r.id !== id));
      await fetchPendingReviews();
      if (onRefresh) {
        await onRefresh();
      } else {
        const res = await api.get('/admin/reviews');
        if (res.data.success) setReviews(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در رد نظر');
    }
  };

  const getDisplayReviews = () => {
    let allReviews = reviews;
    if (activeTab === 'main') {
      allReviews = reviews.filter(r => r.parent_id === null);
    } else if (activeTab === 'replies') {
      allReviews = reviews.filter(r => r.parent_id !== null);
    }
    return allReviews;
  };

  const displayReviews = getDisplayReviews();

  const filteredReviews = displayReviews.filter(r =>
    r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.id).includes(searchTerm)
  );

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredReviews.length && filteredReviews.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredReviews.map(r => r.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchLoading(true);
    try {
      const promises = selectedItems.map(id => api.delete(`/reviews/${id}`));
      await Promise.all(promises);
      toast.success(`${selectedItems.length} نظر با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) {
        await onRefresh();
      } else {
        const res = await api.get('/admin/reviews');
        if (res.data.success) setReviews(res.data.data);
      }
      fetchPendingReviews();
    } catch (error) {
      toast.error('خطا در حذف گروهی نظرات');
    } finally {
      setBatchLoading(false);
    }
  };

  if (settingsLoading) return <Spinner size="sm" />;

  const mainCount = reviews.filter(r => r.parent_id === null).length;
  const repliesCount = reviews.filter(r => r.parent_id !== null).length;

  return (
    <div>
      <PageHeader
        title="💬 مدیریت نظرات"
        subtitle="تأیید، ویرایش و حذف نظرات کاربران"
        className="mt-3"
      />

      <div className="relative overflow-hidden bg-gradient-to-br mt-4 from-blue-50 via-indigo-50/30 to-white rounded-2xl border border-blue-200/60 p-5 md:p-6 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 mr-2 ml-2">
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 flex items-start gap-4">
            <div className="flex-shrink-0 p-2.5 bg-blue-100 rounded-xl shadow-sm">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">تایید خودکار نظرات</h4>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed max-w-lg">
                {autoApprove
                  ? '✅ نظرات کاربران بدون نیاز به تأیید شما منتشر می‌شوند.'
                  : '⏳ نظرات کاربران در وضعیت "در انتظار" قرار می‌گیرند و باید توسط شما تأیید شوند.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex flex-col items-end">
              <span className={`text-sm font-bold ${autoApprove ? 'text-green-600' : 'text-gray-500'}`}>
                {autoApprove ? 'فعال' : 'غیرفعال'}
              </span>
              <span className="text-[10px] text-gray-400">
                {autoApprove ? 'بدون نیاز به تأیید' : 'نیاز به تأیید'}
              </span>
            </div>

            <button
              onClick={handleToggleAutoApprove}
              className={`relative w-16 h-9 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                autoApprove ? 'bg-green-500 shadow-lg shadow-green-200/50' : 'bg-gray-300 shadow-sm'
              }`}
              style={{
                boxShadow: autoApprove ? '0 4px 14px rgba(34, 197, 94, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <span
                className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out ${
                  autoApprove ? 'left-[33px]' : 'left-1'
                }`}
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-3 mr-2">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'main' ? 'bg-[#800E2F] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💬 نظرات اصلی ({mainCount})
        </button>
        <button
          onClick={() => setActiveTab('replies')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition relative ${
            activeTab === 'replies' ? 'bg-[#800E2F] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          🔄 پاسخ‌ها ({repliesCount})
          {repliesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
              {repliesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition relative ${
            activeTab === 'pending' ? 'bg-[#800E2F] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⏳ در انتظار تأیید ({pendingReviews.length})
          {pendingReviews.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
              {pendingReviews.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 mr-2">
          {activeTab === 'main' && 'نظرات اصلی'}
          {activeTab === 'replies' && 'پاسخ‌ها'}
          {activeTab === 'pending' && 'نظرات در انتظار تأیید'}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس کاربر، محصول یا نظر..."
            className="ml-20 w-56 px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          {selectedItems.length > 0 && activeTab !== 'pending' && (
            <button
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
            >
              🗑️ حذف گروهی ({selectedItems.length})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              {activeTab !== 'pending' && (
                <th className="text-right py-2 px-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                    disabled={filteredReviews.length === 0}
                  />
                </th>
              )}
              <th className="text-right py-2 px-3">کاربر</th>
              <th className="text-right py-2 px-3">محصول</th>
              <th className="text-right py-2 px-3">امتیاز</th>
              <th className="text-right py-2 px-3">نظر</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">تاریخ</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'pending' ? (
              pendingLoading ? (
                <tr><td colSpan="8" className="text-center py-8"><Spinner size="sm" /></td></tr>
              ) : pendingReviews.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">هیچ نظری در انتظار تأیید نیست.</td></tr>
              ) : (
                pendingReviews.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3">{r.user_name}</td>
                    <td className="py-2 px-3">
                      <Link to={`/product/${r.product_slug || r.product_id}`} className="text-blue-600 hover:underline" target="_blank">
                        {r.product_name}
                      </Link>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-0.5">{renderStars(r.rating)}</div>
                    </td>
                    <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{r.comment || '-'}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⏳ در انتظار</span>
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{formatJalaliDate(new Date(r.created_at))}</td>
                    <td className="py-2 px-3 flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition"
                      >
                        ✅ تأیید
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition"
                      >
                        ❌ رد
                      </button>
                    </td>
                  </tr>
                ))
              )
            ) : (
              filteredReviews.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-8 text-gray-500">نظری یافت نشد</td></tr>
              ) : (
                filteredReviews.map((r) => {
                  const reviewId = Number(r.id);
                  // ✅ استفاده از product_slug
                  const productSlug = r.product_slug || r.product_id;
                  const productLink = `/product/${productSlug}#review-${reviewId}`;

                  return (
                    <tr key={reviewId} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(reviewId)}
                          onChange={() => toggleSelection(reviewId)}
                          className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                        />
                      </td>
                      <td className="py-2 px-3 font-medium text-gray-800">{r.user_name}</td>
                      <td className="py-2 px-3">
                        <Link to={productLink} className="text-blue-600 hover:text-blue-800 hover:underline transition" target="_blank">
                          {r.product_name}
                        </Link>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-0.5">{renderStars(r.rating)}</div>
                      </td>
                      <td className="py-2 px-3 text-gray-600 max-w-xs truncate">{r.comment || '-'}</td>
                      <td className="py-2 px-3">{renderStatus(r)}</td>
                      <td className="py-2 px-3 text-gray-500 text-xs">{formatJalaliDate(new Date(r.created_at))}</td>
                      <td className="py-2 px-3 flex gap-1.5 flex-wrap">
                        <Link to={productLink} target="_blank" className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 transition">
                          👁️ مشاهده
                        </Link>
                        <button onClick={() => onEdit(r)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition">
                          ✏️ ویرایش
                        </button>
                        <button onClick={() => onDelete(reviewId)} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition">
                          🗑️ حذف
                        </button>
                      </td>
                    </tr>
                  );
                })
              )
            )}
          </tbody>
        </table>
      </div>

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی نظرات"
        message={`آیا از حذف ${selectedItems.length} نظر انتخاب‌شده مطمئن هستید؟ این نظرات به سطل زباله منتقل خواهند شد.`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />
    </div>
  );
}

export default ReviewsTab;