// src/components/home/MobileSpecialOffer.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function MobileSpecialOffer() {
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
    <div className="w-full py-4 container-padding" style={{ backgroundColor: '#FEFCF9' }}>
      <div className="bg-gradient-to-r from-[#800E2F] to-[#6B0A26] rounded-2xl overflow-hidden shadow-lg">
        <div className="flex flex-col items-center gap-3 p-4">
          {/* برچسب پیشنهاد ویژه */}
          <div className="flex items-center gap-2">
            <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full">
              🔥 پیشنهاد ویژه
            </span>
          </div>

          {/* عنوان و توضیحات */}
          <div className="text-center text-white">
            <h3 className="text-lg font-bold">تخفیف تابستانی</h3>
            <p className="text-white/80 text-xs mt-0.5">
              تا ۵۰٪ تخفیف برای خریدهای بالای ۵ میلیون تومان
            </p>
          </div>

          {/* تایمر */}
          <div className="flex items-center gap-1.5" dir="rtl">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[44px] border border-white/20">
              <span className="block text-lg font-bold text-white">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[8px] text-white/60">روز</span>
            </div>
            <span className="text-white text-lg font-bold">:</span>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[44px] border border-white/20">
              <span className="block text-lg font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[8px] text-white/60">ساعت</span>
            </div>
            <span className="text-white text-lg font-bold">:</span>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[44px] border border-white/20">
              <span className="block text-lg font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[8px] text-white/60">دقیقه</span>
            </div>
            <span className="text-white text-lg font-bold">:</span>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1.5 min-w-[44px] border border-white/20">
              <span className="block text-lg font-bold text-white">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[8px] text-white/60">ثانیه</span>
            </div>
          </div>

          {/* دکمه */}
          <Link
            to="/shop"
            className="bg-white text-[#800E2F] hover:bg-white/90 px-6 py-2 rounded-xl font-bold text-sm transition transform hover:scale-105 shadow-lg w-full text-center"
          >
            مشاهده تخفیف‌ها
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MobileSpecialOffer;