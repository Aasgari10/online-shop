// src/components/shared/OrderTimer.jsx
import { useState, useEffect } from 'react';

function OrderTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        
        // فقط یک بار اجرا شود (با تاخیر مجدد)
        if (!hasTriggered && onExpire) {
          setHasTriggered(true);
          
          // اجرای اولیه
          onExpire();
          
          // ✅ اجرای مجدد بعد از ۲ ثانیه (برای اطمینان از به‌روزرسانی)
          setTimeout(() => {
            onExpire();
          }, 2000);
        }
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds });
      setIsExpired(false);
    };

    calculateTimeLeft();

    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire, hasTriggered]);

  if (!expiresAt) return null;

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <p className="text-red-700 font-medium flex items-center gap-2">
          <span>⏰</span>
          <span>زمان پرداخت این سفارش به پایان رسیده است.</span>
        </p>
      </div>
    );
  }

  if (!timeLeft) return null;

  const { minutes, seconds } = timeLeft;
  const isWarning = minutes < 5;

  return (
    <div className={`p-4 rounded-lg border ${
      isWarning
        ? 'bg-red-50 border-red-200'
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏳</span>
          <span className={`font-medium ${
            isWarning ? 'text-red-700' : 'text-yellow-800'
          }`}>
            زمان باقی‌مانده برای پرداخت:
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xl font-bold" dir="ltr">
          <span className={`${isWarning ? 'text-red-600' : 'text-yellow-700'}`}>
            {String(minutes).padStart(2, '0')}
          </span>
          <span className="text-gray-400">:</span>
          <span className={`${isWarning ? 'text-red-600' : 'text-yellow-700'}`}>
            {String(seconds).padStart(2, '0')}
          </span>
          <span className="text-sm font-normal text-gray-500 mr-1">دقیقه</span>
        </div>
      </div>
      {isWarning && (
        <p className="text-sm text-red-600 mt-2">
          ⚠️ زمان باقی‌مانده کم است! لطفاً هرچه سریع‌تر پرداخت را تکمیل کنید.
        </p>
      )}
    </div>
  );
}

export default OrderTimer;