// src/components/home/SpecialOffer.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/formatPrice';

function SpecialOffer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    targetDate.setHours(23, 59, 59, 0);

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full py-16 bg-gradient-to-r from-[#800E2F] to-[#6B0A26]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right text-white">
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              🔥 پیشنهاد ویژه
            </span>
            <h3 className="text-3xl md:text-4xl font-bold">تخفیف تابستانی</h3>
            <p className="text-white/80 mt-2 text-sm md:text-base">
              تا ۵۰٪ تخفیف برای خریدهای بالای ۵ میلیون تومان
            </p>
          </div>

          {/* تایمر */}
          <div className="flex items-center gap-2" dir="rtl">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] border border-white/20">
              <span className="block text-2xl font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[10px] text-white/60">روز</span>
            </div>
            <span className="text-white text-xl font-bold">:</span>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] border border-white/20">
              <span className="block text-2xl font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[10px] text-white/60">ساعت</span>
            </div>
            <span className="text-white text-xl font-bold">:</span>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] border border-white/20">
              <span className="block text-2xl font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[10px] text-white/60">دقیقه</span>
            </div>
            <span className="text-white text-xl font-bold">:</span>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[60px] border border-white/20">
              <span className="block text-2xl font-bold text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[10px] text-white/60">ثانیه</span>
            </div>
          </div>

          <Link
            to="/shop"
            className="bg-white text-[#800E2F] hover:bg-white/90 px-6 py-3 rounded-xl font-bold transition transform hover:scale-105 shadow-lg whitespace-nowrap"
          >
            مشاهده تخفیف‌ها
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SpecialOffer;