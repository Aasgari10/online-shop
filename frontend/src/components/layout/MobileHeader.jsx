// src/components/layout/MobileHeader.jsx
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';

function MobileHeader() {
  const [headerTitle, setHeaderTitle] = useState('HomeMart');
  const [userData, setUserData] = useState(null);

  // ✅ بارگذاری userData فقط در کلاینت
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawUser = localStorage.getItem('user');
      let parsed = null;
      try {
        parsed = rawUser ? JSON.parse(rawUser) : null;
      } catch (e) {
        console.error('❌ [MobileHeader] خطا در parse کردن user:', e);
      }
      setUserData(parsed);
    }
  }, []);

  useEffect(() => {
    const fetchHeaderSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success) {
          const data = res.data.data;
          if (data.header_title) setHeaderTitle(data.header_title);
        }
      } catch (error) {
        console.error('❌ خطا در دریافت تنظیمات هدر:', error);
      }
    };
    fetchHeaderSettings();
  }, []);

  return (
    <header
      className="w-full shadow-xl border-b border-white/10"
      style={{
        background: 'linear-gradient(145deg, #810E2F 0%, #6B0A26 45%, #4F071C 100%)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-3">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <svg className="w-6 h-6 text-white drop-shadow-lg group-hover:text-white/80 transition duration-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-lg font-bold text-white group-hover:text-white/80 transition duration-300">{headerTitle}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/contact" className="p-1.5 rounded-full hover:bg-white/15 transition-all duration-300 group">
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition duration-300 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </Link>

            <Link to="/support" className="p-1.5 rounded-full hover:bg-white/15 transition-all duration-300 group">
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition duration-300 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>

            <Link to={userData ? '/profile' : '/login'} className="p-1.5 rounded-full hover:bg-white/15 transition-all duration-300 group">
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition duration-300 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {userData?.role === 'admin' && (
              <Link to="/admin" className="p-1.5 rounded-full hover:bg-white/15 transition-all duration-300 text-white/70 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;