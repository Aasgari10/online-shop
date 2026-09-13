// src/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

/**
 * هوک تشخیص Media Query
 * @param {string} query - عبارت Media Query (مثلاً '(max-width: 768px)')
 * @returns {boolean} - اگر query مطابقت داشته باشد true
 */
function useMediaQuery(query) {
  const getInitialState = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState(getInitialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // برای مرورگرهای قدیمی‌تر
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;   
}

export default useMediaQuery;