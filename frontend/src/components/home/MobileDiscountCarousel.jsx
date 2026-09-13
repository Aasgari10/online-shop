// src/components/home/MobileDiscountCarousel.jsx
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';
import ImageWithFallback from '../shared/ImageWithFallback';
import { useState } from 'react';

function MobileDiscountCarousel({
  items,
  timeLeft,
  currentSlide,
  onSlideChange
}) {
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  if (!items || items.length === 0) {
    return (
      <div className="w-full py-6" style={{ backgroundColor: '#FEFCF9' }}>
        <div className="w-full px-3 text-center text-gray-400 text-xs">
          <p>هیچ تخفیف ویژه‌ای موجود نیست.</p>
        </div>
      </div>
    );
  }

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

  const goToSlide = (index) => onSlideChange(index);

  const goToNext = () => {
    const nextIndex = (currentSlide + 1) % items.length;
    onSlideChange(nextIndex);
  };

  const goToPrev = () => {
    const prevIndex = (currentSlide - 1 + items.length) % items.length;
    onSlideChange(prevIndex);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(e.targetTouches[0].clientX);
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 10) {
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    const diff = touchStartX - touchEndX;
    const threshold = 50;

    if (diff > threshold) {
      goToNext();
    } else if (diff < -threshold) {
      goToPrev();
    }

    setTouchStartX(0);
    setTouchEndX(0);
    setIsSwiping(false);
  };

  const currentItem = items[currentSlide];
  const currentId = currentItem?.id || currentItem?.featured_id || currentItem?.product_id;
  const currentTime = timeLeft[currentId] || { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return (
    <div className="w-full py-0" style={{ backgroundColor: '#FEFCF9' }}>
      <div className="w-full">
        {/* عنوان */}
        <div className="text-center mb-2">
          <h2 className="text-base font-bold text-gray-800 relative inline-block">
            تخفیف‌های <span className="text-[#800E2F]">ویژه</span>
            <span className="absolute -bottom-1 right-0 w-full h-0.5 rounded-full bg-[#800E2F]"></span>
          </h2>
        </div>

        {/* تایمر */}
        <div className="flex justify-center items-center gap-2 mb-0">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-full mb-1 shadow-md border border-[#800E2F]/10">
            <svg className="w-3.5 h-3.5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
            </svg>
            <span className="text-[10px] font-medium text-gray-600">باقی‌مانده:</span>
            <div className="flex gap-1" dir="ltr">
              <div className="flex flex-col items-center bg-white rounded-md px-1.5 py-0.5 min-w-[32px] shadow-sm border border-gray-200">
                <span className="text-sm font-mono font-bold text-[#800E2F]">{String(currentTime.days).padStart(2, '0')}</span>
                <span className="text-[7px] text-gray-400">روز</span>
              </div>
              <span className="text-sm font-bold text-gray-400 self-center">:</span>
              <div className="flex flex-col items-center bg-white rounded-md px-1.5 py-0.5 min-w-[32px] shadow-sm border border-gray-200">
                <span className="text-sm font-mono font-bold text-gray-700">{String(currentTime.hours).padStart(2, '0')}</span>
                <span className="text-[7px] text-gray-400">ساعت</span>
              </div>
              <span className="text-sm font-bold text-gray-400 self-center">:</span>
              <div className="flex flex-col items-center bg-white rounded-md px-1.5 py-0.5 min-w-[32px] shadow-sm border border-gray-200">
                <span className="text-sm font-mono font-bold text-gray-700">{String(currentTime.minutes).padStart(2, '0')}</span>
                <span className="text-[7px] text-gray-400">دقیقه</span>
              </div>
              <span className="text-sm font-bold text-gray-400 self-center">:</span>
              <div className="flex flex-col items-center bg-[#800E2F]/5 rounded-md px-1.5 py-0.5 min-w-[32px] shadow-sm border border-[#800E2F]/20">
                <span className="text-sm font-mono font-bold text-[#800E2F]">{String(currentTime.seconds).padStart(2, '0')}</span>
                <span className="text-[7px] text-gray-400">ثانیه</span>
              </div>
            </div>
          </div>
        </div>

        {/* کاروسل با سوایپ */}
        <div
          className="w-full px-0.5"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border border-gray-100/80">
            <div className="p-0.5">
              {items.map((slide, index) => {
                const id = slide.id || slide.featured_id || slide.product_id;

                const imgSrc = slide.image_url?.startsWith('http')
                  ? slide.image_url
                  : slide.image_url
                    ? `${slide.image_url}`
                    : '/fallback-image.jpg';

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
                      <div className="flex flex-row items-stretch h-[130px]">
                        {/* تصویر */}
                        <div className="flex-shrink-0 w-[130px] h-[130px] bg-gray-50 overflow-hidden relative rounded-l-xl">
                          <ImageWithFallback
                            src={imgSrc}
                            alt={slide.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                            fallbackSrc="/fallback-image.jpg"
                          />
                          {discountPercent > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                              {discountPercent}%
                            </span>
                          )}
                        </div>

                        {/* اطلاعات */}
                        <div className="flex-1 p-2 pr-3 text-right flex flex-col h-full min-h-0">
                          <div className="flex-1 min-h-0">
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#800E2F] transition">
                              {slide.name}
                            </h3>
                            <div className="min-h-[30px]">
                              <p className="text-[10px] text-gray-400 line-clamp-2 leading-normal">
                                {slide.description || '—————————'}
                              </p>
                            </div>
                            <p className="text-[11px] font-serif text-right  italic tracking-wider text-gray-400/60 mb-0 leading-none">
                              هوم مارت
                            </p>
                          </div>

                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-between -mb-1">
                              <div className="flex items-center justify-end gap-0.5">
                                {renderStars(slide.rating || slide.averageRating || 4)}
                                {slide.totalReviews > 0 && (
                                  <span className="text-[10px] text-gray-400 mr-0.5">({slide.totalReviews})</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-0.5 pt-0.5 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] text-gray-400">موجودی: {slide.stock || 0}</span>
                                {/* ===== قیمت کنار هم (افقی) ===== */}
                                <div className="flex items-center gap-1">
                                  {originalPrice > finalPrice && (
                                    <span className="text-[8px] text-gray-400 line-through">
                                      {formatPrice(originalPrice)} ت
                                    </span>
                                  )}
                                  <span className="text-[11px] font-bold text-[#800E2F]">
                                    {formatPrice(finalPrice)} ت
                                  </span>
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
        </div>

        {/* نقاط اسلاید */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-[#800E2F] w-6'
                  : 'bg-gray-300 hover:bg-gray-400 w-1.5'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MobileDiscountCarousel;