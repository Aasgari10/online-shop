// src/components/wishlist/WishlistPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/formatPrice';
import Spinner from '../shared/Spinner';
import toast from 'react-hot-toast';
import ImageWithFallback from '../shared/ImageWithFallback';
import WishlistButton from './WishlistButton';

function WishlistPage() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
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
    <div className="min-h-screen bg-[#E8DCC8] md:pt-2">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-3">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 relative inline-block pb-3">
            علاقه‌مندی‌ها
            <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F] shadow-md shadow-[#800E2F]/30"></span>
          </h1>
          {wishlist.length > 0 && (
            <p className="text-gray-500 text-sm mt-3">{wishlist.length} کالا در لیست شما</p>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">لیست شما خالی است</h2>
            <p className="text-gray-500 text-sm mb-6">محصولات مورد علاقه خود را با کلیک روی قلب ذخیره کنید.</p>
            <Link
              to="/shop"
              className="inline-block bg-[#800E2F] hover:bg-[#6B0A26] text-white px-6 py-2.5 rounded-xl font-medium transition"
            >
              شروع خرید
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((product) => {
              const productLink = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
              const rating = product.averageRating || product.rating || 0;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#800E2F]/20 hover:-translate-y-1"
                >
                  <Link to={productLink} className="block">
                    <div className="relative h-48 bg-gray-50 overflow-hidden">
                      <ImageWithFallback
                        src={product.image_url ? `${product.image_url}` : null}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        fallbackSrc="/fallback-image.jpg"
                      />
                      <div className="absolute top-2 left-2 z-10">
                        <WishlistButton product={product} />
                      </div>
                      {product.stock === 0 && (
                        <span className="absolute bottom-2 right-2 bg-gray-800/80 text-white text-xs font-bold px-2 py-1 rounded-full">
                          ناموجود
                        </span>
                      )}
                    </div>
                    <div className="p-3 text-right">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-[#800E2F] transition">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {product.description || '—————————'}
                      </p>
                      <div className="flex items-center justify-end gap-0.5 mt-1">
                        {renderStars(rating)}
                        {product.totalReviews > 0 && (
                          <span className="text-[10px] text-gray-400 mr-1">({product.totalReviews})</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="text-sm font-bold text-[#800E2F]">
                          {formatPrice(product.price)} ت
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          موجودی: {product.stock || 0}
                        </span>
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

export default WishlistPage;