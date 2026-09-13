// src/components/home/HomePage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
import toast from 'react-hot-toast';
import { calculateTimeLeft } from '../../utils/dateUtils';

import HeroSection from './HeroSection';
import CategoryFilter from './CategoryFilter';
import ProductGrid from './ProductGrid';
import DiscountCarousel from './DiscountCarousel';
import BannerSection from './BannerSection';
import DoubleBanner from './DoubleBanner';
import FeaturedProducts from './FeaturedProducts';
import Testimonials from './Testimonials';

import { testimonials as defaultTestimonials, woodFurnitureProducts } from './homeData';

const WOOD_PRODUCT_IDS = [20, 21, 22, 23];

function HomePage() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('همه');
  const [categories, setCategories] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState([]);
  const [doubleBanners, setDoubleBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});
  const [testimonials, setTestimonials] = useState([]);
  const [heroData, setHeroData] = useState(null);
  const [pageSettings, setPageSettings] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const parsed = user ? JSON.parse(user) : null;
      setUserData(parsed);
      setIsAdmin(parsed?.role === 'admin');
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const heroRes = await api.get('/pages/home');
        if (heroRes.data.success) {
          setHeroData(heroRes.data.data.content_json || {});
          setPageSettings(heroRes.data.data);
        }

        const productsRes = await api.get('/products?limit=100&sort=popular');
        if (productsRes.data.success) {
          setAllProducts(productsRes.data.data);
        }

        const catRes = await api.get('/categories');
        if (catRes.data.success) {
          const rawData = catRes.data.data;
          const filteredData = rawData.filter(c => c.name !== 'دسته');
          const cats = filteredData.map(c => ({
            id: c.id.toString(),
            label: c.name,
          }));
          setCategories([{ id: 'همه', label: 'همه' }, ...cats]);
        }

        const featuredRes = await api.get('/featured');
        if (featuredRes.data.success) {
          setFeaturedProducts(featuredRes.data.data);
        }

        const bannersRes = await api.get('/banners/double');
        if (bannersRes.data.success) {
          setDoubleBanners(bannersRes.data.data);
        }
        const regularBannersRes = await api.get('/banners');
        if (regularBannersRes.data.success) {
          setBanners(regularBannersRes.data.data.filter(b => b.is_active !== false));
        }

        const testimonialsRes = await api.get('/testimonials');
        if (testimonialsRes.data.success) {
          setTestimonials(testimonialsRes.data.data);
        } else {
          setTestimonials(defaultTestimonials);
        }
      } catch (err) {
        console.error('❌ [HomePage] خطا:', err);
        setError('خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const woodItems = useMemo(() => {
    const found = allProducts.filter(p => WOOD_PRODUCT_IDS.includes(p.id));
    
    if (found.length > 0) {
      return found.map(p => ({
        ...p,
        product_id: p.id,
        type: 'wood',
      }));
    }
    
    return woodFurnitureProducts;
  }, [allProducts]);

  const discountItems = useMemo(() => {
    return featuredProducts.filter(f => f.type === 'discount');
  }, [featuredProducts]);

  useEffect(() => {
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
  }, [discountItems]);

  useEffect(() => {
    if (discountItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % discountItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [discountItems]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === 'همه') return allProducts;
    return allProducts.filter(p => p.category_id === parseInt(selectedCategoryId));
  }, [allProducts, selectedCategoryId]);

  const displayedProducts = useMemo(() => filteredProducts.slice(0, 5), [filteredProducts]);

  const discountLookup = useMemo(() => {
    const map = {};
    featuredProducts
      .filter(f => f.type === 'discount')
      .forEach(f => {
        map[f.product_id] = {
          original_price: f.original_price || f.price,
          discount_percent: f.discount_percent || 0,
          is_discount: true,
        };
      });
    return map;
  }, [featuredProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`آیا از حذف محصول "${name}" مطمئن هستید؟`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('محصول با موفقیت حذف شد');
      setAllProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      toast.error('خطا در حذف محصول');
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    return [...Array(5)].map((_, i) => (
      <svg key={i} className={`w-5 h-5 ${i < fullStars ? 'text-yellow-500 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ));
  };

  const getPrimaryBanner = () => {
    const activeBanners = banners.filter(b => b.is_active !== false);
    let primary = activeBanners.find(b => b.position === 'home-main' || b.position === 'home');
    if (!primary) primary = activeBanners.find(b => b.position !== 'double');
    return primary || null;
  };

  const primaryBanner = getPrimaryBanner();

  const getImageUrl = (banner) => {
    if (!banner?.image_url) return null;
    if (banner.image_url.startsWith('http')) return banner.image_url;
    return `${banner.image_url}`;
  };

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

  // ✅ H1 مخفی برای SEO (بدون تغییر ظاهر)
  const seoH1 = (
    <h1 className="sr-only">
      {heroData?.mainTitle || 'خانه‌ای زیباتر با ما'} | فروشگاه اینترنتی HomeMart
    </h1>
  );

  if (loading) {
    return (
      <>
        {seoH1}
        <Spinner />
      </>
    );
  }

  if (error) {
    return (
      <>
        {seoH1}
        <div className="text-center py-10 text-red-500">{error}</div>
      </>
    );
  }

  return (
    <>
      {seoH1}
      <div className="min-h-screen" style={{ backgroundColor: '#E8DCC8' }}>
        <HeroSection data={heroData} />

        {allProducts.length > 0 && (
          <div className="w-full pt-4 pb-8" style={{ backgroundColor: '#fefcf9e5' }}>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 relative inline-block">
                  پرفروش‌ترین محصولات
                  <span className="absolute -bottom-3 right-0 w-full h-0.5 rounded-full" style={{ backgroundColor: '#b3808a' }}></span>
                </h2>
                <p className="text-gray-400 text-xs mt-3">محصولات محبوب و پرطرفدار</p>
              </div>

              <CategoryFilter
                categories={categories}
                selected={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />

              <ProductGrid
                products={displayedProducts}
                discountLookup={discountLookup}
                isAdmin={isAdmin}
                onEdit={(id) => navigate(`/admin/products/edit/${id}`)}
                onDelete={handleDelete}
                showAddToCart={false}
                emptyMessage="محصولی برای این دسته یافت نشد"
              />
            </div>
          </div>
        )}

        {primaryBanner && getImageUrl(primaryBanner) && (
          <BannerSection
            imageUrl={getImageUrl(primaryBanner)}
            link={primaryBanner.link}
            title={primaryBanner.title}
          />
        )}

        <DiscountCarousel
          key={discountItems.length}
          items={discountItems}
          timeLeft={timeLeft}
          currentSlide={currentSlide}
          onSlideChange={setCurrentSlide}
          renderStars={renderStars}
        />

        {doubleBanners.length >= 2 && (
          <div className="mt-0">
            <DoubleBanner banners={doubleBanners} />
          </div>
        )}

        <Testimonials testimonials={displayTestimonials} />
        
        <FeaturedProducts items={woodItems} />
      </div>
    </>
  );
}

export default HomePage;