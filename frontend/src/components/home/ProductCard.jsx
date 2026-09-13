// src/components/home/ProductCard.jsx
import { Link } from 'react-router-dom';
import WishlistButton from '../wishlist/WishlistButton';
import { formatPrice } from '../../utils/formatPrice';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

function ProductCard({ product, discountInfo, isAdmin, onEdit, onDelete, showAddToCart = false }) {
  const { addToCart } = useCart();

  const getCheapestVariation = () => {
    if (product.cheapest_variation) return product.cheapest_variation;
    if (!product.variations?.length) return null;
    const available = product.variations.filter(v => (v.stock || 0) > 0);
    const list = available.length ? available : product.variations;
    return list.reduce((min, v) => {
      const price = parseFloat(v.price) || parseFloat(product.price) || 0;
      const minPrice = parseFloat(min.price) || parseFloat(product.price) || 0;
      return price < minPrice ? v : min;
    }, list[0]);
  };

  const cheapest = getCheapestVariation();
  const displayPrice = product.display_price ?? cheapest?.price ?? product.price ?? 0;
  const originalPrice = product.original_price ?? cheapest?.original_price ?? null;
  const discountPercent = product.discount_percent ?? cheapest?.discount_percent ?? 0;
  const isDiscounted = discountPercent > 0 && originalPrice > displayPrice;
  const displayStock = cheapest?.stock ?? product.stock ?? 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (displayStock === 0) {
      toast.error('این محصول موجودی ندارد');
      return;
    }
    await addToCart({
      ...product,
      price: displayPrice,
      stock: displayStock,
      variation_id: cheapest?.id || null,
      color_name: cheapest?.color_name || null,
      size_name: cheapest?.size_name || null,
      attribute_values_json: cheapest?.attribute_values_json || null,
    }, 1);
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating || 0);
    const half = (rating || 0) % 1 >= 0.5;
    return [...Array(5)].map((_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < full ? 'text-yellow-500 fill-current' : i === full && half ? 'text-yellow-500 fill-current opacity-50' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ));
  };

  const productLink = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;

  return (
    <div className="relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group hover:-translate-y-1 hover:shadow-[#800E2F]/10 flex flex-col h-full">
      {/* دکمه قلب - مطلق روی تصویر، بدون اشغال فضای اضافی */}
      <div className="absolute top-2 left-2 z-10">
        <WishlistButton product={product} />
      </div>

      <Link to={productLink} className="block flex-1 flex flex-col">
        <div className="relative overflow-hidden bg-[#f8f4ee] aspect-[4/3]">
          <img
            src={product.image_url ? `${product.image_url}` : '/fallback-image.jpg'}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
          />
          {isDiscounted && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              {discountPercent}٪
            </span>
          )}
          {displayStock === 0 && (
            <span className="absolute bottom-2 right-2 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              ناموجود
            </span>
          )}
        </div>

        <div className="p-3 text-right flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{product.name}</h3>
          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{product.description || '—————————'}</p>

          <div className="flex items-center justify-end gap-0.5 mt-1">
            {renderStars(product.averageRating || 0)}
            {product.totalReviews > 0 && (
              <span className="text-[10px] text-gray-400 mr-1">({product.totalReviews})</span>
            )}
          </div>

          {/* بخش قیمت و موجودی - با mt-auto به پایین چسبیده */}
          <div className="mt-auto pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">موجودی: {displayStock || 0}</span>
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
            onClick={handleAddToCart}
            disabled={displayStock === 0}
            className={`w-full py-2 rounded-xl text-white text-sm font-medium transition shadow-sm hover:shadow ${
              displayStock === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-[#800E2F] hover:bg-[#6B0A26] active:scale-95'
            }`}
          >
            {displayStock === 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductCard;