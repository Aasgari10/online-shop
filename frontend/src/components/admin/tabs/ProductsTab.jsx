// src/components/admin/tabs/ProductsTab.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { formatPrice } from '../../../utils/formatPrice';
import Spinner from '../../shared/Spinner';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import BatchDiscountModal from '../modals/BatchDiscountModal';
import PageHeader from '../../shared/PageHeader';

function ProductsTab({ onDelete, onEdit }) {
  const [filters, setFilters] = useState({
    search: '',
    category: 'همه',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    showDiscounted: false,
    star: '',
  });
  
  const [localMinPrice, setLocalMinPrice] = useState('');
  const [localMaxPrice, setLocalMaxPrice] = useState('');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 0 });
  const [featuredMap, setFeaturedMap] = useState({});

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchDiscountModal, setShowBatchDiscountModal] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);
  const [discountTargetProducts, setDiscountTargetProducts] = useState([]);
  const [showRemoveDiscountConfirm, setShowRemoveDiscountConfirm] = useState(false);
  const [removeDiscountTargets, setRemoveDiscountTargets] = useState([]);
  const [removeDiscountLoading, setRemoveDiscountLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // ✅ refs
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories?_t=' + Date.now());
        if (res.data.success) {
          const cats = res.data.data.map(c => ({
            key: c.id.toString(),
            label: c.name,
          }));
          setCategories([{ key: 'همه', label: 'همه' }, ...cats]);
        }
      } catch (error) {
        console.error('خطا در دریافت دسته‌بندی‌ها:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'همه') params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.star) params.append('star', filters.star);
      if (filters.showDiscounted) params.append('showDiscounted', 'true');
      params.append('page', page);
      params.append('limit', 12);
      params.append('_t', Date.now());

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
        setPagination(res.data.pagination);

        // featured map برای نمایش badge
        const featuredRes = await api.get('/admin/featured?_t=' + Date.now());
        const map = {};
        featuredRes.data.data
          .filter(f => f.type === 'discount')
          .forEach(f => {
            map[f.product_id] = {
              discount_percent: f.discount_percent || 0,
              end_time: f.end_time,
              featured_id: f.featured_id || f.id,
              original_price: f.original_price || f.price,
            };
          });
        
        setFeaturedMap(map);
        setSelectedProducts([]);
        setSelectAll(false);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت محصولات:', error);
      toast.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  // ✅ sync input value با state (برای reset و بازگشت)
  useEffect(() => {
    if (searchInputRef.current && searchInputRef.current.value !== filters.search) {
      searchInputRef.current.value = filters.search || '';
    }
  }, [filters.search]);

  // ✅ پاکسازی timeout در unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ✅ سرچ real-time با debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 400);
  };

  const applyFilters = () => {
    // ✅ از مقدار input استفاده کن (اگه کاربر سریع کلیک کرد و debounce تموم نشده)
    const currentSearch = searchInputRef.current?.value || '';
    setFilters({
      ...filters,
      search: currentSearch,
      minPrice: localMinPrice,
      maxPrice: localMaxPrice,
      page: 1,
    });
  };

  const resetFilters = () => {
    // ✅ پاک کردن input
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    // ✅ پاک کردن timeout pending
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setFilters({
      search: '',
      category: 'همه',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      showDiscounted: false,
      star: '',
      page: 1,
    });
  };

  const handleStarSelect = (star) => {
    if (filters.star === star) {
      setFilters(prev => ({ ...prev, star: '', page: 1 }));
    } else {
      setFilters(prev => ({ ...prev, star, page: 1 }));
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchProducts(page);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('آیا از انتقال این محصول به سطل زباله مطمئن هستید؟')) return;
    setDeletingProductId(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success('محصول با موفقیت به سطل زباله منتقل شد');
      setProducts(prev => prev.filter(p => p.id !== id));
      await fetchProducts(pagination.page);
    } catch (error) {
      console.error('❌ خطا در حذف محصول:', error);
      if (error.response?.status === 404) {
        toast.warning('این محصول قبلاً حذف شده است');
        await fetchProducts(pagination.page);
      } else {
        toast.error(error.response?.data?.message || 'خطا در حذف محصول');
      }
    } finally {
      setDeletingProductId(null);
    }
  };

  const sortOptions = [
    { key: 'newest', label: 'جدیدترین' },
    { key: 'popular', label: 'پرفروش‌ترین' },
    { key: 'price_asc', label: 'ارزان‌ترین' },
    { key: 'price_desc', label: 'گران‌ترین' },
  ];

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const newSelection = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      setSelectAll(newSelection.length === products.length && products.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) return;
    setBatchDeleteLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedProducts.length} محصول...`);

    try {
      await Promise.all(selectedProducts.map(id => api.delete(`/products/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedProducts.length} محصول با موفقیت به سطل زباله منتقل شدند`);
      setSelectedProducts([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      fetchProducts(pagination.page);
    } catch (error) {
      console.error('❌ [ProductsTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی محصولات');
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const handleBatchDiscountSuccess = () => {
    setSelectedProducts([]);
    setSelectAll(false);
    fetchProducts(pagination.page);
  };

  const openDiscountModal = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    setDiscountTargetProducts(selectedProductsData);
    setShowBatchDiscountModal(true);
  };

  const openRemoveDiscountConfirm = (productId = null) => {
    let targets = [];
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product && featuredMap[productId]) {
        targets = [product];
      } else {
        toast.error('این محصول تخفیف ندارد');
        return;
      }
    } else {
      targets = products.filter(p => selectedProducts.includes(p.id) && featuredMap[p.id]);
    }

    if (targets.length === 0) {
      toast.error('هیچ محصول تخفیف‌داری برای حذف تخفیف انتخاب نشده است');
      return;
    }

    setRemoveDiscountTargets(targets);
    setShowRemoveDiscountConfirm(true);
  };

  const handleRemoveDiscount = async () => {
    if (removeDiscountTargets.length === 0) return;
    setRemoveDiscountLoading(true);
    const loadingToast = toast.loading(`در حال حذف تخفیف ${removeDiscountTargets.length} محصول...`);

    try {
      const promises = removeDiscountTargets.map(async (product) => {
        const discountInfo = featuredMap[product.id];
        if (!discountInfo) return;

        const originalPrice = discountInfo.original_price || product.price;
        await api.put(`/products/${product.id}`, {
          name: product.name,
          description: product.description,
          price: originalPrice,
          stock: product.stock,
          category_id: product.category_id,
        });

        const featuredId = discountInfo.featured_id;
        if (featuredId) {
          await api.delete(`/admin/featured/${featuredId}`);
        }
      });

      await Promise.all(promises);
      toast.dismiss(loadingToast);
      toast.success(`تخفیف ${removeDiscountTargets.length} محصول با موفقیت حذف شد`);
      setSelectedProducts([]);
      setSelectAll(false);
      setShowRemoveDiscountConfirm(false);
      setRemoveDiscountTargets([]);
      fetchProducts(pagination.page);
    } catch (error) {
      console.error('❌ خطا در حذف تخفیف:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف تخفیف');
    } finally {
      setRemoveDiscountLoading(false);
    }
  };

  const hasDiscountedSelected = selectedProducts.some(id => featuredMap[id]);
  const selectedCount = selectedProducts.length;

  if (loading) return <Spinner />;

  return (
    <div className="p-0 m-0">
      <PageHeader 
        title="📦 مدیریت محصولات" 
        subtitle="افزودن، ویرایش و حذف محصولات" 
        className="mb-2 mt-2"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link
          to="/admin/products"
          className="px-4 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span>➕</span> افزودن محصول جدید
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {selectedProducts.length > 0 && (
            <>
              {hasDiscountedSelected && (
                <button
                  onClick={() => openRemoveDiscountConfirm()}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
                >
                  🗑️ حذف تخفیف ({selectedCount})
                </button>
              )}
              <button
                onClick={openDiscountModal}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
              >
                🏷️ {selectedCount === 1 ? 'اعمال تخفیف' : `تخفیف گروهی (${selectedCount})`}
              </button>
              <button
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                🗑️ {selectedCount === 1 ? 'حذف' : `حذف گروهی (${selectedCount})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== بخش فیلترها ===== */}
      <div className="bg-gray-50/70 rounded-xl p-3 mb-2 mt-7 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              جستجو
              <span className="text-[10px] text-gray-400 mr-1">(خودکار)</span>
            </label>
            <input
              ref={searchInputRef}
              type="text"
              defaultValue={filters.search}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  applyFilters();
                }
              }}
              placeholder="نام محصول..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">قیمت از</label>
            <input
              type="number"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
              placeholder="۰"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">قیمت تا</label>
            <input
              type="number"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyFilters(); } }}
              placeholder="نامحدود"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">مرتب‌سازی:</span>
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilters({ ...filters, sort: opt.key, page: 1 })}
                className={`px-3 py-1 text-xs rounded-full transition ${
                  filters.sort === opt.key
                    ? 'bg-[#800E2F] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mr-4">
              <input
                type="checkbox"
                checked={filters.showDiscounted}
                onChange={(e) => setFilters({ ...filters, showDiscounted: e.target.checked, page: 1 })}
                className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
              />
              <span className="font-medium">🔥 فقط تخفیف‌دارها</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-1.5 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
            >
              اعمال فیلترها
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-1.5 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition"
            >
              حذف فیلترها
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">فیلتر بر اساس ستاره:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleStarSelect(star.toString())}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition ${
                filters.star === star.toString()
                  ? 'bg-[#800E2F] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>{star}</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </button>
          ))}
          {filters.star && (
            <button
              onClick={() => setFilters({ ...filters, star: '', page: 1 })}
              className="text-xs text-red-500 hover:text-red-700 transition"
            >
              ✕ لغو
            </button>
          )}
          <span className="text-xs text-gray-400">
            {filters.star ? `نمایش محصولات با ${filters.star} ستاره` : 'همه محصولات'}
          </span>
        </div>
      </div>

      {/* ===== جدول محصولات ===== */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              <th className="text-right py-2 px-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  disabled={products.length === 0}
                />
              </th>
              <th className="text-right py-2 px-3">شناسه</th>
              <th className="text-right py-2 px-3">تصویر</th>
              <th className="text-right py-2 px-3">نام</th>
              <th className="text-right py-2 px-3">دسته‌بندی</th>
              <th className="text-right py-2 px-3">قیمت</th>
              <th className="text-right py-2 px-3">موجودی</th>
              <th className="text-right py-2 px-3">امتیاز</th>
              <th className="text-right py-2 px-3">تخفیف</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-8 text-gray-500">
                  {filters.showDiscounted ? 'هیچ محصول تخفیف‌داری یافت نشد' : 'محصولی یافت نشد'}
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const discountInfo = featuredMap[p.id];
                const isDiscounted = !!discountInfo;
                const rating = p.averageRating || 0;
                const safeRating = Math.max(0, Math.min(5, rating));
                const ratingDisplay = safeRating === 0 ? '۰' : safeRating.toFixed(1);
                const displayPrice = p.display_price !== undefined && p.display_price !== null 
                  ? p.display_price 
                  : p.price || 0;
                const isDeleting = deletingProductId === p.id;
                
                return (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(p.id)}
                        onChange={() => toggleProductSelection(p.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-gray-500">{p.id}</td>
                    <td className="py-2 px-3">
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                        {p.image_url ? (
                          <img src={`${p.image_url}`} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">بدون</div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-medium text-gray-800">{p.name}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs bg-[#800E2F]/10 text-[#800E2F] px-2 py-0.5 rounded-full">
                        {p.category_name || 'بدون دسته‌بندی'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left align-middle">
                      {isDiscounted ? (
                        <div className="flex flex-col items-end w-full">
                          <span className="text-xs text-gray-700 line-through">
                            ت {formatPrice(discountInfo.original_price)}
                          </span>
                          <span className="text-[#800E2F] font-medium">
                            ت {formatPrice(displayPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#800E2F] font-medium"> ت {formatPrice(displayPrice)}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">{p.stock || 0}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5">
                          {renderStars(safeRating)}
                        </div>
                        <span className="text-xs text-gray-500 mr-1">{ratingDisplay}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {isDiscounted ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {discountInfo.discount_percent}% تخفیف
                          </span>
                          <button
                            onClick={() => openRemoveDiscountConfirm(p.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition"
                            title="حذف تخفیف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 flex gap-2">
                      <button
                        onClick={() => onEdit(p.id)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={isDeleting}
                        className={`text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition ${
                          isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isDeleting ? '...' : '🗑️ حذف'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-sm"
          >
            قبلی
          </button>
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded-lg shadow border text-sm ${
                pagination.page === i + 1
                  ? 'bg-[#800E2F] text-white border-[#800E2F]'
                  : 'bg-white hover:bg-gray-100 border-gray-200'
              } transition`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-sm"
          >
            بعدی
          </button>
        </div>
      )}

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی محصولات"
        message={`آیا از حذف ${selectedProducts.length} محصول انتخاب‌شده مطمئن هستید؟ این محصولات به سطل زباله منتقل خواهند شد.`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchDeleteLoading}
      />

      <BatchDiscountModal
        isOpen={showBatchDiscountModal}
        onClose={() => setShowBatchDiscountModal(false)}
        products={discountTargetProducts}
        onSuccess={handleBatchDiscountSuccess}
      />

      <CustomConfirm
        isOpen={showRemoveDiscountConfirm}
        onClose={() => setShowRemoveDiscountConfirm(false)}
        onConfirm={handleRemoveDiscount}
        title="⚠️ حذف تخفیف"
        message={
          removeDiscountTargets.length === 1
            ? `آیا از حذف تخفیف محصول "${removeDiscountTargets[0]?.name}" مطمئن هستید؟ تخفیف به سطل زباله منتقل می‌شود و قابل بازیابی است.`
            : `آیا از حذف تخفیف ${removeDiscountTargets.length} محصول انتخاب‌شده مطمئن هستید؟ تخفیف‌ها به سطل زباله منتقل می‌شوند و قابل بازیابی هستند.`
        }
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="warning"
        loading={removeDiscountLoading}
      />
    </div>
  );
}

export default ProductsTab;