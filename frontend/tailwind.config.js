// frontend/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ❌ حذف فونت‌های Google
        // sans: ['Inter', 'Noto Sans Arabic', ...],
        // ✅ استفاده از فونت سیستمی
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'Vazir',
          'Shabnam',
          'Yekan',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}