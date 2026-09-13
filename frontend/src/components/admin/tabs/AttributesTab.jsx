// src/components/admin/ProductAttributes.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';

function ProductAttributes({ productId, onAttributesChange }) {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [customAttributes, setCustomAttributes] = useState({});
  const [variations, setVariations] = useState([]);
  
  // ===== State برای افزودن ویژگی اختصاصی جدید =====
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [addingAttr, setAddingAttr] = useState(false);

  // ===== دریافت داده‌ها =====
  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        // ۱. دریافت همه رنگ‌ها
        const colorsRes = await api.get('/colors');
        setColors(colorsRes.data.data || []);

        // ۲. دریافت ویژگی‌های اختصاصی محصول (مسیر جدید)
        try {
          const customRes = await api.get(`/products/${productId}/custom-attributes`);
          if (customRes.data.success) {
            const data = customRes.data.data;
            // داده‌ها به شکل { colors: [...], custom: {...} } هستند
            if (data.colors) {
              const colorIds = data.colors.map(c => c.id);
              setSelectedColors(colorIds);
            }
            if (data.custom) {
              setCustomAttributes(data.custom);
            }
          }
        } catch (e) {
          // 
          // اگر مسیر وجود نداشت، از داده‌های خالی استفاده کن
        }

        // ۳. دریافت ترکیبات
        const varRes = await api.get(`/products/${productId}/variations`);
        if (varRes.data.success) {
          setVariations(varRes.data.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('خطا در دریافت ویژگی‌ها:', error);
        toast.error('خطا در دریافت اطلاعات ویژگی‌ها');
        setLoading(false);
      }
    };
    fetchData();
  }, [productId]);

  // ===== به‌روزرسانی لیست ویژگی‌ها بعد از هر تغییر =====
  const refreshCustomAttributes = async () => {
    try {
      const customRes = await api.get(`/products/${productId}/custom-attributes`);
      if (customRes.data.success) {
        const data = customRes.data.data;
        if (data.colors) {
          const colorIds = data.colors.map(c => c.id);
          setSelectedColors(colorIds);
        }
        if (data.custom) {
          setCustomAttributes(data.custom);
        }
      }
    } catch (e) {
      // 
    }
  };

  // ===== افزودن ویژگی اختصاصی جدید =====
  const handleAddCustomAttribute = async (e) => {
    e.preventDefault();
    if (!newAttrName.trim()) {
      toast.error('نام ویژگی را وارد کنید');
      return;
    }
    if (!newAttrValues.trim()) {
      toast.error('مقادیر ویژگی را وارد کنید (با کاما جدا کنید)');
      return;
    }

    const values = newAttrValues.split(',').map(v => v.trim()).filter(v => v);
    if (values.length === 0) {
      toast.error('حداقل یک مقدار وارد کنید');
      return;
    }

    setAddingAttr(true);
    try {
      const updatedAttrs = {
        ...customAttributes,
        [newAttrName.trim()]: values,
      };
      
      await api.put(`/admin/products/${productId}/custom-attributes`, {
        custom_attributes: updatedAttrs,
      });

      // ✅ به‌روزرسانی لیست
      await refreshCustomAttributes();
      
      setNewAttrName('');
      setNewAttrValues('');
      toast.success(`ویژگی "${newAttrName}" با موفقیت اضافه شد`);
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
    } catch (error) {
      toast.error('خطا در افزودن ویژگی');
    } finally {
      setAddingAttr(false);
    }
  };

  // ===== حذف ویژگی اختصاصی =====
  const handleRemoveCustomAttribute = async (attrName) => {
    if (!window.confirm(`آیا از حذف ویژگی "${attrName}" مطمئن هستید؟`)) return;
    try {
      const updatedAttrs = { ...customAttributes };
      delete updatedAttrs[attrName];
      
      await api.put(`/admin/products/${productId}/custom-attributes`, {
        custom_attributes: updatedAttrs,
      });

      await refreshCustomAttributes();
      toast.success(`ویژگی "${attrName}" حذف شد`);
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
    } catch (error) {
      toast.error('خطا در حذف ویژگی');
    }
  };

  // ===== افزودن رنگ به محصول =====
  const addColor = async (colorId) => {
    try {
      await api.post(`/admin/products/${productId}/colors`, {
        attributeValueId: colorId,
      });
      setSelectedColors(prev => [...prev, colorId]);
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
    } catch (error) {
      toast.error('خطا در افزودن رنگ');
    }
  };

  // ===== حذف رنگ از محصول =====
  const removeColor = async (colorId) => {
    if (!window.confirm('آیا از حذف این رنگ مطمئن هستید؟')) return;
    try {
      await api.delete(`/admin/products/${productId}/colors/${colorId}`);
      setSelectedColors(prev => prev.filter(id => id !== colorId));
      toast.success('رنگ حذف شد');
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
    } catch (error) {
      toast.error('خطا در حذف رنگ');
    }
  };

  // ===== به‌روزرسانی ترکیبات =====
  const refreshVariations = async () => {
    try {
      const varRes = await api.get(`/products/${productId}/variations`);
      if (varRes.data.success) {
        setVariations(varRes.data.data);
      }
    } catch (error) {
      console.error('خطا در به‌روزرسانی ترکیبات:', error);
    }
  };

  // ===== ایجاد همه ترکیبات =====
  const createAllVariations = async () => {
    const allAttributes = {};

    // رنگ‌ها (با کلید 1)
    if (selectedColors.length > 0) {
      allAttributes[1] = selectedColors;
    }

    // ویژگی‌های اختصاصی
    for (const [name, values] of Object.entries(customAttributes)) {
      if (values && values.length > 0) {
        allAttributes[name] = values;
      }
    }

    const typeKeys = Object.keys(allAttributes);
    if (typeKeys.length < 2) {
      toast.error('حداقل دو نوع ویژگی (مثلاً رنگ + یک ویژگی دیگر) را انتخاب کنید');
      return;
    }

    const combinations = cartesianProduct(
      typeKeys.map(key => allAttributes[key].map(value => ({ key, value })))
    );

    try {
      const promises = combinations.map(combo => {
        const payload = {};
        combo.forEach(({ key, value }) => {
          payload[key] = value;
        });
        return api.post(`/admin/products/${productId}/variations/dynamic`, payload);
      });
      await Promise.all(promises);
      toast.success('همه ترکیبات با موفقیت ایجاد شدند');
      await refreshVariations();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ایجاد ترکیبات');
    }
  };

  const cartesianProduct = (arrays) => {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return arrays[0].map(item => [item]);
    const result = [];
    const rest = cartesianProduct(arrays.slice(1));
    arrays[0].forEach(item => {
      rest.forEach(restItems => {
        result.push([item, ...restItems]);
      });
    });
    return result;
  };

  // ===== رندر =====
  if (loading) return <Spinner size="sm" />;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
      <h4 className="font-bold text-gray-800 mb-4">🎨 ویژگی‌های محصول</h4>

      {/* ===== رنگ‌ها (پیش‌فرض) ===== */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">رنگ‌ها</label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => {
            const isSelected = selectedColors.includes(color.id);
            return (
              <button
                key={color.id}
                onClick={() =>
                  isSelected
                    ? removeColor(color.id)
                    : addColor(color.id)
                }
                className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition hover:shadow-md ${
                  isSelected
                    ? 'border-[#800E2F] bg-[#800E2F]/10'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: color.color_code || '#cccccc' }}
                />
                <span className="text-xs text-gray-600">{color.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== ویژگی‌های اختصاصی ===== */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ویژگی‌های اختصاصی (اختیاری)
        </label>
        
        {Object.keys(customAttributes).length > 0 ? (
          <div className="space-y-2 mb-3">
            {Object.entries(customAttributes).map(([name, values]) => (
              <div key={name} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                <div>
                  <span className="font-medium text-gray-800">{name}</span>
                  <span className="text-xs text-gray-400 mr-2">({values.join('، ')})</span>
                </div>
                <button
                  onClick={() => handleRemoveCustomAttribute(name)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-3">هیچ ویژگی اختصاصی تعریف نشده است.</p>
        )}

        <form onSubmit={handleAddCustomAttribute} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نام ویژگی</label>
            <input
              type="text"
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              placeholder="مثلاً رم یا سایز"
              className="w-32 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#800E2F]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">مقادیر (با کاما جدا کنید)</label>
            <input
              type="text"
              value={newAttrValues}
              onChange={(e) => setNewAttrValues(e.target.value)}
              placeholder="مثلاً 8GB, 16GB"
              className="w-48 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#800E2F]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={addingAttr}
            className="px-3 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50"
          >
            {addingAttr ? '...' : '➕ افزودن ویژگی'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-1">ویژگی‌های اختصاصی فقط برای همین محصول معتبر هستند.</p>
      </div>

      {/* ===== دکمه ایجاد ترکیبات ===== */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={createAllVariations}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
        >
          🔄 ایجاد همه ترکیبات
        </button>
      </div>

      {/* ===== نمایش ترکیبات موجود ===== */}
      {variations.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">ترکیبات موجود</label>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-xs">
                  <th className="text-right py-1 px-2">رنگ</th>
                  {Object.keys(customAttributes).map(name => (
                    <th key={name} className="text-right py-1 px-2">{name}</th>
                  ))}
                  <th className="text-right py-1 px-2">قیمت</th>
                  <th className="text-right py-1 px-2">موجودی</th>
                  <th className="text-right py-1 px-2">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {variations.map((v) => {
                  const attrValues = v.attribute_values || {};
                  const colorId = attrValues[1];
                  const colorName = colors.find(c => c.id === colorId)?.value || '—';
                  
                  return (
                    <tr key={v.id} className="border-b border-gray-100">
                      <td className="py-1 px-2">{colorName}</td>
                      {Object.keys(customAttributes).map(name => {
                        const val = attrValues[name] || '—';
                        return (
                          <td key={name} className="py-1 px-2">{val}</td>
                        );
                      })}
                      <td className="py-1 px-2">{v.price ? `${v.price.toLocaleString()} ت` : '—'}</td>
                      <td className="py-1 px-2">{v.stock}</td>
                      <td className="py-1 px-2">
                        <button
                          onClick={() => {
                            toast.info('ویرایش ترکیب در حال توسعه است');
                          }}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                        >
                          ✏️ ویرایش
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductAttributes;