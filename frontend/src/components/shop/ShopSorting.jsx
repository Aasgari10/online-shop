// src/components/shop/ShopSorting.jsx
function ShopSorting({ currentSort, onSortChange }) {
  const sortButtons = [
    { key: 'popular', label: 'پرفروش‌ترین' },
    { key: 'rating', label: 'بالاترین امتیاز' },
    { key: 'newest', label: 'جدیدترین' },
    { key: 'price_asc', label: 'ارزان‌ترین' },
    { key: 'price_desc', label: 'گران‌ترین' },
  ];

  return (
    <div className="mb-6 bg-white/50 rounded-xl p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700 ml-2">مرتب‌سازی:</span>
        {sortButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => onSortChange(btn.key)}
            className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 whitespace-nowrap ${
              currentSort === btn.key
                ? 'bg-[#800E2F] text-white shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ShopSorting;