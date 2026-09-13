// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // اسکرول به بالای صفحه در هر تغییر مسیر
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth', // اسکرول نرم (اختیاری)
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;