#!/bin/bash
# frontend/build.sh

echo "🔨 شروع بیلد پروژه..."

# ۱. بیلد کلاینت (فایل‌های static معمولی)
echo "📦 بیلد کلاینت..."
npm run build:client

# ۲. بیلد سرور (برای SSR)
echo "🖥️ بیلد سرور..."
npm run build:ssr

# ۳. کپی فایل‌های static به پوشه مناسب (در صورت نیاز)
echo "✅ بیلد کامل شد!"

# نمایش مسیر خروجی
echo "📂 خروجی کلاینت: ./dist"
echo "📂 خروجی سرور: ./dist/server.js"