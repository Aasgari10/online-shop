// src/components/home/MobileHomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
import MobileHeroSection from './MobileHeroSection';
import MobileProductHorizontalList from './MobileProductHorizontalList';
import MobileBanner from './MobileBanner';
import MobileDiscountCarousel from './MobileDiscountCarousel';
import MobileTestimonials from './MobileTestimonials';
import MobileFeaturedProducts from './MobileFeaturedProducts';
import { woodFurnitureProducts } from './homeData';
import toast from 'react-hot-toast';

const WOOD_PRODUCT_IDS = [20, 21, 22, 23];

function MobileHomePage() {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [heroData, setHeroData] = useState({
    mainTitle: 'خانه‌ای زیباتر با ما',
    subtitle: 'لوازم خانگی مدرن',
    description: 'دکوری شیک و کاردبردی',
    imageUrl: '/assets/phone-Djre6sB6.png'
  });

  const [pageSettings, setPageSettings] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [mobileProducts, setMobileProducts] = useState([]);
  const [electronicProducts, setElectronicProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [doubleBanners, setDoubleBanners] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [woodItems, setWoodItems] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      setIsLoggedIn(!!user);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    console.log('🔍 [MobileHomePage] شروع fetchAllData...');

    try {
      const [
        heroRes,
        allProductsRes,
        mobileRes,
        electronicRes,
        bestRes,
        featuredRes,
        bannersRes,
        testimonialsRes,
      ] = await Promise.all([
        api.get('/pages/home').catch(() => ({ data: { success: true, data: { content_json: {} } } })),
        api.get('/products?limit=100&sort=popular').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/products?category=موبایل&limit=10').catch(() => api.get('/products?limit=10')),
        api.get('/products?category=برقی&limit=10').catch(() => api.get('/products?limit=10')),
        api.get('/products?sort=popular&limit=5').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/featured').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/banners/double').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/testimonials').catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (heroRes.data.success) {
        const content = heroRes.data.data.content_json || {};
        setHeroData(prev => ({
          ...prev,
          ...content,
          imageUrl: content.imageUrl || prev.imageUrl
        }));
        setPageSettings(heroRes.data.data);
      }

      if (allProductsRes.data.success) {
        setAllProducts(allProductsRes.data.data || []);
      }

      if (mobileRes.data.success) setMobileProducts(mobileRes.data.data || []);
      else setMobileProducts([]);
      if (electronicRes.data.success) setElectronicProducts(electronicRes.data.data || []);
      else setElectronicProducts([]);
      if (bestRes.data.success) setBestSellers(bestRes.data.data || []);
      else setBestSellers([]);
      if (featuredRes.data.success) setFeaturedProducts(featuredRes.data.data || []);
      else setFeaturedProducts([]);
      if (bannersRes.data.success) setDoubleBanners(bannersRes.data.data || []);
      else setDoubleBanners([]);
      if (testimonialsRes.data.success) setTestimonials(testimonialsRes.data.data || []);
      else setTestimonials([]);

    } catch (err) {
      console.error('❌ [MobileHomePage] خطا در دریافت داده‌ها:', err);
      setError('خطا در دریافت اطلاعات صفحه');
      toast.error('خطا در دریافت اطلاعات، لطفاً صفحه را رفرش کنید');
    } finally {
      console.log('🔍 [MobileHomePage] fetchAllData تمام شد، loading = false');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      const found = allProducts.filter(p => WOOD_PRODUCT_IDS.includes(p.id));

      if (found.length > 0) {
        setWoodItems(found.map(p => ({
          ...p,
          product_id: p.id,
          type: 'wood',
        })));
      } else {
        setWoodItems(woodFurnitureProducts);
      }
    }
  }, [loading, allProducts]);

  useEffect(() => {
    const discountItems = featuredProducts.filter(f => f.type === 'discount');
    const initialTime = {};
    discountItems.forEach((item) => {
      const id = item.id || item.featured_id || item.product_id;
      initialTime[id] = calculateTimeLeft(item.end_time);
    });
    setTimeLeft(initialTime);

    const timer = setInterval(() => {
      const newTime = {};
      discountItems.forEach((item) => {
        const id = item.id || item.featured_id || item.product_id;
        newTime[id] = calculateTimeLeft(item.end_time);
      });
      setTimeLeft(newTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [featuredProducts]);

  useEffect(() => {
    const discountItems = featuredProducts.filter(f => f.type === 'discount');
    if (discountItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % discountItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredProducts]);

  useEffect(() => {
    fetchAllData();
  }, [location.key, fetchAllData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchAllData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchAllData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAllData]);

  const calculateTimeLeft = (endTime) => {
    if (!endTime) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    let endTimeMs = typeof endTime === 'string' ? parseInt(endTime) : endTime;
    if (isNaN(endTimeMs) || endTimeMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = endTimeMs - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    return [...Array(5)].map((_, i) => (
      <svg key={i} className={`w-5 h-5 ${i < fullStars ? 'text-yellow-500 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ));
  };

  // ✅ H1 مخفی برای SEO
  const seoH1 = (
    <h1 className="sr-only">
      {heroData?.mainTitle || 'خانه‌ای زیباتر با ما'} | فروشگاه اینترنتی HomeMart
    </h1>
  );

  if (error) {
    return (
      <>
        {seoH1}
        <div className="min-h-screen bg-[#E8DCC8] flex flex-col items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">خطا در دریافت اطلاعات</h2>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button onClick={fetchAllData} className="bg-[#800E2F] hover:bg-[#6B0A26] text-white px-6 py-2 rounded-xl font-medium transition">🔄 تلاش مجدد</button>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        {seoH1}
        <Spinner />
      </>
    );
  }

  const firstBanner = doubleBanners.length > 0 ? doubleBanners[0] : null;
  const secondBanner = doubleBanners.length > 1 ? doubleBanners[1] : null;

  const discountItems = featuredProducts.filter(f => f.type === 'discount');

  return (
    <>
      {seoH1}
      <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#E8DCC8' }}>
        <MobileHeroSection data={heroData} />

        <MobileProductHorizontalList title="موبایل‌ها" products={mobileProducts} discountLookup={{}} />
        {firstBanner && <MobileBanner imageUrl={firstBanner.image_url} link={firstBanner.link} title={firstBanner.title} />}
        <MobileProductHorizontalList title="پرفروش‌ها" products={bestSellers} discountLookup={{}} />

        {discountItems.length > 0 && (
          <MobileDiscountCarousel
            items={discountItems}
            timeLeft={timeLeft}
            currentSlide={currentSlide}
            onSlideChange={setCurrentSlide}
            renderStars={renderStars}
          />
        )}

        {secondBanner && <MobileBanner imageUrl={secondBanner.image_url} link={secondBanner.link} title={secondBanner.title} />}
        <MobileProductHorizontalList title="برقی‌ها" products={electronicProducts} discountLookup={{}} icon="electric" />
        <MobileTestimonials testimonials={testimonials} />
        <MobileFeaturedProducts items={woodItems} />
      </div>
    </>
  );
}

export default MobileHomePage;