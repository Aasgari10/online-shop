// src/components/admin/tabs/MobileProductsTab.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../../utils/formatPrice';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';

function MobileProductsTab({ products, onDelete, onEdit, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchDiscountModal, setShowBatchDiscountModal] = useState(false);
  const [showRemoveDiscountConfirm, setShowRemoveDiscountConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountEndTime, setDiscountEndTime] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredMap, setFeaturedMap] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) setCategories(res.data.data);
      } catch (error) {
        console.error('خطا در دریافت دسته‌بندی‌ها:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/admin/featured');
        if (res.data.success) {
          const map = {};
          res.data.data
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
        }
      } catch (error) {
        console.error('خطا در دریافت تخفیف‌ها:', error);
      }
    };
    fetchFeatured();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  // ===== انتخاب گروهی =====
  const toggleSelection = (id) => {
    console.log('🔄 [MobileProductsTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredProducts.length && filteredProducts.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileProductsTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredProducts.map(p => p.id);
      setSelectedItems(ids);
      setSelectAll(true);
      console.log('📊 همه انتخاب شدند:', ids.length);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileProductsTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} محصول...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/products/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} محصول با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileProductsTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی محصولات');
    } finally {
      setBatchLoading(false);
    }
  };

  // ============================================================
  // ✅ اعمال تخفیف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDiscount = async () => {
    const discount = parseFloat(discountPercent);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      toast.error('درصد تخفیف باید بین ۱ تا ۱۰۰ باشد');
      return;
    }

    console.log('🏷️ [MobileProductsTab] شروع اعمال تخفیف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال اعمال تخفیف به ${selectedItems.length} محصول...`);

    try {
      const promises = selectedItems.map(async (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const originalPrice = product.price;
        const discountedPrice = Math.round(originalPrice * (1 - discount / 100));

        await api.put(`/products/${productId}`, {
          name: product.name,
          description: product.description,
          price: discountedPrice,
          stock: product.stock,
          category_id: product.category_id,
        });

        const endTimeValue = discountEndTime ? discountEndTime.getTime() : null;
        await api.post('/admin/featured', {
          product_id: productId,
          type: 'discount',
          discount_percent: discount,
          original_price: originalPrice,
          end_time: endTimeValue,
          order_index: 0,
        });
      });

      await Promise.all(promises);
      toast.dismiss(loadingToast);
      toast.success(`تخفیف ${discount}% با موفقیت به ${selectedItems.length} محصول اعمال شد`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDiscountModal(false);
      setDiscountPercent('');
      setDiscountEndTime(null);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileProductsTab] خطا در اعمال تخفیف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در اعمال تخفیف گروهی');
    } finally {
      setBatchLoading(false);
    }
  };

  // ============================================================
  // ✅ حذف تخفیف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchRemoveDiscount = async () => {
    console.log('🗑️ [MobileProductsTab] شروع حذف تخفیف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف تخفیف ${selectedItems.length} محصول...`);

    try {
      const promises = selectedItems.map(async (productId) => {
        const discountInfo = featuredMap[productId];
        if (!discountInfo) return;

        const product = products.find(p => p.id === productId);
        if (!product) return;

        const originalPrice = discountInfo.original_price || product.price;
        await api.put(`/products/${productId}`, {
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
      toast.success(`تخفیف ${selectedItems.length} محصول با موفقیت حذف شد`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowRemoveDiscountConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileProductsTab] خطا در حذف تخفیف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف تخفیف');
    } finally {
      setBatchLoading(false);
    }
  };

  const hasDiscountedSelected = selectedItems.some(id => featuredMap[id]);
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

  return (
    <div className="pb-4">
      {/* سرتیتر */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          📦 محصولات
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <Link to="/admin/products" className="px-3 py-1.5 bg-[#800E2F] text-white rounded-xl text-sm font-medium hover:bg-[#6B0A26] transition whitespace-nowrap">
          ➕ جدید
        </Link>
      </div>

      {/* جستجو */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی محصول..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* انتخاب همه */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredProducts.length})</span>
        </div>
      )}

      {/* نوار عملیات گروهی */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button onClick={() => setShowBatchDiscountModal(true)} className="px-2 py-1 text-[10px] bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            🏷️ تخفیف
          </button>
          {hasDiscountedSelected && (
            <button onClick={() => setShowRemoveDiscountConfirm(true)} className="px-2 py-1 text-[10px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
              🗑️ حذف تخفیف
            </button>
          )}
          <button onClick={() => setShowBatchDeleteConfirm(true)} className="px-2 py-1 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            🗑️ حذف
          </button>
        </div>
      )}

      {/* لیست محصولات با چک‌باکس */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">محصولی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const discountInfo = featuredMap[product.id];
            const isDiscounted = !!discountInfo;
            const rating = product.averageRating || product.rating || 0;
            const productLink = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-300 overflow-hidden border border-gray-100/80 group flex flex-row items-stretch h-[130px] relative">
                {/* چک‌باکس انتخاب */}
                <div className="flex-shrink-0 w-8 h-full flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(product.id)}
                    onChange={() => toggleSelection(product.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  />
                </div>

                <Link to={productLink} className="flex-1 flex flex-row items-stretch h-full">
                  <div className="flex-shrink-0 w-[110px] h-[130px] bg-gray-50 overflow-hidden relative">
                    <img
                      src={product.image_url ? `${product.image_url}` : null}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                      onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
                    />
                    {isDiscounted && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                        {discountInfo.discount_percent}٪
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-2 pr-2 text-right flex flex-col h-full min-h-0">
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
                      </div>

                      <div className="mt-0.5 pt-0.5 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-gray-400">موجودی: {product.stock || 0}</span>
                          <div className="flex items-center gap-1">
                            {isDiscounted && (
                              <span className="text-[8px] text-gray-400 line-through">
                                {formatPrice(discountInfo.original_price)} ت
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-[#800E2F]">
                              {formatPrice(product.display_price || product.price)} ت
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
      )}

      {/* مودال تخفیف گروهی */}
      {showBatchDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">🏷️ تخفیف گروهی ({selectedItems.length} محصول)</h3>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">درصد تخفیف *</label>
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="مثلاً ۲۰"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">تاریخ پایان (اختیاری)</label>
              <SimplePersianDatePicker value={discountEndTime} onChange={setDiscountEndTime} className="w-full" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleBatchDiscount} disabled={batchLoading} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-medium disabled:opacity-50">
                {batchLoading ? '...' : '✅ اعمال تخفیف'}
              </button>
              <button onClick={() => setShowBatchDiscountModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی محصولات"
        message={`آیا از حذف ${selectedItems.length} محصول انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      <CustomConfirm
        isOpen={showRemoveDiscountConfirm}
        onClose={() => setShowRemoveDiscountConfirm(false)}
        onConfirm={handleBatchRemoveDiscount}
        title="🗑️ حذف تخفیف گروهی"
        message={`آیا از حذف تخفیف ${selectedItems.length} محصول انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="warning"
        loading={batchLoading}
      />
    </div>
  );
}

export default MobileProductsTab;