// src/hooks/useSectionTheme.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useSectionTheme = (pageSlug, sectionId) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await api.get(`/theme/page/${pageSlug}/section/${sectionId}`);
      if (res.data.success) {
        setSettings(res.data.data);
        setApplied(true);
      }
    } catch (error) {
      console.error('خطا در دریافت تنظیمات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [pageSlug, sectionId]);

  // گوش دادن به رویداد اعمال تغییرات
  useEffect(() => {
    const handleThemeApplied = (event) => {
      if (event.detail.page === pageSlug && event.detail.section === sectionId) {
        setSettings(event.detail.settings);
      }
    };

    window.addEventListener('theme-applied', handleThemeApplied);
    return () => {
      window.removeEventListener('theme-applied', handleThemeApplied);
    };
  }, [pageSlug, sectionId]);

  return { settings, loading, applied };
};