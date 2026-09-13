// src/components/home/FeaturedProducts.jsx
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import ImageWithFallback from '../shared/ImageWithFallback';

function FeaturedProducts({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="w-full py-8" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>هیچ محصولی برای نمایش وجود ندارد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-4 pb-8" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 relative inline-block">
            <span className="text-[#800E2F]">محصولات</span> چوبی
            <span className="absolute -bottom-3 right-0 w-full h-0.5 rounded-full" style={{ backgroundColor: '#800E2F' }}></span>
          </h2>
          <p className="text-gray-400 text-sm mt-3">لوازم خانگی چوبی با کیفیت بالا</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((item) => {
            const productId = item.product_id || item.id;
            // ✅ استفاده از slug
            const productSlug = item.slug || productId;
            const link = `/product/${productSlug}`;
            
            const imgSrc = item.image_url?.startsWith('http')
              ? item.image_url
              : item.image_url
                ? `${item.image_url}`
                : item.image || null;
                
            const price = item.price ? formatPrice(item.price) : '۰';
            const name = item.name || 'بدون نام';
            const description = item.description || 'توضیحاتی برای این محصول ثبت نشده است.';

            return (
              <div
                key={productId}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <Link to={link} className="block">
                  <div className="relative overflow-hidden bg-gray-100 h-44">
                    <ImageWithFallback
                      src={imgSrc}
                      alt={name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      fallbackSrc="/fallback-image.jpg"
                    />
                  </div>
                  <div className="p-4 text-right">
                    <h3 className="text-base font-bold text-gray-800 mb-1.5 line-clamp-1">
                      {name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">
                      {description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#800E2F] hover:text-[#6B0A26] transition-colors duration-200 text-sm font-medium flex items-center gap-1">
                        ادامه
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                      <span className="text-sm font-bold text-[#800E2F]">{price} ت</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FeaturedProducts;