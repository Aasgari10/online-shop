// frontend/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BottomNavProvider } from './context/BottomNavContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <WishlistProvider>
        <CartProvider>
          <BottomNavProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </BottomNavProvider>
        </CartProvider>
      </WishlistProvider>
    </HelmetProvider>
  </StrictMode>
);