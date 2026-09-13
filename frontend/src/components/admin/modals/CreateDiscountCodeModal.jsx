// src/components/admin/modals/CreateDiscountCodeModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import Spinner from '../../shared/Spinner';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import { formatPrice } from '../../../utils/formatPrice';

function CreateDiscountCodeModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [productVariations, setProductVariations] = useState({});
  const [selectedVariations, setSelectedVariations] = useState({});
  const [loadingVariations, setLoadingVariations] = useState({});

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [usageLimit, setUsageLimit] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (isOpen && step === 1) fetchProducts();
  }, [isOpen, step]);

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
        const variationIds = (res.data.data || []).map(v => v.id);
        setSelectedVariations(prev => ({
          ...prev,
          [productId]: variationIds
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

  const renderVariations = (productId) => {
    const variations = productVariations[productId] || [];
    const selected = selectedVariations[productId] || [];
    const isLoading = loadingVariations[productId];
    const allSelected = variations.length > 0 && variations.every(v => selected.includes(v.id));

    if (isLoading) {
      return <div className="text-xs text-gray-400 mr-4">در حال بارگذاری ترکیبات...</div>;
    }

    if (variations.length === 0) {
      return <div className="text-xs text-gray-400 mr-4">هیچ ترکیبی برای این محصول وجود ندارد.</div>;
    }

    return (
      <div className="mr-6 mt-1 space-y-0.5 border-r-2 border-gray-200 pr-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => toggleAllVariations(productId)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-[10px] text-gray-400">انتخاب همه ترکیبات</span>
        </div>
        {variations.map(v => {
          const attrValues = v.attribute_values || {};
          let label = '';
          if (attrValues['1']) {
            const color = attrValues['1'];
            label += `رنگ: ${color}`;
          }
          if (v.color_name) {
            label += label ? ` - ${v.color_name}` : `رنگ: ${v.color_name}`;
          }
          if (v.size_name) {
            label += label ? ` - سایز: ${v.size_name}` : `سایز: ${v.size_name}`;
          }
          for (const [key, value] of Object.entries(attrValues)) {
            if (key !== '1' && key !== 'price' && key !== 'stock') {
              label += label ? ` - ${key}: ${value}` : `${key}: ${value}`;
            }
          }
          if (!label) label = `ترکیب #${v.id}`;

          return (
            <div key={v.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(v.id)}
                onChange={() => toggleVariation(productId, v.id)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
              />
              <span className="text-[11px] text-gray-600">{label}</span>
              <span className="text-[9px] text-gray-400">(موجودی: {v.stock || 0})</span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📥 [CreateDiscountCodeModal] شروع ارسال فرم');
    console.log('📥 [CreateDiscountCodeModal] selectedProducts:', selectedProducts);
    console.log('📥 [CreateDiscountCodeModal] selectedVariations:', selectedVariations);

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

      console.log('📤 [CreateDiscountCodeModal] product_ids ارسالی:', product_ids);
      console.log('📤 [CreateDiscountCodeModal] variation_ids ارسالی:', variation_ids);

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

      console.log('📤 [CreateDiscountCodeModal] payload نهایی:', payload);

      const response = await api.post('/admin/discount-codes', payload);
      console.log('✅ [CreateDiscountCodeModal] پاسخ سرور:', response.data);

      if (response.data.success) {
        toast.success('کد تخفیف با موفقیت ایجاد شد');
        onSuccess();
        onClose();
        setStep(1);
        setSelectedProducts([]);
        setSelectedVariations({});
        setProductVariations({});
        setCode('');
        setDiscountValue('');
        setEndDate(null);
        setUsageLimit('');
        setMaxDiscountAmount('');
      } else {
        toast.error(response.data.message || 'خطا در ایجاد کد تخفیف');
      }
    } catch (error) {
      console.error('❌ [CreateDiscountCodeModal] خطا:', error);
      console.error('❌ [CreateDiscountCodeModal] error.response:', error.response?.data);
      toast.error(error.response?.data?.message || 'خطا در ایجاد کد تخفیف');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? '📦 انتخاب محصولات و ترکیبات' : '⚙️ تنظیمات کد تخفیف'}
      size="xl"
    >
      {step === 1 && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی محصول..."
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#800E2F] flex-1 min-w-[200px]"
            />
            <span className="text-sm text-gray-500">{selectedProducts.length} محصول انتخاب شده</span>
          </div>

          <div className="overflow-x-auto max-h-[60vh]">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                    disabled={filteredProducts.length === 0}
                  />
                  <span className="text-xs font-medium text-gray-600">انتخاب همه محصولات</span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">محصولی یافت نشد</div>
                ) : (
                  filteredProducts.map(p => {
                    const isSelected = selectedProducts.includes(p.id);
                    const hasVariations = productVariations[p.id]?.length > 0;

                    return (
                      <div
                        key={p.id}
                        className={`border rounded-lg p-3 transition ${
                          isSelected ? 'border-[#800E2F] bg-[#800E2F]/5' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(p.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 text-sm">{p.name}</span>
                              <span className="text-xs text-gray-400">(#{p.id})</span>
                              <span className="text-xs text-gray-400">{formatPrice(p.price)} ت</span>
                            </div>
                            {isSelected && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">انتخاب ترکیبات:</p>
                                {renderVariations(p.id)}
                              </div>
                            )}
                          </div>
                          {isSelected && !hasVariations && (
                            <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                              بدون ترکیب
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>انصراف</Button>
            <Button variant="primary" onClick={handleNext} disabled={selectedProducts.length === 0}>
              مرحله بعد ⬅️
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد تخفیف *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثلاً SUMMER2025"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
              />
              <p className="text-xs text-gray-400 mt-1">کد باید یکتا باشد (فقط حروف انگلیسی و اعداد)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع تخفیف *</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
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
                  placeholder={discountType === 'percent' ? 'مثلاً 20' : 'مثلاً 50000'}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع *</label>
                <SimplePersianDatePicker value={startDate} onChange={setStartDate} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان (اختیاری)</label>
                <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">محدودیت تعداد استفاده (اختیاری)</label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="خالی = نامحدود"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  حداکثر مبلغ تخفیف (اختیاری - تومان)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="مثلاً 50000 (خالی = نامحدود)"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                />
                <p className="text-xs text-gray-400 mt-1">اگر کد درصدی است، تخفیف از این مبلغ بیشتر نخواهد شد.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-bold">{selectedProducts.length}</span> محصول انتخاب شده‌است.
                {Object.values(selectedVariations).some(v => v?.length > 0) && (
                  <span className="block text-xs text-gray-400 mt-1">
                    ترکیبات انتخاب‌شده: {Object.values(selectedVariations).reduce((sum, v) => sum + (v?.length || 0), 0)} ترکیب
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleBack} type="button">⬅️ بازگشت</Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} type="button">انصراف</Button>
              <Button variant="primary" type="submit" loading={submitting}>💾 ایجاد کد تخفیف</Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default CreateDiscountCodeModal;