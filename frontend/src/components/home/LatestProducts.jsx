// src/components/home/LatestProducts.jsx
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import ImageWithFallback from '../shared/ImageWithFallback';

function LatestProducts({ products }) {
  if (!products || products.length === 0) return null;

  const latest = products.slice(0, 4);

  return (
    <div className="w-full py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 relative inline-block">
              جدیدترین <span className="text-[#800E2F]">محصولات</span>
              <span className="absolute -bottom-2 right-0 w-full h-0.5 rounded-full" style={{ backgroundColor: '#800E2F' }}></span>
            </h2>
            <p className="text-gray-400 text-sm mt-2">آخرین محصولات اضافه‌شده به فروشگاه</p>
          </div>
          <Link to="/shop" className="text-[#800E2F] hover:text-[#6B0A26] font-medium text-sm flex items-center gap-1">
            مشاهده همه
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {latest.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-40 bg-gray-100">
                {product.image_url ? (
                  <ImageWithFallback
                    src={`${product.image_url}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    fallbackSrc="/fallback-image.jpg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">بدون تصویر</div>
                )}
                <span className="absolute top-2 right-2 bg-[#800E2F] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">جدید</span>
              </div>
              <div className="p-3 text-right">
                <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{product.name}</h4>
                <span className="text-sm font-bold text-[#800E2F]">{formatPrice(product.price)} ت</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LatestProducts;