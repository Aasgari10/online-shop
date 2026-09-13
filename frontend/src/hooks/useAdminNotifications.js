// src/hooks/useAdminNotifications.js
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAdminNotifications = (refreshInterval = 30000) => {
  const [notifications, setNotifications] = useState({
    pendingReviews: 0,
    newOrders: 0,
    unreadTickets: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت نوتیفیکیشن‌ها:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchNotifications, refreshInterval]);

  // تابع برای رفرش دستی (مثلاً بعد از علامت‌گذاری)
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, fetchNotifications, refresh };
};