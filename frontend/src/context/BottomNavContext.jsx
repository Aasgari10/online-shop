// src/context/BottomNavContext.jsx
import { createContext, useContext, useState } from 'react';

const BottomNavContext = createContext();

export const useBottomNav = () => useContext(BottomNavContext);

export const BottomNavProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);

  const hideBottomNav = () => setIsVisible(false);
  const showBottomNav = () => setIsVisible(true);

  return (
    <BottomNavContext.Provider value={{ isVisible, hideBottomNav, showBottomNav }}>
      {children}
    </BottomNavContext.Provider>
  );
};