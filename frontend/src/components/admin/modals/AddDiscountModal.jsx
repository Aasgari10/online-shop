// src/components/admin/modals/AddDiscountModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import Spinner from '../../shared/Spinner';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';

function AddDiscountModal({ isOpen, onClose, onSuccess }) {
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

  // دریافت لیست محصولات
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?limit=1000');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      // ریست فرم
      setSelectedProductId('');
      setSelectedVariationId('');
      setDiscountPercent('');
      setEndDate(null);
      setVariations([]);
      setSearchTerm('');
      setShowDropdown(false);
    }
  }, [isOpen]);

  // دریافت ترکیبات محصول انتخاب‌شده
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

  // فیلتر محصولات بر اساس جستجو
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  // انتخاب محصول
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
      // دریافت قیمت اصلی محصول/ترکیب
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

      await api.post('/admin/featured', payload);
      toast.success('تخفیف با موفقیت اعمال شد');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در اعمال تخفیف');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ افزودن تخفیف جدید" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
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
                  if (e.target.value === '') {
                    setSelectedProductId('');
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="جستجوی محصول بر اساس نام یا شناسه..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              />
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {loading ? (
                    <div className="p-2 text-center text-gray-500">در حال بارگذاری...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-2 text-center text-gray-500">محصولی یافت نشد</div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          selectedProductId === p.id.toString() ? 'bg-gray-100' : ''
                        }`}
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
              <p className="text-xs text-green-600 mt-1">✅ محصول انتخاب شد: {products.find(p => p.id === parseInt(selectedProductId))?.name}</p>
            )}
          </div>

          {/* انتخاب ترکیب */}
          {selectedProductId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ترکیب (اختیاری - در صورت انتخاب، تخفیف فقط روی این ترکیب اعمال می‌شود)
              </label>
              {loadingVariations ? (
                <Spinner size="sm" />
              ) : variations.length > 0 ? (
                <select
                  value={selectedVariationId}
                  onChange={(e) => setSelectedVariationId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                >
                  <option value="">همه ترکیبات (تخفیف روی کل محصول)</option>
                  {variations.map((v) => {
                    const attrs = v.attribute_values || {};
                    let label = '';
                    if (attrs['1']) {
                      const colorName = attrs['1'];
                      label += `رنگ: ${colorName}`;
                    }
                    if (v.color_name) {
                      label += label ? ` - ${v.color_name}` : `رنگ: ${v.color_name}`;
                    }
                    if (v.size_name) {
                      label += label ? ` - سایز: ${v.size_name}` : `سایز: ${v.size_name}`;
                    }
                    for (const [key, value] of Object.entries(attrs)) {
                      if (key !== '1' && key !== 'price' && key !== 'stock') {
                        label += label ? ` - ${key}: ${value}` : `${key}: ${value}`;
                      }
                    }
                    if (!label) label = `ترکیب #${v.id}`;
                    return (
                      <option key={v.id} value={v.id}>
                        {label} (قیمت: {v.price?.toLocaleString() || 'نامشخص'} ت, موجودی: {v.stock || 0})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <p className="text-sm text-gray-500">این محصول هیچ ترکیبی ندارد. تخفیف روی کل محصول اعمال می‌شود.</p>
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
              placeholder="مثلاً ۲۰"
              required
            />
          </div>

          {/* تاریخ پایان */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان (اختیاری)</label>
            <SimplePersianDatePicker value={endDate} onChange={setEndDate} className="w-full" />
            <p className="text-xs text-gray-400 mt-1">در صورت خالی گذاشتن، تخفیف نامحدود خواهد بود.</p>
          </div>

          {/* دکمه‌ها */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" variant="primary" loading={submitting} className="flex-1">
              💾 اعمال تخفیف
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              انصراف
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default AddDiscountModal;