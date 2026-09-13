// src/entry-server.jsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BottomNavProvider } from './context/BottomNavContext';
import { PageDataProvider } from './context/PageDataContext';
import App from './App';

export default function render(url, initialData = {}) {
  console.log(`🔵 [entry-server] render called with URL: ${url}`);
  console.log(`🔵 [entry-server] initialData:`, initialData.page ? '✅ page موجود است' : '❌ page خالی است');

  const html = renderToString(
    <PageDataProvider initialData={initialData}>
      <WishlistProvider>
        <CartProvider>
          <BottomNavProvider>
            <StaticRouter location={url}>
              <App />
            </StaticRouter>
          </BottomNavProvider>
        </CartProvider>
      </WishlistProvider>
    </PageDataProvider>
  );

  console.log(`✅ [entry-server] renderToString successful, html length: ${html.length}`);
  return { html };
}