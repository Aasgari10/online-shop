// src/components/layout/MobileBottomNav.jsx
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

function MobileBottomNav() {
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();
  const location = useLocation();

  const hiddenPaths = ['/login', '/register'];
  if (hiddenPaths.includes(location.pathname)) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/70 shadow-lg flex items-center justify-around"
      style={{
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        WebkitBackdropFilter: 'saturate(180%) blur(10px)',
        backdropFilter: 'saturate(180%) blur(10px)',
        // در حالت افقی، ارتفاع رو ثابت نگه دار
        minHeight: '64px',
        maxHeight: '64px',
      }}
    >
      <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-[#800E2F]' : 'text-gray-500'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
        </svg>
        <span className="text-[10px]">خانه</span>
      </Link>

      <Link to="/shop" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/shop') || isActive('/products') ? 'text-[#800E2F]' : 'text-gray-500'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span className="text-[10px]">فروشگاه</span>
      </Link>

      <Link to="/cart" className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/cart') ? 'text-[#800E2F]' : 'text-gray-500'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white animate-pulse">
            {totalItems}
          </span>
        )}
        <span className="text-[10px]">سبد خرید</span>
      </Link>

      <Link to="/wishlist" className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/wishlist') ? 'text-[#800E2F]' : 'text-gray-500'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {totalWishlistItems > 0 && (
          <span className="absolute -top-0.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white">
            {totalWishlistItems}
          </span>
        )}
        <span className="text-[10px]">علاقه‌مندی</span>
      </Link>

      <Link to="/profile" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/profile') ? 'text-[#800E2F]' : 'text-gray-500'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-[10px]">پروفایل</span>
      </Link>
    </div>
  );
}

export default MobileBottomNav;