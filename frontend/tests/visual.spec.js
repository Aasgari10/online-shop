// tests/contact.spec.js
import { test, expect } from '@playwright/test';

test('تست بصری صفحه تماس با ما', async ({ page }) => {
  // ۱. برو به صفحه تماس با ما
  await page.goto('http://localhost:5173/contact');
  
  // ۲. صبر کن تا صفحه کامل لود بشه
  await page.waitForLoadState('networkidle');
  
  // ۳. از کل صفحه عکس بگیر و با نسخه قبلی مقایسه کن
  await expect(page).toHaveScreenshot('contact.png');
});