// src/components/shop/ShopFilters.jsx
import { forwardRef, useRef, useState } from 'react';

const ShopFilters = forwardRef(({
  categories,
  filters,
  onFilterChange,
  onClearFilters,
  showDiscountOnly,
  onToggleDiscount,
}, ref) => {
  const searchInputRef = useRef(null);
  
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');
  const [selectedRating, setSelectedRating] = useState(filters.minRating || '');

  const applySearch = () => {
    const value = ref?.current?.value || searchInputRef.current?.value || '';
    onFilterChange({ search: value, page: 1 });
  };

  const clearSearch = () => {
    if (ref?.current) ref.current.value = '';
    if (searchInputRef.current) searchInputRef.current.value = '';
    onFilterChange({ search: '', page: 1 });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySearch();
    }
  };

  const applyPriceFilter = () => {
    onFilterChange({ minPrice, maxPrice, page: 1 });
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyPriceFilter();
    }
  };

  // ===== انتخاب امتیاز =====
  const handleRatingSelect = (rating) => {
    if (selectedRating === rating) {
      setSelectedRating('');
      onFilterChange({ minRating: '', page: 1 });
    } else {
      setSelectedRating(rating);
      onFilterChange({ minRating: rating, page: 1 });
    }
  };

  const ratingOptions = [5, 4, 3, 2, 1];

  return (
    <aside className="lg:w-1/4">
      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-100/50">
        {/* جستجو */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">جستجو</label>
          <div className="relative">
            <input
              ref={ref}
              type="text"
              defaultValue={filters.search}
              onKeyDown={handleKeyDown}
              placeholder="نام محصول..."
              className="w-full px-3 py-2.5 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50 transition"
            />
            <button
              onClick={applySearch}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#800E2F] transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* دسته‌بندی */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">دسته‌بندی</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50 transition"
          >
            {categories.map((cat) => (
              <option key={cat.key} value={cat.key}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* محدوده قیمت */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">محدوده قیمت</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onKeyDown={handlePriceKeyDown}
              placeholder="از"
              className="w-1/2 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50 transition"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onKeyDown={handlePriceKeyDown}
              placeholder="تا"
              className="w-1/2 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50 transition"
            />
          </div>
          <button
            onClick={applyPriceFilter}
            className="mt-2 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded-lg text-sm font-medium transition"
          >
            اعمال قیمت
          </button>
        </div>

        {/* ✅ فیلتر امتیاز (ستاره‌ها) */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">حداقل امتیاز</label>
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingSelect(rating)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                  selectedRating === rating
                    ? 'bg-[#800E2F] text-white border-[#800E2F] shadow-sm'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <span>{rating}</span>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              </button>
            ))}
            {selectedRating && (
              <button
                onClick={() => {
                  setSelectedRating('');
                  onFilterChange({ minRating: '', page: 1 });
                }}
                className="text-xs text-red-500 hover:text-red-700 transition"
              >
                ✕ لغو
              </button>
            )}
          </div>
        </div>

        {/* تخفیف‌دار */}
        <div className="mb-5 p-3 bg-gradient-to-r from-rose-50 to-pink-50/50 rounded-xl border border-rose-200/50">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDiscountOnly}
              onChange={(e) => onToggleDiscount(e.target.checked)}
              className="w-5 h-5 text-[#800E2F] border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] focus:ring-offset-2 transition cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span className="font-bold text-gray-800">فقط تخفیف‌دارها</span>
              <span className="text-xs text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">ویژه</span>
            </div>
          </label>
        </div>

        <button
          onClick={() => {
            setMinPrice('');
            setMaxPrice('');
            setSelectedRating('');
            onClearFilters();
          }}
          className="w-full bg-[#800E2F] hover:bg-[#6B0A26] text-white py-2.5 rounded-xl transition shadow-sm hover:shadow-md font-medium text-sm"
        >
          حذف همه فیلترها
        </button>
      </div>
    </aside>
  );
});

ShopFilters.displayName = 'ShopFilters';

export default ShopFilters;