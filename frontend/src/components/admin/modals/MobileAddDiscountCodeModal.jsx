// src/components/admin/modals/MobileAddDiscountCodeModal.jsx
import { useState, useEffect } from 'react';
import { useBottomNav } from '../../../context/BottomNavContext';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';

function MobileAddDiscountCodeModal({ isOpen, onClose, onSuccess }) {
  const { hideBottomNav, showBottomNav } = useBottomNav();

  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ State برای مدیریت ترکیبات
  const [productVariations, setProductVariations] = useState({});
  const [selectedVariations, setSelectedVariations] = useState({});
  const [loadingVariations, setLoadingVariations] = useState({});

  // فرم
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [usageLimit, setUsageLimit] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      hideBottomNav();
      fetchProducts();
    } else {
      showBottomNav();
      setStep(1);
      setCode('');
      setDiscountValue('');
      setEndDate(null);
      setUsageLimit('');
      setMaxDiscountAmount('');
      setSelectedProducts([]);
      setSelectedVariations({});
      setProductVariations({});
      setSearchTerm('');
      setSubmitting(false);
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

  // ✅ دریافت ترکیبات یک محصول
  const fetchVariations = async (productId) => {
    if (productVariations[productId]) return;
    setLoadingVariations(prev => ({ ...prev, [productId]: true }));
    try {
      const res = await api.get(`/products/${productId}/variations`);
      if (res.data.success) {
        setProductVariations(prev => ({
          ...prev,
          [productId]: res.data.data || []
        }));
        setSelectedVariations(prev => ({
          ...prev,
          [productId]: (res.data.data || []).map(v => v.id)
        }));
      }
    } catch (error) {
      console.error(`❌ خطا در دریافت ترکیبات محصول ${productId}:`, error);
      setProductVariations(prev => ({ ...prev, [productId]: [] }));
      setSelectedVariations(prev => ({ ...prev, [productId]: [] }));
    } finally {
      setLoadingVariations(prev => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    selectedProducts.forEach(productId => {
      if (!productVariations[productId]) {
        fetchVariations(productId);
      }
    });
  }, [selectedProducts]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  const toggleProduct = (id) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) setSelectedProducts([]);
    else setSelectedProducts(filteredProducts.map(p => p.id));
    setSelectAll(!selectAll);
  };

  const toggleVariation = (productId, variationId) => {
    setSelectedVariations(prev => {
      const current = prev[productId] || [];
      if (current.includes(variationId)) {
        return {
          ...prev,
          [productId]: current.filter(id => id !== variationId)
        };
      } else {
        return {
          ...prev,
          [productId]: [...current, variationId]
        };
      }
    });
  };

  const toggleAllVariations = (productId) => {
    const variations = productVariations[productId] || [];
    const current = selectedVariations[productId] || [];
    const allSelected = variations.every(v => current.includes(v.id));
    
    if (allSelected) {
      setSelectedVariations(prev => ({
        ...prev,
        [productId]: []
      }));
    } else {
      setSelectedVariations(prev => ({
        ...prev,
        [productId]: variations.map(v => v.id)
      }));
    }
  };

  const renderVariations = (productId) => {
    const variations = productVariations[productId] || [];
    const selected = selectedVariations[productId] || [];
    const isLoading = loadingVariations[productId];
    const allSelected = variations.length > 0 && variations.every(v => selected.includes(v.id));

    if (isLoading) {
      return <div className="text-xs text-gray-400 mr-3">در حال بارگذاری...</div>;
    }

    if (variations.length === 0) {
      return <div className="text-xs text-gray-400 mr-3">بدون ترکیب</div>;
    }

    return (
      <div className="mr-4 mt-1 space-y-0.5 border-r-2 border-gray-200 pr-2">
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => toggleAllVariations(productId)}
            className="w-3 h-3 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-[9px] text-gray-400">همه</span>
        </div>
        {variations.map(v => {
          const attrValues = v.attribute_values || {};
          let label = '';
          if (v.color_name) label = v.color_name;
          else if (attrValues['1']) label = `رنگ ${attrValues['1']}`;
          if (v.size_name) label += label ? ` - ${v.size_name}` : v.size_name;
          if (!label) label = `#${v.id}`;

          return (
            <div key={v.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={selected.includes(v.id)}
                onChange={() => toggleVariation(productId, v.id)}
                className="w-3 h-3 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
              />
              <span className="text-[10px] text-gray-600">{label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleNext = () => {
    const hasValidSelection = selectedProducts.some(productId => {
      const selected = selectedVariations[productId] || [];
      return selected.length > 0;
    });

    if (selectedProducts.length === 0) {
      toast.error('حداقل یک محصول را انتخاب کنید');
      return;
    }
    if (!hasValidSelection) {
      toast.error('برای هر محصول حداقل یک ترکیب را انتخاب کنید');
      return;
    }
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('لطفاً کد تخفیف را وارد کنید');
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error('مقدار تخفیف نامعتبر است');
      return;
    }
    if (!startDate) {
      toast.error('تاریخ شروع الزامی است');
      return;
    }

    setSubmitting(true);
    try {
      const product_ids = selectedProducts.filter(productId => {
        const selected = selectedVariations[productId] || [];
        return selected.length > 0;
      });

      const variation_ids = {};
      selectedProducts.forEach(productId => {
        const selected = selectedVariations[productId] || [];
        if (selected.length > 0) {
          variation_ids[productId] = selected;
        }
      });

      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        product_ids: product_ids,
        variation_ids: variation_ids,
      };
      await api.post('/admin/discount-codes', payload);
      toast.success('کد تخفیف با موفقیت ایجاد شد');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ایجاد کد تخفیف');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجوی محصول..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
        />
        <span className="text-xs text-gray-500">{selectedProducts.length} انتخاب</span>
      </div>

      <div className="max-h-[50vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-gray-500"><Spinner size="sm" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">محصولی یافت نشد</div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 py-1 border-b border-gray-200">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#800E2F]"
              />
              <span className="text-xs font-medium text-gray-500">انتخاب همه</span>
            </div>
            {filteredProducts.map(p => {
              const isSelected = selectedProducts.includes(p.id);
              return (
                <div key={p.id} className="border-b border-gray-100 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(p.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#800E2F]"
                    />
                    <span className="text-sm text-gray-800 flex-1">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.price?.toLocaleString()} ت</span>
                  </div>
                  {isSelected && (
                    <div className="mt-1">
                      <p className="text-[10px] text-gray-500 mr-6">ترکیبات:</p>
                      {renderVariations(p.id)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={onClose}
          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
        >
          انصراف
        </button>
        <button
          onClick={handleNext}
          disabled={selectedProducts.length === 0}
          className="flex-1 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          مرحله بعد ⬅️
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">کد تخفیف *</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="مثلاً SUMMER2025"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
          required
        />
        <p className="text-[10px] text-gray-400 mt-1">کد باید یکتا باشد (فقط حروف انگلیسی و اعداد)</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع تخفیف *</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white"
          >
            <option value="percent">درصدی</option>
            <option value="fixed">مبلغ ثابت</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {discountType === 'percent' ? 'درصد تخفیف *' : 'مبلغ تخفیف (تومان) *'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع *</label>
          <SimplePersianDatePicker value={startDate} onChange={setStartDate} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان (اختیاری)</label>
          <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">محدودیت استفاده (اختیاری)</label>
          <input
            type="number"
            min="1"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">حداکثر مبلغ تخفیف (اختیاری - تومان)</label>
          <input
            type="number"
            min="0"
            value={maxDiscountAmount}
            onChange={(e) => setMaxDiscountAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
          />
          <p className="text-[10px] text-gray-400 mt-1">اگر کد درصدی است، تخفیف از این مبلغ بیشتر نخواهد شد.</p>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-bold">{selectedProducts.length}</span> محصول انتخاب شده است.
          {Object.values(selectedVariations).some(v => v?.length > 0) && (
            <span className="block text-xs text-gray-400 mt-1">
              {Object.values(selectedVariations).reduce((sum, v) => sum + (v?.length || 0), 0)} ترکیب
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
        >
          ⬅️ بازگشت
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'در حال ثبت...' : '💾 ایجاد کد تخفیف'}
        </button>
      </div>
    </form>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800">
            {step === 1 ? '📦 انتخاب محصولات' : '⚙️ تنظیمات کد تخفیف'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        {step === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
}

export default MobileAddDiscountCodeModal;