// src/App.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import api from '@/services/api';

import Navbar from './components/layout/Navbar';
import MobileHeader from './components/layout/MobileHeader';
import Footer from './components/layout/Footer';
import MobileFooter from './components/layout/MobileFooter';
import MobileBottomNav from './components/layout/MobileBottomNav';

import HomePage from './components/home/HomePage';
import MobileHomePage from './components/home/MobileHomePage';

import ShopPage from './components/shop/ShopPage';
import MobileShopPage from './components/shop/MobileShopPage';

import ProductDetail from './components/product/ProductDetail';
import MobileProductDetail from './components/product/MobileProductDetail';

import CartPage from './components/cart/CartPage';
import MobileCartPage from './components/cart/MobileCartPage';

import PaymentPage from './components/cart/PaymentPage';

import WishlistPage from './components/wishlist/WishlistPage';
import MobileWishlistPage from './components/wishlist/MobileWishlistPage';

import Login from './components/auth/Login';
import MobileLogin from './components/auth/MobileLogin';
import Register from './components/auth/Register';
import MobileRegister from './components/auth/MobileRegister';
import Profile from './components/auth/Profile';
import MobileProfile from './components/auth/MobileProfile';

import SupportTickets from './components/support/SupportTickets';
import MobileSupportTickets from './components/support/MobileSupportTickets';

import PageViewer from './components/PageViewer';

import AdminDashboard from './components/admin/AdminDashboard';
import MobileAdminDashboard from './components/admin/MobileAdminDashboard';
import AddProductPage from './components/admin/AddProductPage';
import EditProduct from './components/admin/EditProduct';

import OrderDetail from './components/order/OrderDetail';
import MobileOrderDetail from './components/order/MobileOrderDetail';

import SeoManager from './components/seo/SeoManager';
import StructuredData from './components/seo/StructuredData';
import { ProductSeoProvider } from './context/ProductSeoContext';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BottomNavProvider, useBottomNav } from './context/BottomNavContext';
import { usePageData } from './context/PageDataContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const { isVisible: isBottomNavVisible } = useBottomNav();

  const initialData = usePageData();
  const { siteSettings } = initialData;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 1024);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  const [favicon, setFavicon] = useState(siteSettings?.favicon || '/favicon.png');

  useEffect(() => {
    if (siteSettings?.favicon) {
      setFavicon(siteSettings.favicon);
    }
  }, [siteSettings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !siteSettings?.favicon) {
      const fetchSiteData = async () => {
        try {
          const settingsRes = await api.get('/pages/site-settings');
          if (settingsRes.data.success) {
            const content = settingsRes.data.data.content_json || {};
            if (content.favicon) setFavicon(content.favicon);
          }
        } catch (error) {
          console.error('❌ خطا در دریافت تنظیمات سایت:', error);
        }
      };
      fetchSiteData();
    }
  }, [siteSettings]);

  const isAdminPath = location.pathname.startsWith('/admin');
  const showBottomNav = isMobile && !isAdminPath && isBottomNavVisible;
  const headerHeight = isMobile ? 56 : 64;

  return (
    <>
      {/* ✅ تنها منبع متا تگ‌ها */}
      <SeoManager />
      <StructuredData />

      {/* آیکون‌ها */}
      <link rel="icon" href={favicon} />
      <link rel="apple-touch-icon" href={favicon} />

      <div className="flex flex-col min-h-screen">
        <ScrollToTop />

        <div className="fixed top-0 left-0 right-0 z-50" style={{ height: `${headerHeight}px` }}>
          {isMobile ? <MobileHeader /> : <Navbar />}
        </div>

        <main className="flex-1" style={{ paddingTop: `${headerHeight}px` }}>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { duration: 3000, style: { background: '#22c55e', color: '#fff' } },
              error: { duration: 4000, style: { background: '#ef4444', color: '#fff' } },
            }}
          />

          <Routes>
            <Route path="/" element={<>{isMobile ? <MobileHomePage /> : <HomePage />}</>} />
            <Route path="/shop" element={<>{isMobile ? <MobileShopPage /> : <ShopPage />}</>} />
            <Route path="/products" element={<>{isMobile ? <MobileShopPage /> : <ShopPage />}</>} />
            <Route path="/product/:slug" element={<>{isMobile ? <MobileProductDetail /> : <ProductDetail />}</>} />
            <Route path="/cart" element={<>{isMobile ? <MobileCartPage /> : <CartPage />}</>} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/wishlist" element={<>{isMobile ? <MobileWishlistPage /> : <WishlistPage />}</>} />
            <Route path="/login" element={<>{isMobile ? <MobileLogin /> : <Login />}</>} />
            <Route path="/register" element={<>{isMobile ? <MobileRegister /> : <Register />}</>} />
            <Route path="/profile" element={<>{isMobile ? <MobileProfile /> : <Profile />}</>} />
            <Route path="/contact" element={<PageViewer />} />
            <Route path="/support" element={<PageViewer />} />
            <Route path="/page/:slug" element={<PageViewer />} />
            <Route path="/support/tickets" element={<>{isMobile ? <MobileSupportTickets /> : <SupportTickets />}</>} />
            <Route path="/admin" element={<>{isMobile ? <MobileAdminDashboard /> : <AdminDashboard />}</>} />
            <Route path="/admin/products" element={<AddProductPage />} />
            <Route path="/admin/products/edit/:id" element={<EditProduct />} />
            <Route path="/order/:id" element={<>{isMobile ? <MobileOrderDetail /> : <OrderDetail />}</>} />
          </Routes>
        </main>

        {!isAdminPath && (
          <div className="w-full">
            {isMobile ? <MobileFooter showBottomNav={showBottomNav} /> : <Footer />}
          </div>
        )}

        {showBottomNav && <MobileBottomNav />}
      </div>
    </>
  );
}

function App() {
  return (
    <ProductSeoProvider>
      <WishlistProvider>
        <CartProvider>
          <BottomNavProvider>
            <AppContent />
          </BottomNavProvider>
        </CartProvider>
      </WishlistProvider>
    </ProductSeoProvider>
  );
}

export default App;