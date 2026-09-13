// src/components/admin/modals/MobileAddDiscountModal.jsx
import { useState, useEffect } from 'react';
import { useBottomNav } from '../../../context/BottomNavContext';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';

function MobileAddDiscountModal({ isOpen, onClose, onSave }) {
  const { hideBottomNav, showBottomNav } = useBottomNav();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [variations, setVariations] = useState([]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [endDate, setEndDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      hideBottomNav();
      fetchProducts();
      // ریست فرم
      setSelectedProductId('');
      setSelectedVariationId('');
      setDiscountPercent('');
      setEndDate(null);
      setVariations([]);
      setSearchTerm('');
      setShowDropdown(false);
    } else {
      showBottomNav();
    }
    return () => showBottomNav();
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?limit=1000');
      if (res.data.success) setProducts(res.data.data);
    } catch (error) {
      toast.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      const fetchVariations = async () => {
        setLoadingVariations(true);
        try {
          const res = await api.get(`/products/${selectedProductId}/variations`);
          if (res.data.success) {
            setVariations(res.data.data || []);
            if (res.data.data.length > 0) {
              setSelectedVariationId(res.data.data[0].id);
            } else {
              setSelectedVariationId('');
            }
          }
        } catch (error) {
          console.error('خطا در دریافت ترکیبات:', error);
          setVariations([]);
        } finally {
          setLoadingVariations(false);
        }
      };
      fetchVariations();
    } else {
      setVariations([]);
      setSelectedVariationId('');
    }
  }, [selectedProductId]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setSearchTerm(products.find(p => p.id === parseInt(productId))?.name || '');
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('لطفاً یک محصول انتخاب کنید');
      return;
    }
    if (!discountPercent || parseFloat(discountPercent) <= 0 || parseFloat(discountPercent) > 100) {
      toast.error('درصد تخفیف باید بین ۱ تا ۱۰۰ باشد');
      return;
    }

    setSubmitting(true);
    try {
      // دریافت قیمت اصلی
      let originalPrice = null;
      if (selectedVariationId) {
        const varRes = await api.get(`/products/${selectedProductId}/variations`);
        const found = varRes.data.data.find(v => v.id === parseInt(selectedVariationId));
        originalPrice = found ? found.price : null;
      } else {
        const product = products.find(p => p.id === parseInt(selectedProductId));
        originalPrice = product ? product.price : null;
      }

      if (!originalPrice) {
        toast.error('قیمت محصول/ترکیب یافت نشد');
        setSubmitting(false);
        return;
      }

      const payload = {
        product_id: parseInt(selectedProductId),
        variation_id: selectedVariationId ? parseInt(selectedVariationId) : null,
        type: 'discount',
        discount_percent: parseFloat(discountPercent),
        original_price: parseFloat(originalPrice),
        end_time: endDate ? endDate.getTime() : null,
        order_index: 0,
      };

      await onSave(payload);
      toast.success('تخفیف با موفقیت اعمال شد');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در اعمال تخفیف');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">➕ افزودن تخفیف جدید</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* انتخاب محصول با جستجو */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">محصول *</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (e.target.value === '') setSelectedProductId('');
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="جستجوی محصول..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {loading ? (
                    <div className="p-2 text-center text-gray-400 text-sm">در حال بارگذاری...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-2 text-center text-gray-400 text-sm">محصولی یافت نشد</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSelectProduct(p.id.toString())}
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-gray-400 ml-2">(ID: {p.id})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedProductId && (
              <p className="text-xs text-green-600 mt-1">✅ محصول انتخاب شد</p>
            )}
          </div>

          {/* انتخاب ترکیب */}
          {selectedProductId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ترکیب (اختیاری)</label>
              {loadingVariations ? (
                <Spinner size="sm" />
              ) : variations.length > 0 ? (
                <select
                  value={selectedVariationId}
                  onChange={(e) => setSelectedVariationId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                >
                  <option value="">همه ترکیبات</option>
                  {variations.map((v) => {
                    const attrs = v.attribute_values || {};
                    let label = '';
                    if (attrs['1']) label += `رنگ: ${attrs['1']}`;
                    if (v.color_name) label += label ? ` - ${v.color_name}` : `رنگ: ${v.color_name}`;
                    if (v.size_name) label += label ? ` - سایز: ${v.size_name}` : `سایز: ${v.size_name}`;
                    if (!label) label = `ترکیب #${v.id}`;
                    return (
                      <option key={v.id} value={v.id}>
                        {label} (قیمت: {v.price?.toLocaleString() || 'نامشخص'})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <p className="text-sm text-gray-400">بدون ترکیب</p>
              )}
            </div>
          )}

          {/* درصد تخفیف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">درصد تخفیف *</label>
            <input
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              placeholder="مثلاً ۲۰"
              required
            />
          </div>

          {/* تاریخ پایان */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان (اختیاری)</label>
            <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-full" />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50"
            >
              {submitting ? 'در حال ثبت...' : '💾 اعمال تخفیف'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MobileAddDiscountModal;