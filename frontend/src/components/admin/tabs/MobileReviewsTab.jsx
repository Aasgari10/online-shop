// src/components/admin/tabs/MobileReviewsTab.jsx
import { useState } from 'react';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import api from '../../../services/api';

function MobileReviewsTab({ reviews, onDelete, onApprove, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchApproveConfirm, setShowBatchApproveConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return (
          <svg key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-3.5 h-3.5">
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
        );
      } else {
        return (
          <svg key={i} className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    });
  };

  const filteredReviews = reviews.filter(r => {
    const matchSearch = r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' ? true :
      filterStatus === 'pending' ? r.is_approved === 0 :
      filterStatus === 'approved' ? r.is_approved === 1 : true;
    return matchSearch && matchStatus;
  });

  const toggleSelection = (id) => {
    console.log('🔄 [MobileReviewsTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredReviews.length && filteredReviews.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileReviewsTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredReviews.map(r => r.id);
      setSelectedItems(ids);
      setSelectAll(true);
      console.log('📊 همه انتخاب شدند:', ids.length);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileReviewsTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} نظر...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/reviews/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} نظر با موفقیت حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileReviewsTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی نظرات');
    } finally {
      setBatchLoading(false);
    }
  };

  // ============================================================
  // ✅ تأیید گروهی (مستقیماً API)
  // ============================================================
  const handleBatchApprove = async () => {
    if (selectedItems.length === 0) return;
    console.log('✅ [MobileReviewsTab] شروع تأیید گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال تأیید ${selectedItems.length} نظر...`);

    try {
      await Promise.all(selectedItems.map(id => api.put(`/admin/reviews/${id}/approve`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} نظر با موفقیت تأیید شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchApproveConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileReviewsTab] خطا در تأیید گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در تأیید گروهی نظرات');
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="pb-4">
      {/* فیلترها */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی نظر..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 pl-1 pt-1 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#800E2F] bg-white appearance-none bg-no-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'left 0.2rem center',
            backgroundSize: '1.25rem',
          }}
        >
          <option value="all">همه</option>
          <option value="pending">در انتظار</option>
          <option value="approved">تأییدشده</option>
        </select>
      </div>

      {/* انتخاب همه */}
      {filteredReviews.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredReviews.length})</span>
        </div>
      )}

      {/* نوار عملیات گروهی */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button onClick={() => setShowBatchDeleteConfirm(true)} className="px-2 py-1 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            🗑️ حذف
          </button>
          <button onClick={() => setShowBatchApproveConfirm(true)} className="px-2 py-1 text-[10px] bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            ✅ تأیید
          </button>
        </div>
      )}

      {/* لیست نظرات */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">نظری یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => {
            const { date, time } = formatJalaliDate(new Date(review.created_at)).split(' - ');
            return (
              <div key={review.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(review.id)}
                    onChange={() => toggleSelection(review.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{review.user_name}</span>
                        <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${review.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {review.is_approved ? '✅ تأییدشده' : '⏳ در انتظار'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                    <p className="text-[10px] text-gray-400 mt-1">محصول: {review.product_name}</p>
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      <div>{date}</div>
                      <div>{time}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      {!review.is_approved && (
                        <button onClick={() => onApprove(review.id)} className="flex-1 px-2 py-1 text-[10px] bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition">
                          ✅ تأیید
                        </button>
                      )}
                      <button onClick={() => onDelete(review.id)} className="flex-1 px-2 py-1 text-[10px] bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition">
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog حذف گروهی */}
      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی نظرات"
        message={`آیا از حذف ${selectedItems.length} نظر انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      {/* Confirm Dialog تأیید گروهی */}
      <CustomConfirm
        isOpen={showBatchApproveConfirm}
        onClose={() => setShowBatchApproveConfirm(false)}
        onConfirm={handleBatchApprove}
        title="✅ تأیید گروهی نظرات"
        message={`آیا از تأیید ${selectedItems.length} نظر انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، تأیید کن"
        cancelText="انصراف"
        variant="success"
        loading={batchLoading}
      />
    </div>
  );
}

export default MobileReviewsTab;