// src/components/shop/ShopHeader.jsx
function ShopHeader({ search, total }) {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {search ? (
              <>نتیجه جستجو برای: <span className="text-[#800E2F]">"{search}"</span></>
            ) : (
              'کالاها'
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">در حال نمایش {total} نتیجه</p>
        </div>
        {/* ❌ سرچ‌بار حذف شد */}
      </div>
    </div>
  );
}

export default ShopHeader;