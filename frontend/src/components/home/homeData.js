// src/components/home/homeData.js

export const testimonials = [
  {
    id: 1,
    name: 'علی محمدی',
    date: '۱۴۰۳/۰۴/۱۵',
    rating: 5,
    comment: 'کیفیت محصولات فروشگاه واقعاً عالی بود. خریدم کاملاً رضایت‌بخش بود و ارسال سریع و بسته‌بندی حرفه‌ای داشتند.',
    product: 'لپ‌تاپ ایسوس'
  },
  {
    id: 2,
    name: 'سارا کریمی',
    date: '۱۴۰۳/۰۴/۱۲',
    rating: 4,
    comment: 'از خرید مبل چوبی راضی هستم، فقط رنگش کمی با عکس فرق داشت ولی کیفیت خوبه.',
    product: 'ست مبلمان پذیرایی'
  },
  {
    id: 3,
    name: 'رضا احمدی',
    date: '۱۴۰۳/۰۴/۱۰',
    rating: 5,
    comment: 'خیلی سریع تحویل گرفتند، قیمت‌ها منصفانه و کالاها اصل هستند. حتماً دوباره خرید می‌کنم.',
    product: 'یخچال ساید بای ساید'
  }
];

// ✅ فقط ۴ محصول چوبی خاص با idهای واقعی
export const woodFurnitureProducts = [
  {
    id: 20,
    product_id: 20,
    name: 'میز ناهارخوری چوبی',
    description: 'میز با طراحی مدرن و جنس چوب گردو با کیفیت بالا، مناسب برای ۶ نفر.',
    price: 8750000,
    image_url: '/uploads/image-1783543910525-401921751.jpg',
    slug: 'میز-ناهارخوری-چوبی',
    type: 'wood'
  },
  {
    id: 21,
    product_id: 21,
    name: 'تخت خواب چوبی دو نفره',
    description: 'تخت خواب با طراحی مینیمال و جنس چوب راش، مقاوم و با دوام بالا.',
    price: 18750000,
    image_url: '/uploads/image-1783543980687-418131609.jpg',
    slug: 'تخت-خواب-چوبی-دو-نفره',
    type: 'wood'
  },
  {
    id: 22,
    product_id: 22,
    name: 'قفسه کتاب چوبی',
    description: 'قفسه کتاب با ۵ طبقه و جنس چوب گردو، مناسب برای دکوراسیون منزل و محل کار.',
    price: 4200000,
    image_url: '/uploads/image-1783544070212-144446988.jpg',
    slug: 'قفسه-کتاب-چوبی',
    type: 'wood'
  },
  {
    id: 23,
    product_id: 23,
    name: 'ست مبلمان پذیرایی',
    description: 'ست مبلمان شامل مبل ۳ نفره و ۲ صندلی با پایه‌های چوبی و رویه پارچه‌ای با کیفیت بالا.',
    price: 25000000,
    image_url: '/uploads/image-1783544199024-193543135.webp',
    slug: 'ست-مبلمان-پذیرایی',
    type: 'wood'
  }
];

export const defaultDiscounts = [
  {
    id: 1,
    name: 'تخفیف ویژه لپ‌تاپ',
    price: 20000000,
    original_price: 25000000,
    discount_percent: 20,
    image_url: '/uploads/discount-laptop.jpg',
    end_time: Date.now() + 7 * 24 * 60 * 60 * 1000,
    rating: 4.5,
    totalReviews: 12
  },
  {
    id: 2,
    name: 'تخفیف ویژه یخچال',
    price: 18000000,
    original_price: 25000000,
    discount_percent: 28,
    image_url: '/uploads/discount-fridge.jpg',
    end_time: Date.now() + 3 * 24 * 60 * 60 * 1000,
    rating: 4.8,
    totalReviews: 8
  }
];

export const categories = {
  'موبایل': { label: 'موبایل', keywords: [] },
  'نورپردازی': { label: 'نورپردازی', keywords: ['نور', 'چراغ', 'لامپ', 'لوستر'] },
  'ساعت': { label: 'ساعت', keywords: ['ساعت', 'زمان'] },
  'دکوراسیون': { label: 'دکوراسیون', keywords: ['دکور', 'تزئین', 'دکوری', 'آویز'] },
  'میز و صندلی': { label: 'میز و صندلی', keywords: ['میز', 'صندلی', 'نیمکت'] },
  'ویژه': { label: 'ویژه', keywords: ['ویژه', 'تخفیف', 'پیشنهاد', 'شگفت‌انگیز'] },
};