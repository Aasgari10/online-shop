// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    
    console.log(`🌐 [API Request] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    
    return config;
  },
  (error) => {
    console.error('❌ [api] خطا در درخواست:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.config.method.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('❌ [api] خطای پاسخ:', error.response.status, error.response.config?.url);
      console.error('❌ [api] داده خطا:', error.response.data);
    } else if (error.request) {
      console.error('❌ [api] خطای شبکه:', error.message);
    } else {
      console.error('❌ [api] خطای ناشناخته:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;