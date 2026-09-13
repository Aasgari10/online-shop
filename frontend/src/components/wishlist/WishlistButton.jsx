// src/components/wishlist/WishlistButton.jsx
import { useWishlist } from '../../context/WishlistContext';
import { useNavigate } from 'react-router-dom';

function WishlistButton({ product, className = '' }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isLoggedIn = !!userData;
  const isLiked = isInWishlist(product.id);
  const navigate = useNavigate();

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    toggleWishlist(product);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center transition-all duration-300 hover:scale-110 ${className}`}
      style={{
        border: 'none',              // ✅ حذف کامل دور
        padding: 0,                  // ✅ حذف padding
        background: 'transparent',   // ✅ پس‌زمینه شفاف
        boxShadow: 'none',           // ✅ حذف سایه
        width: 'auto',               // ✅ اندازه خودکار
        height: 'auto',              // ✅ اندازه خودکار
      }}
    >
      <svg
        className={`w-6 h-6 transition-colors duration-300 ${
          isLiked
            ? 'text-red-500 fill-current'
            : 'text-gray-400 fill-none hover:text-[#800E2F]'
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}

export default WishlistButton;