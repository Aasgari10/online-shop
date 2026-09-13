// src/components/home/MobileTestimonials.jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function MobileTestimonials({ testimonials }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPaused || !testimonials || testimonials.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
  }, [isPaused, testimonials]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  useEffect(() => {
    if (!isPaused) startAutoPlay();
    else stopAutoPlay();
  }, [isPaused, startAutoPlay, stopAutoPlay]);

  const handleTouchStart = useCallback((e) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setIsPaused(true);
  }, []);
  const handleTouchMove = useCallback((e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (!testimonials || testimonials.length === 0) {
      setTouchStartX(0); setTouchEndX(0); setIsPaused(false); return;
    }
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      else setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    }
    setTouchStartX(0); setTouchEndX(0); setIsPaused(false);
  }, [touchStartX, touchEndX, testimonials]);

  const goToSlide = useCallback((index) => {
    if (!testimonials || testimonials.length === 0) return;
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  }, [testimonials]);

  if (!testimonials || testimonials.length === 0) return null;

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<svg key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <defs><linearGradient id={`halfStar-${i}`}><stop offset="50%" stopColor="currentColor" /><stop offset="50%" stopColor="#D1D5DB" /></linearGradient></defs>
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" fill={`url(#halfStar-${i})`} />
          </svg>
        );
      } else {
        stars.push(<svg key={i} className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>);
      }
    }
    return stars;
  };

  const current = testimonials[currentIndex];

  return (
    <div className="w-full py-2 container-padding p-1" style={{ backgroundColor: '#FEFCF9' }}>
      <div className="text-center mb-3">
        <h3 className="text-base font-bold text-gray-800">💬 نظرات مشتریان</h3>
        <p className="text-xs text-gray-400">نظرات خریداران واقعی</p>
      </div>
      <div 
        className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100/80 p-3"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#800E2F]/10 flex items-center justify-center text-[#800E2F] mb-2">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          </div>
          <h4 className="text-sm font-bold text-gray-800">{current.name}</h4>
          <span className="text-[0.625rem] text-gray-400 mt-0.5">{current.date}</span>
          <div className="flex items-center gap-0.5 mt-1">{renderStars(current.rating)}</div>
          <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-3">{current.comment}</p>
          {current.product && (
            <div className="mt-2 inline-block px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
              <span className="text-[0.625rem] text-gray-500">خرید: {current.product}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {testimonials.map((_, index) => (
          <button key={index} onClick={() => goToSlide(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-[#800E2F] w-6' : 'bg-gray-300 hover:bg-gray-400 w-2'}`} />
        ))}
      </div>
    </div>
  );
}

export default MobileTestimonials;