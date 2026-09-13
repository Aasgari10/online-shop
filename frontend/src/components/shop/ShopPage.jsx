// src/components/shop/ShopPage.jsx
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import WishlistButton from '../wishlist/WishlistButton';

function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 24, totalPages: 0 });
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      setIsLoggedIn(!!userData);
    }
  }, []);

  const searchInputRef = useRef(null);
  const filterWrapperRef = useRef(null);
  const filterCardRef = useRef(null);

  const [headerHeight, setHeaderHeight] = useState(80);
  const [filterTop, setFilterTop] = useState(86);
  const [filterHeight, setFilterHeight] = useState(400);
  const [filterWidth, setFilterWidth] = useState(340);

  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const scrollPercentRef = useRef(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const prevFilterTopRef = useRef(filterTop);

  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const lockedFilterTopRef = useRef(filterTop);

  const searchFromUrl = searchParams.get('search') || '';
  const discountFromUrl = searchParams.get('discount') === 'true';

  const [filters, setFilters] = useState({
    search: searchFromUrl,
    category: searchParams.get('category') || 'همه',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'popular',
    page: parseInt(searchParams.get('page')) || 1,
    minRating: searchParams.get('minRating') || '',
  });

  useEffect(() => {
    setShowDiscountOnly(discountFromUrl);
  }, [discountFromUrl]);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handleSearchUpdate = (event) => {
      const { search } = event.detail;
      setFilters((prev) => ({ ...prev, search, page: 1 }));
    };
    window.addEventListener('search-update', handleSearchUpdate);
    return () => window.removeEventListener('search-update', handleSearchUpdate);
  }, []);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: searchFromUrl }));
  }, [searchFromUrl]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories', { timeout: 10000 });
      if (res.data.success) {
        const cats = res.data.data.map((c) => ({ key: c.id.toString(), label: c.name }));
        setCategories([{ key: 'همه', label: 'همه' }, ...cats]);
      }
    } catch (error) {
      console.error('❌ [ShopPage] خطا در دریافت دسته‌بندی‌ها:', error);
      setCategories([
        { key: 'همه', label: 'همه' },
        { key: '1', label: 'لوازم خانگی' },
        { key: '2', label: 'آشپزخانه' },
        { key: '3', label: 'تزئینی' },
        { key: '4', label: 'برقی' },
        { key: '5', label: 'خواب' },
      ]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/featured');
        if (res.data.success) setFeaturedProducts(res.data.data);
      } catch (error) {
        console.error('❌ [ShopPage] خطا در دریافت محصولات ویژه:', error);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category && filters.category !== 'همه') params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.minRating) params.append('minRating', filters.minRating);
        if (showDiscountOnly) params.append('showDiscounted', 'true');
        params.append('page', filters.page);
        params.append('limit', 24);

        const res = await api.get(`/products?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
          timeout: 15000,
        });
        if (res.data.success) {
          setAllProducts(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        setError('خطا در دریافت محصولات');
        console.error('❌ [ShopPage] خطا:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, showDiscountOnly]);

  useEffect(() => {
    const updateMeasurements = () => {
      const headerEl = document.querySelector('nav') || document.querySelector('header');
      const headerHeightValue = headerEl ? headerEl.getBoundingClientRect().height : 80;
      setHeaderHeight(headerHeightValue);
      const initialFilterTop = headerHeightValue + 8;
      setFilterTop(initialFilterTop);
      prevFilterTopRef.current = initialFilterTop;
      lockedFilterTopRef.current = initialFilterTop;
      if (filterCardRef.current) {
        const h = filterCardRef.current.offsetHeight;
        if (h > 0) setFilterHeight(h);
      }
      if (filterWrapperRef.current) {
        const rect = filterWrapperRef.current.getBoundingClientRect();
        setFilterWidth(rect.width > 340 ? rect.width : 340);
      }
    };
    updateMeasurements();
    window.addEventListener('resize', updateMeasurements);
    setTimeout(updateMeasurements, 500);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, []);

  const animationFrameRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const maxScroll = documentHeight - windowHeight;
      const percent = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
      const roundedPercent = Math.round(percent);
      if (roundedPercent !== scrollPercentRef.current) {
        scrollPercentRef.current = roundedPercent;
        setScrollPercent(roundedPercent);
      }
      if (roundedPercent >= 86.5) {
        if (isFilterVisible) setIsFilterVisible(false);
      } else {
        if (!isFilterVisible) setIsFilterVisible(true);
      }
    });
  }, [isFilterVisible]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleScroll]);

  const discountLookup = useMemo(() => {
    const map = {};
    featuredProducts
      .filter((f) => f.type === 'discount')
      .forEach((f) => {
        map[f.product_id] = {
          original_price: f.original_price || f.price,
          discount_percent: f.discount_percent || 0,
          is_discount: true,
        };
      });
    return map;
  }, [featuredProducts]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return (
          <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-4 h-4">
            <svg className="absolute top-0 right-0 w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <svg className="absolute top-0 right-0 w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
        );
      } else {
        return (
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    });
  };

  const updateFilters = (newFilters) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    const params = new URLSearchParams();
    if (updated.search) params.append('search', updated.search);
    if (updated.category && updated.category !== 'همه') params.append('category', updated.category);
    if (updated.minPrice) params.append('minPrice', updated.minPrice);
    if (updated.maxPrice) params.append('maxPrice', updated.maxPrice);
    if (updated.sort) params.append('sort', updated.sort);
    if (updated.minRating) params.append('minRating', updated.minRating);
    if (updated.page > 1) params.append('page', updated.page);
    const discountValue = newFilters.showDiscounted !== undefined ? newFilters.showDiscounted : showDiscountOnly;
    if (discountValue) params.append('discount', 'true');
    setSearchParams(params, { replace: true });
  };

  const clearAllFilters = () => {
    if (searchInputRef.current) searchInputRef.current.value = '';
    setShowDiscountOnly(false);
    updateFilters({
      search: '',
      category: 'همه',
      minPrice: '',
      maxPrice: '',
      sort: 'popular',
      page: 1,
      minRating: '',
      showDiscounted: false,
    });
  };

  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  const FILTER_RIGHT_MARGIN = 16;
  const desktopMarginRight = isDesktop ? filterWidth + FILTER_RIGHT_MARGIN + 8 : 0;

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div
            className="flex-1 order-1 lg:order-2"
            style={{
              marginRight: desktopMarginRight > 0 ? `${desktopMarginRight}px` : '0',
              paddingTop: '0',
            }}
          >
            {loading ? (
              <div className="flex justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : allProducts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-16 text-center border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-700">محصولی یافت نشد</h3>
                <p className="text-gray-500 mt-2">فیلترهای خود را تغییر دهید یا جستجوی دیگری انجام دهید.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
                  {allProducts.map((product) => {
                    const discountInfo = discountLookup[product.id];
                    const productLink = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
                    
                    const displayPrice = product.display_price || product.price || 0;
                    const originalPrice = product.original_price || null;
                    const discountPercent = product.discount_percent || 0;
                    const cheapestStock = product.cheapest_variation?.stock || product.stock || 0;

                    return (
                      <div
                        key={product.id}
                        className="relative group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 flex flex-col h-full"
                      >
                        <div className="absolute top-2 left-2 z-10">
                          <WishlistButton product={product} />
                        </div>

                        <Link to={productLink} className="block flex-1 flex flex-col">
                          <div className="relative bg-gray-50 overflow-hidden aspect-[4/3]">
                            <img
                              src={product.image_url ? `${product.image_url}` : '/fallback-image.jpg'}
                              alt={product.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.src = '/fallback-image.jpg';
                              }}
                            />
                            {discountPercent > 0 && (
                              <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                {discountPercent}٪ تخفیف
                              </span>
                            )}
                            {displayPrice === 0 && (
                              <span className="absolute bottom-2 right-2 bg-yellow-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                بدون قیمت
                              </span>
                            )}
                          </div>

                          <div className="p-3 text-right flex-1 flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#800E2F] transition">
                              {product.name}
                            </h3>
                            <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                              {product.description || '—————————'}
                            </p>

                            <div className="flex items-center justify-end gap-0.5 mt-1">
                              {renderStars(product.averageRating || 0)}
                              {product.totalReviews > 0 && (
                                <span className="text-[9px] text-gray-400 mr-1">({product.totalReviews})</span>
                              )}
                            </div>

                            <div className="mt-auto pt-2 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                  موجودی: {cheapestStock || 0}
                                </span>
                                <div className="flex flex-col items-end">
                                  {discountPercent > 0 && originalPrice && (
                                    <span className="text-[9px] text-gray-400 line-through">
                                      {formatPrice(originalPrice)} ت
                                    </span>
                                  )}
                                  <span className="text-sm font-bold text-[#800E2F]">{formatPrice(displayPrice)} ت</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                      onClick={() => updateFilters({ page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      قبلی
                    </button>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => updateFilters({ page: i + 1 })}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                          pagination.page === i + 1
                            ? 'bg-[#800E2F] text-white border-[#800E2F] shadow-sm'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => updateFilters({ page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* فیلترها (دسکتاپ) */}
          <div
            ref={filterWrapperRef}
            className="hidden mt-1 lg:block fixed top-0 z-20"
            style={{
              top: `${filterTop}px`,
              width: `${filterWidth}px`,
              right: `${FILTER_RIGHT_MARGIN}px`,
              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isFilterVisible ? 1 : 0,
              transform: isFilterVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
              pointerEvents: isFilterVisible ? 'auto' : 'none',
            }}
          >
            <div
              ref={filterCardRef}
              className="bg-white rounded-2xl shadow-lg p-3 border border-gray-100"
              style={{ width: '100%', maxHeight: 'none' }}
            >
              <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#800E2F] rounded-full"></span>
                فیلترها
              </h4>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">مرتب‌سازی</label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50 appearance-none"
                >
                  <option value="popular">پرفروش‌ترین</option>
                  <option value="newest">جدیدترین</option>
                  <option value="price_asc">ارزان‌ترین</option>
                  <option value="price_desc">گران‌ترین</option>
                  <option value="rating">بالاترین امتیاز</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">جستجو</label>
                <input
                  ref={searchInputRef}
                  type="text"
                  defaultValue={filters.search}
                  placeholder="نام محصول..."
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateFilters({ search: e.target.value, page: 1 });
                    }
                  }}
                />
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">دسته‌بندی</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilters({ category: e.target.value, page: 1 })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                >
                  {categories.map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">محدوده قیمت</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="از"
                    value={filters.minPrice}
                    onChange={(e) => updateFilters({ minPrice: e.target.value, page: 1 })}
                    className="w-1/2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                  />
                  <input
                    type="number"
                    placeholder="تا"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilters({ maxPrice: e.target.value, page: 1 })}
                    className="w-1/2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">حداقل امتیاز</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => updateFilters({ minRating: e.target.value, page: 1 })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                >
                  <option value="">همه</option>
                  <option value="4">۴+</option>
                  <option value="3">۳+</option>
                  <option value="2">۲+</option>
                </select>
              </div>

              <div className="mb-2 flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="discountCheckbox"
                  checked={showDiscountOnly}
                  onChange={(e) => {
                    setShowDiscountOnly(e.target.checked);
                    updateFilters({ page: 1, showDiscounted: e.target.checked });
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                <label htmlFor="discountCheckbox" className="text-xs font-medium text-gray-700 cursor-pointer">
                  🔥 فقط تخفیف‌دارها
                </label>
              </div>

              <button
                onClick={clearAllFilters}
                className="w-full mt-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                حذف همه فیلترها
              </button>
            </div>
          </div>

          {/* فیلترها (موبایل) */}
          <div className="lg:hidden order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-md p-3 border border-gray-100">
              <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#800E2F] rounded-full"></span>
                فیلترها
              </h4>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">مرتب‌سازی</label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50 appearance-none"
                >
                  <option value="popular">پرفروش‌ترین</option>
                  <option value="newest">جدیدترین</option>
                  <option value="price_asc">ارزان‌ترین</option>
                  <option value="price_desc">گران‌ترین</option>
                  <option value="rating">بالاترین امتیاز</option>
                </select>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">جستجو</label>
                <input
                  ref={searchInputRef}
                  type="text"
                  defaultValue={filters.search}
                  placeholder="نام محصول..."
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateFilters({ search: e.target.value, page: 1 });
                    }
                  }}
                />
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">دسته‌بندی</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilters({ category: e.target.value, page: 1 })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                >
                  {categories.map((cat) => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">محدوده قیمت</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="از"
                    value={filters.minPrice}
                    onChange={(e) => updateFilters({ minPrice: e.target.value, page: 1 })}
                    className="w-1/2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                  />
                  <input
                    type="number"
                    placeholder="تا"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilters({ maxPrice: e.target.value, page: 1 })}
                    className="w-1/2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">حداقل امتیاز</label>
                <select
                  value={filters.minRating}
                  onChange={(e) => updateFilters({ minRating: e.target.value, page: 1 })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent transition bg-gray-50"
                >
                  <option value="">همه</option>
                  <option value="4">۴+</option>
                  <option value="3">۳+</option>
                  <option value="2">۲+</option>
                </select>
              </div>

              <div className="mb-2 flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="discountCheckboxMobile"
                  checked={showDiscountOnly}
                  onChange={(e) => {
                    setShowDiscountOnly(e.target.checked);
                    updateFilters({ page: 1, showDiscounted: e.target.checked });
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                />
                <label htmlFor="discountCheckboxMobile" className="text-xs font-medium text-gray-700 cursor-pointer">
                  🔥 فقط تخفیف‌دارها
                </label>
              </div>

              <button
                onClick={clearAllFilters}
                className="w-full mt-1 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                حذف همه فیلترها
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopPage;