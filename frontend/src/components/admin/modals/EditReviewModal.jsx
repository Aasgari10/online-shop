// src/components/admin/modals/EditReviewModal.jsx
import { useState, useEffect } from 'react';

function EditReviewModal({ isOpen, onClose, review, onSave }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (review) {
      setRating(review.rating || 0);
      setComment(review.comment || '');
    }
  }, [review]);

  if (!isOpen || !review) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('لطفاً امتیاز را انتخاب کنید');
      return;
    }
    setLoading(true);
    onSave(review.id, { rating, comment })
      .finally(() => setLoading(false));
  };

  const renderStars = () => {
    return [...Array(5)].map((_, i) => {
      const starIndex = i + 1;
      const isActive = starIndex <= (hoverRating || rating);
      return (
        <button
          key={i}
          type="button"
          onClick={() => setRating(starIndex)}
          onMouseEnter={() => setHoverRating(starIndex)}
          onMouseLeave={() => setHoverRating(0)}
          className={`text-2xl transition-colors duration-200 ${
            isActive ? 'text-yellow-500' : 'text-gray-300'
          } hover:scale-110`}
        >
          ★
        </button>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">✏️ ویرایش نظر</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* اطلاعات کاربر و محصول (فقط نمایشی) */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">کاربر:</span>
                <span className="font-medium text-gray-800 mr-2">{review.user_name}</span>
              </div>
              <div>
                <span className="text-gray-500">محصول:</span>
                <span className="font-medium text-gray-800 mr-2">{review.product_name}</span>
              </div>
              <div>
                <span className="text-gray-500">تاریخ ثبت:</span>
                <span className="font-medium text-gray-800 mr-2">
                  {new Date(review.created_at).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </div>
          </div>

          {/* امتیاز */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              امتیاز *
            </label>
            <div className="flex items-center gap-1">
              {renderStars()}
              <span className="text-sm text-gray-500 mr-3">
                {rating > 0 ? `${rating} از ۵` : 'انتخاب کنید'}
              </span>
            </div>
          </div>

          {/* متن نظر */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              متن نظر
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 resize-y"
              placeholder="متن نظر را ویرایش کنید..."
            />
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#800E2F] hover:bg-[#6B0A26] text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
            >
              {loading ? 'در حال ذخیره...' : '💾 ذخیره تغییرات'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-lg font-medium transition"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditReviewModal;