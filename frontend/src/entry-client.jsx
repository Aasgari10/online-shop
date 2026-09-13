// frontend/src/entry-client.jsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BottomNavProvider } from './context/BottomNavContext';
import { PageDataProvider } from './context/PageDataContext';
import { ProductSeoProvider } from './context/ProductSeoContext';
import App from './App';
import './index.css';

// ✅ خواندن داده‌های SSR
const initialData =
  typeof window !== 'undefined' && window.__INITIAL_DATA__
    ? window.__INITIAL_DATA__
    : {};

// ✅ پاک‌سازی متا تگ‌ها و JSON-LD سمت سرور قبل از hydration
// این کار باعث می‌شود React نسخه‌ی خودش را جایگزین کند، نه اضافه
if (typeof document !== 'undefined') {
  // ۱. حذف title سمت سرور
  document.querySelectorAll('head title').forEach(el => el.remove());

  // ۲. حذف متا تگ‌های سمت سرور
  document.querySelectorAll('head meta').forEach(el => {
    const name = el.getAttribute('name');
    const prop = el.getAttribute('property');

    if (
      name === 'description' ||
      name === 'author' ||
      (name && name.startsWith('twitter:')) ||
      (prop && prop.startsWith('og:')) ||
      (prop && prop.startsWith('product:')) ||
      (prop && prop.startsWith('article:'))
    ) {
      el.remove();
    }
  });

  // ۳. حذف canonical سمت سرور
  document.querySelectorAll('head link[rel="canonical"]').forEach(el => el.remove());

  // ✅ ۴. حذف JSON-LD سمت سرور (تا StructuredData کلاینت جایگزینش کند)
  document.querySelectorAll('head script[type="application/ld+json"]').forEach(el => {
    // فقط اسکریپت‌هایی که در <head> هستند و توسط سرور اضافه شده‌اند
    // (React 19 اسکریپت‌های structured data را در head قرار می‌دهد)
    el.remove();
  });
}

// هیدریشن با همان داده‌های SSR
hydrateRoot(
  document.getElementById('root'),
  <HelmetProvider>
    <PageDataProvider initialData={initialData}>
      <ProductSeoProvider>
        <WishlistProvider>
          <CartProvider>
            <BottomNavProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </BottomNavProvider>
          </CartProvider>
        </WishlistProvider>
      </ProductSeoProvider>
    </PageDataProvider>
  </HelmetProvider>
);