// src/components/layout/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

function Navbar() {
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [headerTitle, setHeaderTitle] = useState('HomeMart');
  const [headerSubtitle, setHeaderSubtitle] = useState('Everything for Home');
  const [userData, setUserData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadTickets, setUnreadTickets] = useState(0);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rawUser = localStorage.getItem('user');
      let parsed = null;
      try {
        parsed = rawUser ? JSON.parse(rawUser) : null;
      } catch (e) {
        console.error('❌ [Navbar] خطا در parse کردن user:', e);
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
          if (data.header_subtitle) setHeaderSubtitle(data.header_subtitle);
        }
      } catch (error) {
        console.error('❌ خطا در دریافت تنظیمات هدر:', error);
      }
    };
    fetchHeaderSettings();
  }, []);

  const fetchUnreadCount = async () => {
    if (!userData) return;
    try {
      const res = await api.get('/tickets/unread-count', {
        params: { _t: Date.now() }
      });
      if (res.data.success) {
        setUnreadTickets(res.data.data.unreadCount);
      }
    } catch (error) {
      console.error('❌ [Navbar] خطا در دریافت تعداد:', error);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('خطا در خروج:', error);
    } finally {
      localStorage.removeItem('user');
      setUserData(null);
      window.dispatchEvent(new Event('user-update'));
      toast.success('با موفقیت خارج شدید');
      navigate('/login');
      window.location.reload();
    }
  };

  // ✅✅✅ سرچ از هر صفحه‌ای → انتقال به /shop
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim() !== '') {
        params.set('search', value.trim());
      }

      const isShopPage = location.pathname === '/shop' || location.pathname === '/products';

      if (isShopPage) {
        navigate({ search: params.toString() }, { replace: true });
      } else {
        const queryStr = params.toString();
        navigate(`/shop${queryStr ? `?${queryStr}` : ''}`, { replace: false });
      }

      window.dispatchEvent(new CustomEvent('search-update', {
        detail: { search: value.trim() }
      }));
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (searchTerm.trim() !== '') {
      params.set('search', searchTerm.trim());
    }

    const isShopPage = location.pathname === '/shop' || location.pathname === '/products';

    if (isShopPage) {
      navigate({ search: params.toString() }, { replace: true });
    } else {
      const queryStr = params.toString();
      navigate(`/shop${queryStr ? `?${queryStr}` : ''}`);
    }

    window.dispatchEvent(new CustomEvent('search-update', {
      detail: { search: searchTerm.trim() }
    }));
  };

  const navLinks = [
    { name: 'خانه', path: '/' },
    { name: 'فروشگاه', path: '/shop' },
    { name: 'تماس با ما', path: '/contact' },
    { name: 'پشتیبانی', path: '/support' },
  ];

  return (
    <nav
      className="relative z-50 shadow-xl border-b border-white/10"
      dir="rtl"
      style={{
        background: 'linear-gradient(145deg, #810E2F 0%, #6B0A26 45%, #4F071C 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/5 blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isSupport = link.path === '/support';
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className="relative px-3.5 py-1.5 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-all duration-300 group"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    {link.name}
                    {isSupport && unreadTickets > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white/30 animate-pulse">
                        {unreadTickets}
                      </span>
                    )}
                  </span>
                  <span className="absolute inset-0 bg-white/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></span>
                  <span className="absolute -bottom-0.5 right-1/2 translate-x-1/2 w-0 h-0.5 bg-white/60 transition-all duration-300 group-hover:w-4/5"></span>
                </Link>
              );
            })}

            {userData?.role === 'admin' && (
              <Link
                to="/admin"
                className="relative px-3.5 py-1.5 text-sm font-medium text-white/80 hover:text-white rounded-lg transition-all duration-300 group bg-[#800E2F]/30 hover:bg-[#800E2F]/50"
              >
                <span className="relative z-10">📊 پنل مدیریت</span>
                <span className="absolute inset-0 bg-white/10 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></span>
                <span className="absolute -bottom-0.5 right-1/2 translate-x-1/2 w-0 h-0.5 bg-white/60 transition-all duration-300 group-hover:w-4/5"></span>
              </Link>
            )}
          </div>

          <Link to="/" className="flex flex-col items-center group shrink-0">
            <span className="text-2xl md:text-3xl font-bold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] group-hover:text-white/90 transition duration-300">
              {headerTitle}
            </span>
            <span className="text-[10px] tracking-[0.25em] text-white/60 uppercase group-hover:text-white/80 transition duration-300">
              {headerSubtitle}
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative group">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="جستجوی محصول..."
                  className="w-48 px-3.5 py-1.5 pr-8 text-sm border border-white/20 rounded-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            <Link
              to="/wishlist"
              className="relative p-1.5 rounded-full hover:bg-white/15 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition duration-300 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {totalWishlistItems > 0 && (
                <span className="absolute -top-1 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white/30 animate-pulse">
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            <Link
              to={userData ? '/profile' : '/login'}
              className="p-1.5 rounded-full hover:bg-white/15 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition duration-300 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            <Link
              to="/cart"
              className="relative p-1.5 rounded-full hover:bg-white/15 transition-all duration-300 group"
            >
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition duration-300 group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white/30 animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;