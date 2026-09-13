// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [colors, setColors] = useState({
    primary_color: '#800E2F',
    secondary_color: '#6B0A26',
    background_color: '#E8DCC8',
    text_color: '#1F2937',
    footer_bg_color: '#810E2F',
    button_hover_color: '#6B0A26',
  });
  const [loading, setLoading] = useState(true);

  const loadTheme = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        const data = res.data.data;
        const themeColors = {};
        const colorKeys = [
          'primary_color',
          'secondary_color',
          'background_color',
          'text_color',
          'footer_bg_color',
          'button_hover_color',
        ];
        colorKeys.forEach(key => {
          themeColors[key] = data[key] || colors[key];
        });
        setColors(themeColors);
        applyTheme(themeColors);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت تم:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (themeColors) => {
    const root = document.documentElement;
    Object.entries(themeColors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/_/g, '-')}`;
      root.style.setProperty(cssVar, value);
    });
  };

  useEffect(() => {
    loadTheme();

    const handleThemeUpdate = (event) => {
      if (event.detail) {
        const newColors = {};
        const colorKeys = [
          'primary_color',
          'secondary_color',
          'background_color',
          'text_color',
          'footer_bg_color',
          'button_hover_color',
        ];
        colorKeys.forEach(key => {
          newColors[key] = event.detail[key] || colors[key];
        });
        setColors(newColors);
        applyTheme(newColors);
      }
    };

    window.addEventListener('theme-updated', handleThemeUpdate);

    return () => {
      window.removeEventListener('theme-updated', handleThemeUpdate);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, loading, loadTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};