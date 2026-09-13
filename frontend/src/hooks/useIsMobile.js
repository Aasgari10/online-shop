// src/hooks/useIsMobile.js
import { useState, useEffect } from 'react';

/**
 * هوک تشخیص موبایل یا دسکتاپ
 * @param {number} breakpoint - عرض برش بر حسب پیکسل (پیش‌فرض: 768)
 * @returns {boolean} - اگر عرض صفحه کمتر از breakpoint باشد true
 */
function useIsMobile(breakpoint = 768) {
  // ✅ مقدار اولیه: فقط در کلاینت
  const getInitialState = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  };

  const [isMobile, setIsMobile] = useState(getInitialState);

  useEffect(() => {
    // جلوگیری از خطا در محیط SSR
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default useIsMobile;