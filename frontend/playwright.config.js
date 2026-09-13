// playwright.config.js
import { defineConfig } from '@playwright/test';

/**
 * تنظیمات کامل Playwright برای تست رگرسیون بصری
 * با استفاده از کروم نصب شده روی سیستم
 */
export default defineConfig({
  // ===== ۱. محل فایل‌های تست =====
  testDir: './tests',

  // ===== ۲. زمان timeout برای هر تست (۳۰ ثانیه) =====
  timeout: 30000,

  // ===== ۳. اجرای موازی =====
  fullyParallel: true,

  // ===== ۴. جلوگیری از اجرای تست‌های تکی در CI =====
  forbidOnly: !!process.env.CI,

  // ===== ۵. تعداد تلاش مجدد در صورت شکست =====
  retries: process.env.CI ? 2 : 0,

  // ===== ۶. تعداد کارگرهای موازی =====
  workers: process.env.CI ? 1 : undefined,

  // ===== ۷. گزارش‌دهی =====
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // ===== ۸. تنظیمات اصلی مرورگر =====
  use: {
    // آدرس پایه پروژه
    baseURL: 'http://localhost:5173',

    // حالت بی‌صدا (مرورگر نمایش داده نمیشه)
    headless: true,

    // اندازه صفحه
    viewport: { width: 1280, height: 720 },

    // عکس فقط در صورت شکست تست
    screenshot: 'only-on-failure',

    // ضبط ویدیو فقط در صورت شکست
    video: 'retain-on-failure',

    // ضبط trace برای دیباگ
    trace: 'on-first-retry',

    // ✅ استفاده از کروم نصب شده روی سیستم (بدون دانلود)
    launchOptions: {
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    }
  },

  // ===== ۹. پروژه‌ها (فقط کروم) =====
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});