// src/context/WishlistContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      setIsLoggedIn(!!userData);
    }
  }, []);

  const fetchWishlist = async () => {
    if (typeof window === 'undefined' || !isLoggedIn) {
      setWishlist([]);
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/wishlist');
      if (response.data.success) {
        setWishlist(response.data.data);
      }
    } catch (error) {
      console.error('خطا در دریافت لیست علاقه‌مندی‌ها:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchWishlist();
    }
  }, [isLoggedIn]);

  const addToWishlist = async (product) => {
    if (typeof window === 'undefined' || !isLoggedIn) {
      toast.error('لطفاً ابتدا وارد شوید');
      return;
    }
    try {
      const response = await api.post('/wishlist', { productId: product.id });
      if (response.data.success) {
        setWishlist((prev) => [...prev, product]);
        toast.success(`${product.name} به علاقه‌مندی‌ها اضافه شد`);
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('خطا در افزودن به علاقه‌مندی‌ها');
      }
    }
  };

  const removeFromWishlist = async (productId) => {
    if (typeof window === 'undefined' || !isLoggedIn) return;
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      if (response.data.success) {
        setWishlist((prev) => prev.filter((item) => item.id !== productId));
        const product = wishlist.find((item) => item.id === productId);
        toast.success(`${product?.name || 'محصول'} از علاقه‌مندی‌ها حذف شد`);
      }
    } catch (error) {
      toast.error('خطا در حذف از علاقه‌مندی‌ها');
    }
  };

  const toggleWishlist = async (product) => {
    if (typeof window === 'undefined' || !isLoggedIn) {
      toast.error('لطفاً ابتدا وارد شوید');
      return;
    }
    const isInList = wishlist.some((item) => item.id === product.id);
    if (isInList) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  const totalWishlistItems = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        totalWishlistItems,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};