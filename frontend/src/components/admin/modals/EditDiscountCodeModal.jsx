// src/components/admin/modals/EditDiscountCodeModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import Spinner from '../../shared/Spinner';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import { formatPrice } from '../../../utils/formatPrice';

function EditDiscountCodeModal({ isOpen, onClose, code: existingCode, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  
  const [productVariations, setProductVariations] = useState({});
  const [selectedVariations, setSelectedVariations] = useState({});
  const [loadingVariations, setLoadingVariations] = useState({});
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [usageLimit, setUsageLimit] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !existingCode) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const codeRes = await api.get(`/admin/discount-codes/${existingCode.id}`);
        if (codeRes.data.success) {
          const data = codeRes.data.data;
          setCode(data.code);
          setDiscountType(data.discount_type);
          setDiscountValue(data.discount_value);
          setStartDate(new Date(data.start_date));
          setEndDate(data.end_date ? new Date(data.end_date) : null);
          setUsageLimit(data.usage_limit || '');
          setMaxDiscountAmount(data.max_discount_amount || '');
          setIsActive(data.is_active);
          
          const productIds = data.product_ids || [];
          const variationIds = data.variation_ids || {};
          
          if (productIds.length > 0) {
            setSelectedProducts(productIds);
            
            const variationPromises = productIds.map(async (pid) => {
              try {
                const varRes = await api.get(`/products/${pid}/variations`);
                if (varRes.data.success) {
                  const variations = varRes.data.data || [];
                  setProductVariations(prev => ({ ...prev, [pid]: variations }));
                  
                  const savedVariations = variationIds[pid] || [];
                  // ✅ فقط ترکیبات ذخیره‌شده را انتخاب کن (اگر خالی بود، یعنی کل محصول مجاز است)
                  setSelectedVariations(prev => ({ ...prev, [pid]: savedVariations }));
                }
              } catch (err) {
                console.error(`❌ خطا در دریافت ترکیبات محصول ${pid}:`, err);
                setProductVariations(prev => ({ ...prev, [pid]: [] }));
                setSelectedVariations(prev => ({ ...prev, [pid]: [] }));
              }
            });
            await Promise.all(variationPromises);
            setInitialLoaded(true);
          }
        }

        const productRes = await api.get('/products?limit=1000');
        if (productRes.data.success) {
          setProducts(productRes.data.data);
        }
      } catch (error) {
        toast.error('خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen, existingCode]);

  const fetchVariations = async (productId) => {
    if (productVariations[productId]) return;
    setLoadingVariations(prev => ({ ...prev, [productId]: true }));
    try {
      const res = await api.get(`/products/${productId}/variations`);
      if (res.data.success) {
        const variations = res.data.data || [];
        setProductVariations(prev => ({ ...prev, [productId]: variations }));
        
        // ✅ فقط در صورتی که قبلاً هیچ انتخابی برای این محصول نشده باشد
        if (selectedVariations[productId] === undefined) {
          setSelectedVariations(prev => ({
            ...prev,
            [productId]: variations.map(v => v.id)
          }));
        }
        // اگر قبلاً [] یا آرایه‌ای از ids وجود دارد، دست نزن
      }
    } catch (error) {
      console.error(`❌ خطا در دریافت ترکیبات محصول ${productId}:`, error);
      setProductVariations(prev => ({ ...prev, [productId]: [] }));
      if (selectedVariations[productId] === undefined) {
        setSelectedVariations(prev => ({ ...prev, [productId]: [] }));
      }
    } finally {
      setLoadingVariations(prev => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    selectedProducts.forEach(productId => {
      if (!productVariations[productId] && !loadingVariations[productId]) {
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
    if (selectedProducts.includes(id)) {
      setSelectedVariations(prev => {
        const newVar = { ...prev };
        delete newVar[id];
        return newVar;
      });
    }
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
    const allSelected = variations.length > 0 && variations.every(v => current.includes(v.id));
    
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

    console.log('📥 [EditDiscountCodeModal] شروع ویرایش کد تخفیف');
    console.log('📥 [EditDiscountCodeModal] selectedProducts:', selectedProducts);
    console.log('📥 [EditDiscountCodeModal] selectedVariations:', selectedVariations);

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

      console.log('📤 [EditDiscountCodeModal] product_ids ارسالی:', product_ids);
      console.log('📤 [EditDiscountCodeModal] variation_ids ارسالی:', variation_ids);

      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        start_date: startDate.toISOString(),
        end_date: endDate ? endDate.toISOString() : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        is_active: isActive,
        product_ids: product_ids,
        variation_ids: variation_ids,
      };

      console.log('📤 [EditDiscountCodeModal] payload نهایی:', payload);

      const response = await api.put(`/admin/discount-codes/${existingCode.id}`, payload);
      console.log('✅ [EditDiscountCodeModal] پاسخ سرور:', response.data);

      if (response.data.success) {
        toast.success('کد تخفیف با موفقیت ویرایش شد');
        onSuccess();
        onClose();
      } else {
        toast.error(response.data.message || 'خطا در ویرایش کد تخفیف');
      }
    } catch (error) {
      console.error('❌ [EditDiscountCodeModal] خطا:', error);
      console.error('❌ [EditDiscountCodeModal] error.response:', error.response?.data);
      toast.error(error.response?.data?.message || 'خطا در ویرایش کد تخفیف');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !existingCode) return null;

  if (loading) return <Spinner size="md" />;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ ویرایش کد تخفیف" size="xl">
      <div>
        <div className="mb-6">
          <h4 className="font-bold text-gray-700 mb-2">محصولات و ترکیبات مشمول تخفیف</h4>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجوی محصول..."
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#800E2F] flex-1 min-w-[200px]"
            />
            <span className="text-sm text-gray-500">{selectedProducts.length} محصول انتخاب شده</span>
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-3">
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
                          {isSelected && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              انتخاب‌شده
                            </span>
                          )}
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">کد تخفیف *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                required
              />
            </div>
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              required
            />
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

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
              />
              فعال
            </label>
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

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} type="button">انصراف</Button>
            <Button variant="primary" type="submit" loading={submitting}>💾 ذخیره تغییرات</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default EditDiscountCodeModal;