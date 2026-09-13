// src/components/shared/PageHeader.jsx
import React from 'react';

/**
 * کامپوننت هدر استاندارد برای صفحات پنل مدیریت و سایر صفحات
 * @param {string} title - عنوان اصلی
 * @param {string} subtitle - توضیحات زیر عنوان (اختیاری)
 * @param {string} className - کلاس‌های اضافی (اختیاری)
 */
function PageHeader({ title, subtitle, className = '' }) {
  return (
    <div className={`text-center mb-0 ${className}`}>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 relative inline-block pb-3">
        {title}
        <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F] shadow-md shadow-[#800E2F]/30"></span>
      </h1>
      {subtitle && (
        <p className="text-gray-500 mt-0.5 text-sm md:text-base">{subtitle}</p>
      )}
    </div>
  );
}

export default PageHeader;