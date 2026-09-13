// src/components/home/DiscountCarousel.jsx
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import ImageWithFallback from '../shared/ImageWithFallback';

function DiscountCarousel({
  items,
  timeLeft,
  currentSlide,
  onSlideChange,
  renderStars
}) {
  if (!items || items.length === 0) {
    return (
      <div className="w-full py-10" style={{ backgroundColor: '#f8f4ee' }}>
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>هیچ تخفیف ویژه‌ای موجود نیست.</p>
        </div>
      </div>
    );
  }

  // ===== تابع رندر ستاره‌ها با پشتیبانی از نیم‌ستاره =====
  const renderStarsWithHalf = (rating) => {
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

  const goToSlide = (index) => onSlideChange(index);
  const prevSlide = () => onSlideChange(currentSlide === 0 ? items.length - 1 : currentSlide - 1);
  const nextSlide = () => onSlideChange((currentSlide + 1) % items.length);

  return (
    <div className="w-full py-10 md:py-2" style={{ backgroundColor: '#f8f4ee' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 relative inline-block">
            تخفیف‌های <span className="text-[#800E2F]">ویژه</span>
            <span className="absolute -bottom-2 right-0 w-full h-0.5 rounded-full bg-[#800E2F]"></span>
          </h2>
          <p className="text-gray-400 text-sm mt-2">فرصت‌های استثنایی خرید</p>
        </div>

        <div className="relative flex items-stretch gap-5">
          <button
            onClick={prevSlide}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-[#800E2F]/30 flex items-center justify-center transition-all duration-300 hover:scale-105 z-10 self-center"
            aria-label="قبلی"
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#800E2F] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden border-t-2 border-[#800E2F] border border-gray-100/60 p-1">
            <div className="p-1.5 sm:p-2.5 md:p-3.5">
              {items.map((slide, index) => {
                const id = slide.id || slide.featured_id || slide.product_id;
                const time = timeLeft[id] || { days: 0, hours: 0, minutes: 0, seconds: 0 };

                const imgSrc = slide.image_url?.startsWith('http')
                  ? slide.image_url
                  : slide.image_url
                    ? `${slide.image_url}`
                    : '/fallback-image.jpg';

                // ✅ استفاده از display_price و original_price_display از پاسخ API
                const originalPrice = slide.original_price_display || slide.original_price || slide.originalPrice || slide.price;
                const finalPrice = slide.display_price || slide.price || 0;
                const discountPercent = slide.discount_percent || 0;
                const productSlug = slide.slug || slide.product_id || slide.id;
                const link = `/product/${productSlug}`;

                return (
                  <div
                    key={id}
                    className={`transition-all duration-500 ease-in-out ${
                      index === currentSlide ? 'block' : 'hidden'
                    }`}
                  >
                    <Link to={link} className="block hover:no-underline">
                      <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-4 items-stretch">
                        <div className="md:w-5/12 flex-shrink-0 w-full flex justify-end items-stretch">
                          <div className="relative w-full max-w-[280px] mr-8 bg-gradient-to-br from-[#f8f4ee] to-[#f0ebe4] rounded-2xl overflow-hidden shadow-md min-h-[200px] md:min-h-[280px]">
                            <ImageWithFallback
                              src={imgSrc}
                              alt={slide.name}
                              className="w-full h-full object-cover object-center absolute inset-0"
                              fallbackSrc="/fallback-image.jpg"
                            />
                            {discountPercent > 0 && (
                              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                                {discountPercent}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="md:w-7/12 text-right w-full flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 leading-tight">
                              {slide.name}
                            </h3>

                            <div className="w-full h-px bg-gray-200 mb-3"></div>

                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                تضمین اصالت
                              </span>
                              <div className="flex items-center gap-0.5">
                                {renderStarsWithHalf(slide.rating || slide.averageRating || 4)}
                              </div>
                              <span className="text-sm text-gray-400">({slide.totalReviews || 0})</span>
                            </div>

                            {(slide.brand || slide.weight || slide.dimensions) && (
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-xs text-gray-400 ml-1">مشخصات:</span>
                                {slide.brand && (
                                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 border border-gray-200">
                                    {slide.brand}
                                  </span>
                                )}
                                {slide.weight && (
                                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 border border-gray-200">
                                    {slide.weight}
                                  </span>
                                )}
                                {slide.dimensions && (
                                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 border border-gray-200">
                                    {slide.dimensions}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="w-full h-px bg-gray-200 my-3"></div>

                            <div className="flex flex-col items-start gap-1 mb-3">
                              {originalPrice > finalPrice && (
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(originalPrice)} ت
                                </span>
                              )}
                              <div className="flex items-center gap-3">
                                <span className="text-2xl md:text-3xl font-bold text-[#800E2F]">
                                  {formatPrice(finalPrice)} ت
                                </span>
                                {discountPercent > 0 && (
                                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                                    {discountPercent}% تخفیف
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-1">
                            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#800E2F]/5 to-[#800E2F]/10 px-5 py-2 rounded-2xl border border-[#800E2F]/15">
                              <span className="text-xs text-[#800E2F] font-bold ml-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                                </svg>
                                باقی‌مانده:
                              </span>
                              <div className="grid grid-cols-4 gap-2" dir="ltr">
                                <div className="flex flex-col items-center bg-white rounded-lg px-2 py-0.5 min-w-[40px] shadow-sm border border-gray-100">
                                  <span className="font-mono font-bold text-[#800E2F] text-lg">
                                    {String(time.days).padStart(2, '0')}
                                  </span>
                                  <span className="text-[10px] text-[#800E2F]/60 mt-0">روز</span>
                                </div>
                                <div className="flex flex-col items-center bg-white rounded-lg px-2 py-0.5 min-w-[40px] shadow-sm border border-gray-100">
                                  <span className="font-mono font-bold text-gray-700 text-lg">
                                    {String(time.hours).padStart(2, '0')}
                                  </span>
                                  <span className="text-[10px] text-gray-400 mt-0">ساعت</span>
                                </div>
                                <div className="flex flex-col items-center bg-white rounded-lg px-2 py-0.5 min-w-[40px] shadow-sm border border-gray-100">
                                  <span className="font-mono font-bold text-gray-700 text-lg">
                                    {String(time.minutes).padStart(2, '0')}
                                  </span>
                                  <span className="text-[10px] text-gray-400 mt-0">دقیقه</span>
                                </div>
                                <div className="flex flex-col items-center bg-[#800E2F]/5 rounded-lg px-2 py-0.5 min-w-[40px] shadow-sm border border-[#800E2F]/20">
                                  <span className="font-mono font-bold text-[#800E2F] text-lg">
                                    {String(time.seconds).padStart(2, '0')}
                                  </span>
                                  <span className="text-[10px] text-[#800E2F]/60 mt-0">ثانیه</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={nextSlide}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-[#800E2F]/30 flex items-center justify-center transition-all duration-300 hover:scale-105 z-10 self-center"
            aria-label="بعدی"
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-[#800E2F] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-[#800E2F] w-7'
                  : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default DiscountCarousel;