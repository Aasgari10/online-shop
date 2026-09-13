// src/components/shop/ShopPagination.jsx
function ShopPagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
      >
        قبلی
      </button>
      {[...Array(totalPages)].map((_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i + 1)}
          className={`px-4 py-2 rounded-lg shadow border ${
            currentPage === i + 1
              ? 'bg-[#800E2F] text-white border-[#800E2F]'
              : 'bg-white hover:bg-gray-100 border-gray-200'
          } transition`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-lg bg-white shadow hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
      >
        بعدی
      </button>
    </div>
  );
}

export default ShopPagination;