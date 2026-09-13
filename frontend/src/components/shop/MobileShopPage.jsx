// src/components/shop/MobileShopPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';

function MobileShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      setIsLoggedIn(!!userData);
    }
  }, []);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'همه',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'popular',
    page: parseInt(searchParams.get('page')) || 1,
    minRating: searchParams.get('minRating') || '',
    showDiscounted: searchParams.get('discount') === 'true',
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sidebarRef = useRef(null);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return (
          <svg key={i} className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-3.5 h-3.5">
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <svg className="absolute top-0 right-0 w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
        );
      } else {
        return (
          <svg key={i} className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          const cats = res.data.data.map((c) => ({ key: c.id.toString(), label: c.name }));
          setCategories([{ key: 'همه', label: 'همه' }, ...cats]);
        } else {
          setCategories([
            { key: 'همه', label: 'همه' },
            { key: '1', label: 'لوازم خانگی' },
            { key: '2', label: 'آشپزخانه' },
            { key: '3', label: 'تزئینی' },
            { key: '4', label: 'برقی' },
            { key: '5', label: 'خواب' },
          ]);
        }
      } catch (error) {
        console.error('❌ [MobileShopPage] خطا در دریافت دسته‌بندی‌ها:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/featured');
        if (res.data.success) setFeaturedProducts(res.data.data);
      } catch (error) {
        console.error('❌ [MobileShopPage] خطا در دریافت محصولات ویژه:', error);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category && filters.category !== 'همه') params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.minRating) params.append('minRating', filters.minRating);
        if (filters.showDiscounted) params.append('showDiscounted', 'true');
        params.append('page', filters.page);
        params.append('limit', 20);

        const res = await api.get(`/products?${params.toString()}`);
        if (res.data.success) {
          setProducts(res.data.data);
          setPagination(res.data.pagination);
        }
      } catch (err) {
        setError('خطا در دریافت محصولات');
        console.error('❌ [MobileShopPage] خطا:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

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
    if (updated.showDiscounted) params.append('discount', 'true');
    if (updated.page > 1) params.append('page', updated.page);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  const discountLookup = {};
  featuredProducts
    .filter((f) => f.type === 'discount')
    .forEach((f) => {
      discountLookup[f.product_id] = {
        original_price: f.original_price_display || f.original_price || f.price,
        discount_percent: f.discount_percent || 0,
        is_discount: true,
        display_price: f.display_price || f.price,
      };
    });

  return (
    <div className="min-h-screen bg-[#E8DCC8] pt-1">
      <div className="sticky top-0 z-20 bg-[#E8DCC8] px-1 pt-1 pb-2 flex items-center gap-2">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition flex-shrink-0"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value, page: 1 })}
            placeholder="جستجوی محصول..."
            className="w-full px-3 py-2.5 pr-8 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setIsFilterOpen(false)} />
        <div
          ref={sidebarRef}
          className={`absolute top-0 right-0 w-4/5 max-w-sm h-full bg-white shadow-2xl transition-transform duration-300 transform ${
            isFilterOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          dir="rtl"
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">فیلترها</h3>
            <button onClick={() => setIsFilterOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 overflow-y-auto h-[calc(100%-72px)] space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">مرتب‌سازی</label>
              <select
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value, page: 1 })}
                className="w-full px-3 pl-8 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white appearance-none bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'left 0.75rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="popular">پرفروش‌ترین</option>
                <option value="newest">جدیدترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="rating">بالاترین امتیاز</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">دسته‌بندی</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilters({ category: e.target.value, page: 1 })}
                className="w-full px-3 pl-8 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white appearance-none bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'left 0.75rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">محدوده قیمت</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="از"
                  value={filters.minPrice}
                  onChange={(e) => updateFilters({ minPrice: e.target.value, page: 1 })}
                  className="w-1/2 px-3 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
                />
                <input
                  type="number"
                  placeholder="تا"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilters({ maxPrice: e.target.value, page: 1 })}
                  className="w-1/2 px-3 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">حداقل امتیاز</label>
              <select
                value={filters.minRating}
                onChange={(e) => updateFilters({ minRating: e.target.value, page: 1 })}
                className="w-full px-3 pl-8 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white appearance-none bg-no-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'left 0.75rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="">همه</option>
                <option value="4">۴+</option>
                <option value="3">۳+</option>
                <option value="2">۲+</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="discountCheckbox"
                checked={filters.showDiscounted}
                onChange={(e) => updateFilters({ showDiscounted: e.target.checked, page: 1 })}
                className="w-5 h-5 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
              />
              <label htmlFor="discountCheckbox" className="text-base font-medium text-gray-700">
                فقط تخفیف‌دارها
              </label>
            </div>

            <button
              onClick={() => {
                setFilters({
                  search: '',
                  category: 'همه',
                  minPrice: '',
                  maxPrice: '',
                  sort: 'popular',
                  page: 1,
                  minRating: '',
                  showDiscounted: false,
                });
                setSearchParams({});
                setIsFilterOpen(false);
              }}
              className="w-full py-2.5 text-base font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
            >
              حذف همه فیلترها
            </button>
          </div>
        </div>
      </div>

      <div className="px-1 pb-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
            <p className="text-gray-500 text-base">محصولی یافت نشد</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {products.map((product) => {
                const productLink = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
                const liked = isInWishlist(product.id);
                
                const rating = product.averageRating || 0;
                const displayPrice = product.display_price || product.price || 0;
                const originalPrice = product.original_price || null;
                const discountPercent = product.discount_percent || 0;
                const displayStock = product.cheapest_variation?.stock || product.stock || 0;

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border border-gray-100/80 group flex flex-row items-stretch h-[130px] relative"
                  >
                    <Link to={productLink} className="flex-1 flex flex-row items-stretch h-full">
                      <div className="flex-shrink-0 w-[130px] h-[130px] bg-gray-50 overflow-hidden relative">
                        <img
                          src={product.image_url ? `${product.image_url}` : null}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                          onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
                        />
                        {discountPercent > 0 && (
                          <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                            {discountPercent}٪
                          </span>
                        )}
                        {displayPrice === 0 && (
                          <span className="absolute bottom-1 right-1 bg-yellow-600/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                            بدون قیمت
                          </span>
                        )}
                      </div>

                      <div className="flex-1 p-2 pr-3 text-right flex flex-col h-full min-h-0">
                        <div className="flex-1 min-h-0">
                          <h3 className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-[#800E2F] transition">
                            {product.name}
                          </h3>
                          <div className="min-h-[32px]">
                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-normal">
                              {product.description || '—————————'}
                            </p>
                          </div>
                          <p className="text-[11px] font-serif text-right pt-1.5 italic tracking-wider text-gray-400/60 mt-0 leading-none">
                            هوم مارت
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-between -mb-1">
                            <div className="flex items-center justify-end gap-0.5">
                              {renderStars(rating)}
                              {product.totalReviews > 0 && (
                                <span className="text-[10px] text-gray-400 mr-0.5">({product.totalReviews})</span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleWishlist(product);
                              }}
                              className="p-0.5 rounded-full hover:bg-gray-100 transition"
                            >
                              <svg
                                className={`w-4 h-4 transition-colors duration-200 ${
                                  liked ? 'text-red-500 fill-current' : 'text-gray-400 fill-none'
                                }`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="mt-0.5 pt-0.5 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] text-gray-400">موجودی: {displayStock || 0}</span>
                              <div className="flex items-center gap-1">
                                {discountPercent > 0 && originalPrice && (
                                  <span className="text-[8px] text-gray-400 line-through">
                                    {formatPrice(originalPrice)} ت
                                  </span>
                                )}
                                <span className="text-[11px] font-bold text-[#800E2F]">
                                  {formatPrice(displayPrice)} ت
                                </span>
                              </div>
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
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => updateFilters({ page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-base font-medium text-gray-600 disabled:opacity-50"
                >
                  قبلی
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateFilters({ page: i + 1 })}
                    className={`px-5 py-2.5 rounded-xl border text-base font-medium transition ${
                      pagination.page === i + 1
                        ? 'bg-[#800E2F] text-white border-[#800E2F]'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => updateFilters({ page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-base font-medium text-gray-600 disabled:opacity-50"
                >
                  بعدی
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MobileShopPage;