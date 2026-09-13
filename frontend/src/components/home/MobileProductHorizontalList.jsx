// src/components/home/MobileProductHorizontalList.jsx
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import ImageWithFallback from '../shared/ImageWithFallback';
import { useEffect, useRef } from 'react';

function MobileProductHorizontalList({ title, products, discountLookup, icon }) {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current && products?.length > 0) {
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth - container.clientWidth;
      if (scrollWidth > 0) {
        container.scrollLeft = scrollWidth * 0.1;
      }
    }
  }, [products]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return <svg key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>;
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-3.5 h-3.5">
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
          </div>
        );
      } else {
        return <svg key={i} className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>;
      }
    });
  };

  if (!products || products.length === 0) {
    return (
      <div className="w-full py-3 container-padding" style={{ backgroundColor: '#FEFCF9' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <h3 className="text-base font-bold text-gray-800">{title}</h3>
          </div>
          <Link to="/shop" className="text-xs text-[#800E2F] hover:underline font-medium transition">مشاهده همه</Link>
        </div>
        <div className="text-center py-4 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">هیچ محصولی در این دسته‌بندی موجود نیست.</div>
      </div>
    );
  }

  const DefaultIcon = () => (
    <svg className="w-5 h-5 text-[#800E2F] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const ElectricIcon = () => (
    <svg className="w-5 h-5 text-[#800E2F] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const IconComponent = icon === 'electric' ? ElectricIcon : DefaultIcon;

  return (
    <div className="w-full py-1 px-1 container-padding" style={{ backgroundColor: '#FEFCF9' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <IconComponent />
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
        </div>
        <Link to="/shop" className="text-xs text-[#800E2F] hover:underline font-medium transition">مشاهده همه</Link>
      </div>

      <div ref={scrollContainerRef} className="flex flex-row gap-3 overflow-x-auto pb-3 scrollbar-hidden">
        {products.map((product) => {
          const discountInfo = discountLookup?.[product.id];
          const displayPrice = product.display_price || product.price || 0;
          const originalPrice = product.original_price || discountInfo?.original_price || null;
          const discountPercent = product.discount_percent || discountInfo?.discount_percent || 0;
          const isDiscounted = discountPercent > 0 && originalPrice > displayPrice;
          
          // ✅ استفاده از slug به جای id
          const productSlug = product.slug || product.id;
          const rating = product.averageRating || product.rating || 0;
          const reviewCount = product.totalReviews || 0;

          return (
            <div key={product.id} className="flex-shrink-0 w-[10.625rem] bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100/80 hover:border-[#800E2F]/20 hover:-translate-y-0.5 group flex flex-col">
              <Link to={`/product/${productSlug}`} className="block flex-1 flex flex-col">
                <div className="relative overflow-hidden bg-white aspect-[4/3]">
                  <ImageWithFallback
                    src={product.image_url ? `${product.image_url}` : null}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    fallbackSrc="/fallback-image.jpg"
                  />
                  {isDiscounted && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[0.625rem] font-bold px-2 py-0.5 rounded-full shadow-md">
                      {discountPercent}٪
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="absolute bottom-2 right-2 bg-gray-800/80 text-white text-[0.625rem] font-bold px-2 py-0.5 rounded-full">ناموجود</span>
                  )}
                </div>
                <div className="p-2.5 text-right flex-1 flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#800E2F] transition">{product.name}</h4>
                  <p className="text-[0.625rem] text-gray-400 line-clamp-1 mt-0.5">{product.description || '—————————'}</p>
                  <div className="flex items-center justify-end gap-0.5 mt-1">
                    {renderStars(rating)}
                    {reviewCount > 0 && <span className="text-[0.625rem] text-gray-400 mr-0.5">({reviewCount})</span>}
                  </div>
                  <div className="mt-auto pt-1.5 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.625rem] text-gray-400">موجودی: {product.stock || 0}</span>
                      <div className="flex items-center gap-1">
                        {isDiscounted && (
                          <span className="text-[0.5625rem] text-gray-400 line-through">{formatPrice(originalPrice)} ت</span>
                        )}
                        <span className="text-sm font-bold text-[#800E2F]">{formatPrice(displayPrice)} ت</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <style>{`
        .scrollbar-hidden { scrollbar-width: none; -ms-overflow-style: none; }
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default MobileProductHorizontalList;