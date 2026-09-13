// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ فقط در کلاینت اجرا شود
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      setIsLoggedIn(!!userData);
    }
  }, []);

  const updateTotals = (items) => {
    const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    setTotalPrice(total);
    const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setTotalItems(count);
  };

  const loadCart = async () => {
    // ✅ فقط در کلاینت و در صورت لاگین بودن
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isLoggedIn) {
        const res = await api.get('/cart');
        if (res.data.success) {
          const serverItems = res.data.data;
          localStorage.setItem('cart', JSON.stringify(serverItems));
          setCartItems(serverItems);
          updateTotals(serverItems);
        }
      } else {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCartItems(parsed);
          updateTotals(parsed);
        } else {
          setCartItems([]);
          updateTotals([]);
        }
      }
    } catch (error) {
      console.error('خطا در بارگذاری سبد خرید:', error);
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
        updateTotals(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadCart();
      const handleUserChange = () => loadCart();
      window.addEventListener('user-update', handleUserChange);
      window.addEventListener('storage', (e) => {
        if (e.key === 'user') loadCart();
      });
      return () => {
        window.removeEventListener('user-update', handleUserChange);
        window.removeEventListener('storage', loadCart);
      };
    }
  }, [isLoggedIn]);

  const addToCart = async (product, quantity = 1, variation = null) => {
    if (typeof window === 'undefined') return;

    const variationId = variation?.id || null;
    const colorValueId = variation?.color_value_id || null;
    const sizeValueId = variation?.size_value_id || null;
    const attributeValuesJson = variation?.attribute_values_json || variation?.attribute_values || null;
    const colorName = variation?.color_name || null;
    const sizeName = variation?.size_name || null;

    const existingIndex = cartItems.findIndex(
      item => item.id === product.id && item.variation_id === variationId
    );

    let newItems;
    if (existingIndex !== -1) {
      newItems = [...cartItems];
      newItems[existingIndex].quantity += quantity;
    } else {
      const newItem = {
        id: product.id,
        product_id: product.id,
        variation_id: variationId,
        quantity: quantity,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        stock: variation?.stock || product.stock,
        color_value_id: colorValueId,
        size_value_id: sizeValueId,
        color_name: colorName,
        size_name: sizeName,
        attribute_values_json: attributeValuesJson,
      };
      newItems = [...cartItems, newItem];
    }

    setCartItems(newItems);
    updateTotals(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));

    if (isLoggedIn) {
      try {
        await api.post('/cart', {
          productId: product.id,
          variationId: variationId,
          quantity: quantity,
        });
        const res = await api.get('/cart');
        if (res.data.success) {
          const serverItems = res.data.data;
          setCartItems(serverItems);
          updateTotals(serverItems);
          localStorage.setItem('cart', JSON.stringify(serverItems));
        }
        toast.success(`${product.name} به سبد خرید اضافه شد`, { id: 'add-to-cart' });
      } catch (error) {
        console.error('خطا در افزودن به سبد خرید در سرور:', error);
        toast.error('خطا در افزودن به سبد خرید');
      }
    } else {
      toast.success(`${product.name} به سبد خرید اضافه شد`, { id: 'add-to-cart' });
    }
  };

  const removeFromCart = async (productId, variationId = null) => {
    if (typeof window === 'undefined') return;

    const newItems = cartItems.filter(
      item => !(item.id === productId && item.variation_id === (variationId || null))
    );
    setCartItems(newItems);
    updateTotals(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));

    if (isLoggedIn) {
      try {
        const url = variationId ? `/cart/${productId}/${variationId}` : `/cart/${productId}`;
        await api.delete(url);
        const res = await api.get('/cart');
        if (res.data.success) {
          const serverItems = res.data.data;
          setCartItems(serverItems);
          updateTotals(serverItems);
          localStorage.setItem('cart', JSON.stringify(serverItems));
        }
      } catch (error) {
        console.error('خطا در حذف از سبد خرید در سرور:', error);
        toast.error('خطا در حذف از سبد خرید');
      }
    }
  };

  const clearCart = async () => {
    if (typeof window === 'undefined') return;

    setCartItems([]);
    updateTotals([]);
    localStorage.removeItem('cart');

    if (isLoggedIn) {
      try {
        await api.delete('/cart');
      } catch (error) {
        console.error('خطا در خالی کردن سبد خرید در سرور:', error);
        toast.error('خطا در خالی کردن سبد خرید');
      }
    }
  };

  const updateQuantity = async (productId, quantity, variationId = null) => {
    if (typeof window === 'undefined') return;

    if (quantity <= 0) {
      removeFromCart(productId, variationId);
      return;
    }

    const newItems = cartItems.map(item =>
      item.id === productId && item.variation_id === (variationId || null)
        ? { ...item, quantity }
        : item
    );
    setCartItems(newItems);
    updateTotals(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));

    if (isLoggedIn) {
      try {
        await api.put('/cart', {
          productId,
          variationId: variationId || null,
          quantity,
        });
        const res = await api.get('/cart');
        if (res.data.success) {
          const serverItems = res.data.data;
          setCartItems(serverItems);
          updateTotals(serverItems);
          localStorage.setItem('cart', JSON.stringify(serverItems));
        }
      } catch (error) {
        console.error('خطا در به‌روزرسانی تعداد در سرور:', error);
        toast.error('خطا در به‌روزرسانی تعداد');
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        totalPrice,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};