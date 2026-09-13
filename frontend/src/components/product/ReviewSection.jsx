// src/components/product/ReviewSection.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

function ReviewSection({ productId }) {
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState({ rating: 0, comment: '' });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ rating: 0, comment: '' });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [highlightedReviewId, setHighlightedReviewId] = useState(null);

  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isLoggedIn = !!userData;
  const isAdmin = userData?.role === 'admin';

  // ===== تابع رندر ستاره‌ها با پشتیبانی از نیم‌ستاره (قرینه - RTL) =====
  const renderStars = (rating, interactive = false, onChange = null) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        // ستاره کامل
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange && onChange(i + 1)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        );
      } else if (i === fullStars && hasHalfStar) {
        // نیم‌ستاره
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange && onChange(i + 1)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <div className="relative w-5 h-5">
              <svg className="absolute top-0 right-0 w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <svg className="absolute top-0 right-0 w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </div>
          </button>
        );
      } else {
        // ستاره خالی
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange && onChange(i + 1)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <svg className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        );
      }
    });
  };

  const renderSafeHTML = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/products/${productId}/reviews`);
      if (response.data.success) {
        const data = response.data.data;
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      }
    } catch (error) {
      console.error('خطا در دریافت نظرات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (location.hash && location.hash.startsWith('#review-')) {
      const reviewId = parseInt(location.hash.replace('#review-', ''));
      if (!isNaN(reviewId)) {
        setHighlightedReviewId(reviewId);
        setTimeout(() => {
          const element = document.getElementById(`review-${reviewId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              setHighlightedReviewId(null);
            }, 3000);
          }
        }, 500);
      }
    }
  }, [location.hash, reviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('لطفاً ابتدا وارد شوید');
      return;
    }
    if (!userReview.comment.trim()) {
      toast.error('لطفاً متن نظر را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/products/${productId}/reviews`, {
        rating: userReview.rating || 0,
        comment: userReview.comment,
      });
      if (response.data.success) {
        toast.success(response.data.message || 'نظر شما با موفقیت ثبت شد');
        setUserReview({ rating: 0, comment: '' });
        fetchReviews();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        toast.error(error.response.data.errors.join(', '));
      } else {
        toast.error('خطا در ثبت نظر');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingData.comment.trim()) {
      toast.error('لطفاً متن نظر را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put(`/reviews/${editingId}`, {
        rating: editingData.rating || 0,
        comment: editingData.comment,
      });
      if (response.data.success) {
        toast.success('نظر با موفقیت ویرایش شد');
        setEditingId(null);
        setEditingData({ rating: 0, comment: '' });
        fetchReviews();
      }
    } catch (error) {
      toast.error('خطا در ویرایش نظر');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('آیا از حذف این نظر مطمئن هستید؟')) return;
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      if (response.data.success) {
        toast.success('نظر با موفقیت حذف شد');
        fetchReviews();
      }
    } catch (error) {
      toast.error('خطا در حذف نظر');
    }
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) {
      toast.error('متن پاسخ را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating: 5,
        comment: replyText.trim(),
        parentId: parentId,
      });
      toast.success('پاسخ با موفقیت ثبت شد');
      setReplyText('');
      setReplyingTo(null);
      fetchReviews();
    } catch (error) {
      console.error('❌ خطا در ثبت پاسخ:', error);
      toast.error(error.response?.data?.message || 'خطا در ثبت پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#800E2F] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-800">نظرات کاربران</h3>
          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
            {totalReviews} نظر
          </span>
        </div>
        {averageRating > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{averageRating.toFixed(1)}</span>
            <div className="flex items-center gap-0.5">{renderStars(Math.round(averageRating))}</div>
          </div>
        )}
      </div>

      {isLoggedIn && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm mb-6">
          <h4 className="font-bold text-gray-800 mb-3">نظر خود را بنویسید</h4>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">امتیاز (اختیاری)</label>
              <div className="flex items-center gap-1">
                {renderStars(userReview.rating, true, (val) => setUserReview({ ...userReview, rating: val }))}
                <span className="text-sm text-gray-500 mr-2">
                  {userReview.rating > 0 ? `${userReview.rating} از ۵` : 'انتخاب نکردید'}
                </span>
              </div>
            </div>
            <div className="mb-3">
              <textarea
                value={userReview.comment}
                onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                placeholder="نظر خود را درباره این محصول بنویسید..."
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-[#FEFCF9]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800E2F] hover:bg-[#6B0A26]'
              }`}
            >
              {submitting ? 'در حال ارسال...' : 'ارسال نظر'}
            </button>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 bg-[#FEFCF9] rounded-xl border border-gray-200">
          <p className="text-gray-500">هنوز نظری برای این محصول ثبت نشده است.</p>
          {!isLoggedIn && (
            <p className="text-sm text-gray-400 mt-1">برای ثبت نظر، وارد حساب کاربری خود شوید.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOwner = review.user_id === userData?.id;
            const isEditing = editingId === review.id;
            const isReplying = replyingTo === review.id;
            const isHighlighted = highlightedReviewId === review.id;
            const hasReplies = review.replies && review.replies.length > 0;

            return (
              <div
                key={review.id}
                id={`review-${review.id}`}
                className={`rounded-xl p-4 border transition-all duration-500 ${
                  isHighlighted
                    ? 'bg-yellow-50 border-yellow-400 shadow-lg shadow-yellow-200/50 scale-[1.01]'
                    : isOwner
                    ? 'bg-[#FEFCF9] border-[#800E2F]/30 shadow-md shadow-[#800E2F]/5'
                    : 'bg-[#FEFCF9] border-gray-200 shadow-sm'
                }`}
                style={{
                  transition: 'all 0.5s ease-in-out'
                }}
              >
                {isEditing ? (
                  <form onSubmit={handleUpdateReview}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">امتیاز شما</label>
                      <div className="flex items-center gap-1">
                        {renderStars(editingData.rating, true, (val) => setEditingData({ ...editingData, rating: val }))}
                        <span className="text-sm text-gray-500 mr-2">{editingData.rating > 0 ? `${editingData.rating} از ۵` : 'انتخاب نکردید'}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <textarea
                        value={editingData.comment}
                        onChange={(e) => setEditingData({ ...editingData, comment: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-[#FEFCF9]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1.5 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
                      >
                        {submitting ? '...' : 'ذخیره'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingData({ rating: 0, comment: '' });
                        }}
                        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                      >
                        انصراف
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isOwner ? 'bg-[#800E2F]' : 'bg-gray-400'
                      }`}>
                        {getInitials(review.user_name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-800">{review.user_name}</span>
                        {isOwner && (
                          <span className="text-[10px] font-medium bg-[#800E2F] text-white px-2 py-0.5 rounded-full">
                            شما
                          </span>
                        )}
                        <span className="text-xs text-gray-400">• {formatDate(review.created_at)}</span>
                        {!review.is_approved && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            ⏳ در انتظار تأیید
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                          <span dangerouslySetInnerHTML={renderSafeHTML(review.comment)} />
                        </p>
                      )}

                      {hasReplies && (
                        <div className="mt-3 mr-6 space-y-2 border-r-2 border-gray-200 pr-4">
                          {review.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-bold text-[#800E2F]">{reply.user_name}</span>
                                {reply.user_role === 'admin' && (
                                  <span className="text-xs bg-[#800E2F] text-white px-2 py-0.5 rounded-full">ادمین</span>
                                )}
                                <span className="text-xs text-gray-400">• {formatDate(reply.created_at)}</span>
                              </div>
                              <p className="text-gray-700 text-sm mt-1">
                                <span dangerouslySetInnerHTML={renderSafeHTML(reply.comment)} />
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-3">
                          {isReplying ? (
                            <div className="mt-2">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows="2"
                                placeholder="پاسخ خود را بنویسید..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] text-sm"
                              />
                              <div className="flex gap-2 mt-1">
                                <button
                                  onClick={() => handleReply(review.id)}
                                  disabled={submitting}
                                  className="px-3 py-1 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50"
                                >
                                  {submitting ? '...' : 'ارسال پاسخ'}
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                                >
                                  انصراف
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(review.id)}
                              className="text-xs text-blue-500 hover:text-blue-700 transition flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              پاسخ
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {(isOwner || isAdmin) && (
                      <div className="flex-shrink-0 flex items-center gap-1.5">
                        {isOwner && (
                          <button
                            onClick={() => {
                              setEditingId(review.id);
                              setEditingData({ rating: review.rating, comment: review.comment || '' });
                            }}
                            className="p-1.5 rounded-lg text-[#800E2F] hover:bg-[#800E2F]/10 transition-colors"
                            title="ویرایش"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="حذف"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReviewSection;