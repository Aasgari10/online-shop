// src/components/home/MobileFeaturedProducts.jsx
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import ImageWithFallback from '../shared/ImageWithFallback';

function MobileFeaturedProducts({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="w-full py-4 container-padding" style={{ backgroundColor: '#FEFCF9' }}>
        <div className="text-center py-4 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
          هیچ محصول چوبی برای نمایش وجود ندارد.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 container-padding" style={{ backgroundColor: '#FEFCF9' }}>
      <div className="text-center mb-4">
        <h3 className="text-sm font-bold text-gray-800 relative inline-block">
          <span className="text-[#800E2F]">محصولات</span> چوبی
          <span className="absolute -bottom-1 right-0 w-full h-0.5 rounded-full bg-[#800E2F]"></span>
        </h3>
        <p className="text-[10px] text-gray-400 mt-1">لوازم خانگی چوبی با کیفیت بالا</p>
      </div>

      <div className="space-y-3">
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
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100/80 hover:border-[#800E2F]/20"
            >
              <Link to={link} className="block">
                <div className="flex flex-col">
                  <div className="w-full h-[200px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <ImageWithFallback
                      src={imgSrc}
                      alt={name}
                      className="w-full h-full object-cover object-center"
                      fallbackSrc="/fallback-image.jpg"
                    />
                  </div>
                  <div className="p-3 text-right">
                    <h4 className="text-[13px] font-bold text-gray-800 line-clamp-1">
                      {name}
                    </h4>
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                      {description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                          موجودی: {item.stock || 0}
                        </span>
                        <span className="text-[13px] font-bold text-[#800E2F]">
                          {price} تومان
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

      <div className="mt-4 text-center">
        <Link
          to="/shop"
          className="inline-block px-6 py-2 text-[11px] font-medium text-[#800E2F] bg-white border border-[#800E2F]/30 rounded-full hover:bg-[#800E2F]/5 transition"
        >
          مشاهده همه محصولات چوبی
        </Link>
      </div>
    </div>
  );
}

export default MobileFeaturedProducts;