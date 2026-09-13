// src/components/home/Testimonials.jsx
import { useState, useEffect } from 'react';

function Testimonials({ testimonials }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!testimonials || testimonials.length === 0) return null;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const current = testimonials[currentIndex];

  return (
    <div className="w-full py-4" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 relative inline-block">
            <span className="text-[#800E2F]">نظرات</span> مشتریان
            <span className="absolute -bottom-3 right-0 w-full h-0.5 rounded-full" style={{ backgroundColor: '#b3808a' }}></span>
          </h2>
          <p className="text-gray-400 text-sm mt-3">نظرات خریداران واقعی</p>
        </div>

        {/* ✅ باکس اصلی با ارتفاع ثابت */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8 min-h-[260px] md:min-h-[280px] flex flex-col justify-center">
          <div className="flex flex-col items-center text-center h-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800E2F]/20 to-[#b3808a]/10 flex items-center justify-center text-3xl font-bold text-[#800E2F] mb-4 shadow-md flex-shrink-0">
              {current.name.charAt(0)}
            </div>
            <h4 className="text-lg font-bold text-gray-800 flex-shrink-0">{current.name}</h4>
            <span className="text-xs text-gray-400 flex-shrink-0">{current.date}</span>
            <div className="flex gap-1 mt-2 mb-3 flex-shrink-0">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-5 h-5 ${i < current.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            
            {/* ✅ متن نظر با ارتفاع ثابت و اسکرول در صورت نیاز */}
            <div className="flex-1 flex items-center justify-center w-full">
              <p className="text-gray-600 text-base leading-relaxed line-clamp-4 md:line-clamp-3 max-h-24 md:max-h-20 overflow-hidden">
                {current.comment}
              </p>
            </div>

            <div className="mt-3 inline-block px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100 flex-shrink-0">
              <span className="text-xs text-gray-500">خرید: {current.product}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-[#800E2F] w-8' : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Testimonials;