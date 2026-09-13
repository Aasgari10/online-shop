// src/components/shop/ShopProductList.jsx
import { Link } from 'react-router-dom';
import WishlistButton from '../wishlist/WishlistButton';
import { formatPrice } from '../../utils/formatPrice';

function ShopProductList({ 
  products, 
  discountLookup, 
  onAddToCart,
  showAddToCart = false
}) {
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

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl shadow-md">
        <p className="text-xl text-gray-500">محصولی با این فیلترها پیدا نشد.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((product) => {
        const ratingNum = Number(product.averageRating) || Number(product.rating) || 0;
        const reviewCount = product.totalReviews || 0;
        const discountInfo = discountLookup[product.id];
        const isDiscounted = discountInfo?.is_discount && discountInfo.discount_percent > 0;
        const originalPrice = isDiscounted ? discountInfo.original_price : null;
        const displayPrice = product.display_price || product.price || 0;
        const cheapestStock = product.cheapest_variation?.stock || product.stock || 0;
        // ✅ استفاده از slug به جای id
        const productLink = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;

        return (
          <div 
            key={product.id} 
            className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden group flex flex-col h-full border border-gray-100 hover:border-gray-200"
          >
            <div className="absolute top-2 left-2 z-10">
              <WishlistButton product={product} />
            </div>

            <Link to={productLink} className="flex-1 flex flex-col">
              <div className="relative overflow-hidden bg-gray-50 aspect-[4/3]">
                <img
                  src={product.image_url || '/fallback-image.jpg'}
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                  onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
                />
                {isDiscounted && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                    {discountInfo.discount_percent}٪
                  </span>
                )}
              </div>

              <div className="p-3 text-right flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{product.name}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mt-0.5 flex-1">{product.description}</p>

                <div className="flex items-center gap-1 justify-end mt-1">
                  <div className="flex items-center gap-0.5">{renderStars(ratingNum)}</div>
                  {reviewCount > 0 && <span className="text-[10px] text-gray-400">({reviewCount})</span>}
                </div>

                <div className="mt-auto pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                      موجودی: {cheapestStock || 0}
                    </span>
                    <div className="flex flex-col items-end">
                      {isDiscounted && originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {formatPrice(originalPrice)} ت
                        </span>
                      )}
                      <span className="text-sm font-bold text-[#800E2F]">{formatPrice(displayPrice)} ت</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {showAddToCart && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => onAddToCart(product)}
                  className="w-full bg-[#800E2F] hover:bg-[#6B0A26] text-white py-2 rounded-xl text-sm font-medium transition"
                >
                  افزودن به سبد خرید
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ShopProductList;