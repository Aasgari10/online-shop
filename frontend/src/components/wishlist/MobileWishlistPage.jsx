// src/components/wishlist/MobileWishlistPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice } from '../../utils/formatPrice';
import Spinner from '../shared/Spinner';
import toast from 'react-hot-toast';
import ImageWithFallback from '../shared/ImageWithFallback';

function MobileWishlistPage() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ بارگذاری user فقط در کلاینت
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      setIsLoggedIn(!!userData);
    }
  }, []);

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

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
    toast.success('از لیست علاقه‌مندی‌ها حذف شد');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DCC8] pb-4">
      <div className="sticky top-0 z-30 bg-[#E8DCC8] px-4 pt-1 flex items-center justify-center pb-1 border-b border-gray-200/60">
        <h1 className="text-lg font-bold text-gray-800 relative inline-block pb-1.5">
          علاقه‌مندی‌ها
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
      </div>

      <div className="mx-1 mt-1">
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-200/60 shadow-sm">
            <div className="text-5xl mb-3">📭</div>
            <h2 className="text-base font-bold text-gray-800 mb-1">لیست شما خالی است</h2>
            <p className="text-xs text-gray-500 mb-4">محصولات مورد علاقه خود را با کلیک روی قلب ذخیره کنید.</p>
            <Link
              to="/shop"
              className="inline-block bg-[#800E2F] hover:bg-[#6B0A26] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
            >
              شروع خرید
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {wishlist.map((product) => {
              const productLink = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
              const rating = product.averageRating || product.rating || 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border border-gray-100/80 group flex flex-row items-stretch h-[130px] relative"
                >
                  <Link to={productLink} className="flex-1 flex flex-row items-stretch h-full">
                    <div className="flex-shrink-0 w-[130px] h-[130px] bg-gray-50 overflow-hidden relative">
                      <ImageWithFallback
                        src={product.image_url ? `${product.image_url}` : null}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                        fallbackSrc="/fallback-image.jpg"
                      />
                    </div>

                    <div className="flex-1 p-2 pr-3 text-right flex flex-col h-full min-h-0">
                      <div className="flex-1 min-h-0">
                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#800E2F] transition">
                          {product.name}
                        </h3>

                        <div className="min-h-[32px]">
                          <p className="text-[10px] text-gray-400 line-clamp-2 leading-normal">
                            {product.description || '—————————'}
                          </p>
                        </div>

                        <p className="text-[11px] font-serif text-right mb-1.5 italic tracking-wider text-gray-400/60 mt-0 leading-none">
                          هوم مارت
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-between -mb-1">
                          <div className="flex items-center justify-end gap-0.5">
                            {renderStars(rating)}
                            {product.totalReviews > 0 && (
                              <span className="text-[10px] text-gray-400 mr-0.5">({product.totalReviews})</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemove(product.id);
                            }}
                            className="p-0.5 rounded-full hover:bg-gray-100 transition"
                          >
                            <svg
                              className="w-4 h-4 text-red-500 fill-current transition-colors duration-200"
                              fill="currentColor"
                              stroke="none"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-0.5 pt-0.5 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] text-gray-400">موجودی: {product.stock || 0}</span>
                            <span className="text-[11px] font-bold text-[#800E2F]">
                              {formatPrice(product.price)} ت
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileWishlistPage;