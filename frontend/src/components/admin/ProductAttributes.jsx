// src/components/admin/ProductAttributes.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    api.get(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('درخواست timeout شد')), timeout)
    )
  ]);
};

function ProductAttributes({ productId, onAttributesChange }) {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [customColors, setCustomColors] = useState([]);
  const [customAttributes, setCustomAttributes] = useState({});
  const [selectedCustomValues, setSelectedCustomValues] = useState({});
  const [variations, setVariations] = useState([]);
  const [error, setError] = useState(null);

  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorCode, setCustomColorCode] = useState('#800E2F');

  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState([]);
  const [currentValue, setCurrentValue] = useState('');
  const [addingAttr, setAddingAttr] = useState(false);

  const [editingAttr, setEditingAttr] = useState(null);
  const [editingValues, setEditingValues] = useState([]);
  const [editNewValue, setEditNewValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [editingVariation, setEditingVariation] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editingLoading, setEditingLoading] = useState(false);

  // ===== حذف stateهای مربوط به افزودن ترکیب =====
  // const [newVariationAttrs, setNewVariationAttrs] = useState({});
  // const [newVariationStock, setNewVariationStock] = useState('');
  // const [newVariationPrice, setNewVariationPrice] = useState('');
  // const [showAddVariationForm, setShowAddVariationForm] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setError('شناسه محصول موجود نیست');
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ۱. دریافت رنگ‌های عمومی
        let colorsData = [];
        try {
          const colorsRes = await fetchWithTimeout('/colors', {}, 8000);
          if (colorsRes.data.success) {
            colorsData = colorsRes.data.data || [];
          }
        } catch (colorErr) {
          console.error('❌ [ProductAttributes] خطا در دریافت رنگ‌ها:', colorErr.message);
        }
        if (isMounted) setColors(colorsData);

        // ۲. دریافت ویژگی‌های اختصاصی محصول
        let customData = {};
        try {
          const customRes = await fetchWithTimeout(`/products/${productId}/custom-attributes`, {}, 8000);
          if (customRes.data.success) {
            customData = customRes.data.data || {};
            console.log('🔍 [ProductAttributes] customData دریافتی از سرور:', customData);

            if (customData.colors) {
              const colorIds = customData.colors.map(c => c.id);
              if (isMounted) setSelectedColors(colorIds);
            }

            if (customData.custom) {
              const filteredCustom = {};
              const unwantedKeys = ['_color_code', '1'];
              Object.keys(customData.custom).forEach(key => {
                if (!unwantedKeys.includes(key)) {
                  filteredCustom[key] = customData.custom[key];
                }
              });
              console.log('✅ [ProductAttributes] filteredCustom نهایی:', filteredCustom);
              if (isMounted) setCustomAttributes(filteredCustom);

              const filteredSelections = {};
              Object.keys(filteredCustom).forEach(key => {
                filteredSelections[key] = filteredCustom[key].map(v => v);
              });
              if (isMounted) setSelectedCustomValues(filteredSelections);
            }
          }
        } catch (customErr) {
          console.warn('⚠️ [ProductAttributes] خطا در دریافت custom-attributes:', customErr.message);
        }

        // ۳. دریافت ترکیبات محصول
        let variationsData = [];
        try {
          const varRes = await fetchWithTimeout(`/products/${productId}/variations`, {}, 8000);
          if (varRes.data.success) {
            variationsData = varRes.data.data || [];
          }
        } catch (varErr) {
          console.error('❌ [ProductAttributes] خطا در دریافت ترکیبات:', varErr.message);
        }

        // ۴. استخراج رنگ‌های سفارشی از ترکیبات
        const customColorsFromVariations = [];
        variationsData.forEach(v => {
          const attrs = v.attribute_values || {};
          if (attrs['1'] && !v.color_value_id) {
            const colorValue = attrs['1'];
            const isGlobal = colorsData.some(c => c.value === colorValue || c.id === parseInt(colorValue));
            if (!isGlobal && !customColorsFromVariations.some(c => c.value === colorValue)) {
              customColorsFromVariations.push({
                id: -Date.now() - Math.random() * 1000,
                value: colorValue,
                color_code: v.color_code || '#cccccc',
                isCustom: true,
              });
            }
          }
        });
        if (isMounted) setCustomColors(customColorsFromVariations);
        const customColorIds = customColorsFromVariations.map(c => c.id);
        if (isMounted) {
          setSelectedColors(prev => {
            const filtered = prev.filter(id => !customColorIds.includes(id));
            return [...filtered, ...customColorIds];
          });
        }

        if (isMounted) setVariations(variationsData);
        if (isMounted) setLoading(false);
      } catch (error) {
        console.error('❌ [ProductAttributes] خطای غیرمنتظره:', error);
        if (isMounted) {
          setError('خطا در دریافت اطلاعات ویژگی‌ها');
          toast.error('خطا در دریافت اطلاعات ویژگی‌ها');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const refreshVariations = async () => {
    console.log('🔄 [refreshVariations] شروع...');
    try {
      const timestamp = Date.now();
      const varRes = await api.get(`/products/${productId}/variations?_t=${timestamp}`);
      if (varRes.data.success) {
        setVariations(varRes.data.data || []);
        console.log('✅ [refreshVariations] ترکیبات به‌روزرسانی شد:', varRes.data.data);
      }
    } catch (error) {
      console.error('❌ خطا در دریافت ترکیبات:', error);
      toast.error('خطا در به‌روزرسانی ترکیبات');
    }
  };

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) {
      toast.error('لطفاً نام رنگ را وارد کنید');
      return;
    }
    if (!customColorCode) {
      toast.error('لطفاً کد رنگ را انتخاب کنید');
      return;
    }

    const exists = colors.some(c => c.value === customColorName.trim() || c.color_code === customColorCode);
    if (exists) {
      toast.error('این رنگ قبلاً در لیست رنگ‌های عمومی وجود دارد');
      return;
    }
    const existsCustom = customColors.some(c => c.value === customColorName.trim() || c.color_code === customColorCode);
    if (existsCustom) {
      toast.error('این رنگ قبلاً به عنوان رنگ سفارشی اضافه شده است');
      return;
    }

    const newColor = {
      id: -Date.now() - Math.random() * 1000,
      value: customColorName.trim(),
      color_code: customColorCode,
      isCustom: true,
    };

    setCustomColors(prev => [...prev, newColor]);
    setSelectedColors(prev => [...prev, newColor.id]);

    setCustomColorName('');
    setCustomColorCode('#800E2F');
    setShowCustomColorPicker(false);
    toast.success(`رنگ "${newColor.value}" با موفقیت اضافه شد`);
  };

  const handleRemoveCustomColor = (colorId) => {
    if (!window.confirm('آیا از حذف این رنگ سفارشی مطمئن هستید؟')) return;
    setCustomColors(prev => prev.filter(c => c.id !== colorId));
    setSelectedColors(prev => prev.filter(id => id !== colorId));
    toast.success('رنگ سفارشی حذف شد');
  };

  const addValueToNewAttr = () => {
    const trimmed = currentValue.trim();
    if (!trimmed) {
      toast.error('لطفاً یک مقدار وارد کنید');
      return;
    }
    if (newAttrValues.includes(trimmed)) {
      toast.error('این مقدار قبلاً اضافه شده است');
      return;
    }
    setNewAttrValues([...newAttrValues, trimmed]);
    setCurrentValue('');
  };

  const removeValueFromNewAttr = (value) => {
    setNewAttrValues(newAttrValues.filter(v => v !== value));
  };

  const handleAddCustomAttribute = async (e) => {
    e.preventDefault();

    if (!newAttrName.trim()) {
      toast.error('نام ویژگی را وارد کنید');
      return;
    }
    if (newAttrValues.length === 0) {
      toast.error('حداقل یک مقدار برای ویژگی وارد کنید');
      return;
    }

    setAddingAttr(true);
    try {
      const updatedAttrs = {
        ...customAttributes,
        [newAttrName.trim()]: newAttrValues,
      };

      await api.put(`/admin/products/${productId}/custom-attributes`, {
        custom_attributes: updatedAttrs,
      });

      setCustomAttributes(updatedAttrs);
      setSelectedCustomValues(prev => ({
        ...prev,
        [newAttrName.trim()]: newAttrValues.map(v => v),
      }));
      setNewAttrName('');
      setNewAttrValues([]);
      setCurrentValue('');
      toast.success(`ویژگی "${newAttrName}" با موفقیت اضافه شد`);
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
    } catch (error) {
      toast.error('خطا در افزودن ویژگی');
    } finally {
      setAddingAttr(false);
    }
  };

  const startEditAttribute = (attrName) => {
    setEditingAttr(attrName);
    setEditingValues([...customAttributes[attrName]]);
    setEditNewValue('');
  };

  const cancelEditAttribute = () => {
    setEditingAttr(null);
    setEditingValues([]);
    setEditNewValue('');
  };

  const addValueToEdit = () => {
    const trimmed = editNewValue.trim();
    if (!trimmed) {
      toast.error('لطفاً یک مقدار وارد کنید');
      return;
    }
    if (editingValues.includes(trimmed)) {
      toast.error('این مقدار قبلاً اضافه شده است');
      return;
    }
    setEditingValues([...editingValues, trimmed]);
    setEditNewValue('');
  };

  const removeValueFromEdit = (value) => {
    setEditingValues(editingValues.filter(v => v !== value));
  };

  const saveEditedAttribute = async () => {
    if (editingValues.length === 0) {
      toast.error('حداقل یک مقدار برای ویژگی باید وجود داشته باشد');
      return;
    }

    setSavingEdit(true);
    try {
      const updatedAttrs = {
        ...customAttributes,
        [editingAttr]: editingValues,
      };

      await api.put(`/admin/products/${productId}/custom-attributes`, {
        custom_attributes: updatedAttrs,
      });

      setCustomAttributes(updatedAttrs);
      setSelectedCustomValues(prev => ({
        ...prev,
        [editingAttr]: editingValues,
      }));
      toast.success(`ویژگی "${editingAttr}" با موفقیت ویرایش شد`);
      setEditingAttr(null);
      setEditingValues([]);
      setEditNewValue('');
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
    } catch (error) {
      toast.error('خطا در ویرایش ویژگی');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveCustomAttribute = async (attrName) => {
    if (!window.confirm(`آیا از حذف ویژگی "${attrName}" مطمئن هستید؟`)) return;
    try {
      const updatedAttrs = { ...customAttributes };
      delete updatedAttrs[attrName];

      await api.put(`/admin/products/${productId}/custom-attributes`, {
        custom_attributes: updatedAttrs,
      });

      setCustomAttributes(updatedAttrs);
      const newSelections = { ...selectedCustomValues };
      delete newSelections[attrName];
      setSelectedCustomValues(newSelections);

      toast.success(`ویژگی "${attrName}" حذف شد`);
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
    } catch (error) {
      toast.error('خطا در حذف ویژگی');
    }
  };

  const toggleCustomValue = (attrName, value) => {
    setSelectedCustomValues(prev => {
      const currentSelected = prev[attrName] || [];
      if (currentSelected.includes(value)) {
        return {
          ...prev,
          [attrName]: currentSelected.filter(v => v !== value),
        };
      } else {
        return {
          ...prev,
          [attrName]: [...currentSelected, value],
        };
      }
    });
  };

  const addColor = async (colorId) => {
    const isCustom = customColors.some(c => c.id === colorId);
    if (isCustom) {
      setSelectedColors(prev => [...prev, colorId]);
      if (onAttributesChange) onAttributesChange();
      await refreshVariations();
      return;
    }

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

  const removeColor = async (colorId) => {
    const isCustom = customColors.some(c => c.id === colorId);
    if (isCustom) {
      handleRemoveCustomColor(colorId);
      return;
    }

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

  // ===== حذف تابع handleAddVariation =====
  // const handleAddVariation = async () => { ... }

  // ===== ✅ نگه‌داشتن تابع createAllVariations =====
  const createAllVariations = async () => {
    console.log('🚀 [createAllVariations] شروع ایجاد ترکیبات...');

    const allAttributes = {};

    if (selectedColors.length > 0) {
      allAttributes[1] = selectedColors;
    }

    for (const [name, values] of Object.entries(selectedCustomValues)) {
      if (values && values.length > 0) {
        allAttributes[name] = values;
      }
    }

    const typeKeys = Object.keys(allAttributes);
    console.log('📋 [createAllVariations] ویژگی‌های انتخاب‌شده:', typeKeys);

    if (typeKeys.length < 1) {
      toast.error('حداقل یک ویژگی (مثلاً رنگ) را انتخاب کنید');
      return;
    }

    const combinations = cartesianProduct(
      typeKeys.map(key => allAttributes[key].map(value => ({ key, value })))
    );

    console.log('📊 [createAllVariations] تعداد ترکیبات ممکن:', combinations.length);

    if (combinations.length === 0) {
      toast.error('هیچ ترکیبی برای ایجاد وجود ندارد');
      return;
    }

    const existingVariations = variations.map(v => v.attribute_values || {});
    const existingJson = existingVariations.map(v => JSON.stringify(v));

    const newCombinations = combinations.filter(combo => {
      const payload = {};
      combo.forEach(({ key, value }) => {
        if (key === '1' && value < 0) {
          const color = customColors.find(c => c.id === value);
          if (color) {
            payload[key] = color.value;
            payload['_color_code'] = color.color_code;
          } else {
            payload[key] = 'سفارشی';
          }
        } else {
          payload[key] = value;
        }
      });
      const payloadJson = JSON.stringify(payload);
      return !existingJson.includes(payloadJson);
    });

    console.log('🆕 [createAllVariations] ترکیبات جدید:', newCombinations);

    if (newCombinations.length === 0) {
      toast.error('همه ترکیبات از قبل وجود دارند!');
      return;
    }

    toast.success(`${newCombinations.length} ترکیب جدید در حال ایجاد...`);

    try {
      const promises = newCombinations.map(async (combo) => {
        const payload = {};
        combo.forEach(({ key, value }) => {
          if (key === '1' && value < 0) {
            const color = customColors.find(c => c.id === value);
            if (color) {
              payload[key] = color.value;
              payload['_color_code'] = color.color_code;
            } else {
              payload[key] = 'سفارشی';
            }
          } else {
            payload[key] = value;
          }
        });

        const data = {
          ...payload,
          stock: 0,
          price: 0
        };

        console.log('📤 [createAllVariations] ارسال داده:', data);

        try {
          const response = await api.post(`/admin/products/${productId}/variations/dynamic`, data);
          console.log('✅ پاسخ سرور:', response.data);
          return response;
        } catch (err) {
          console.error('❌ خطا در ارسال درخواست:', err.response?.data || err.message);
          throw err;
        }
      });

      console.log(`⏳ [createAllVariations] ارسال ${promises.length} درخواست...`);
      await Promise.all(promises);
      console.log('✅ [createAllVariations] همه ترکیبات با موفقیت ایجاد شدند');

      toast.success(`✅ ${newCombinations.length} ترکیب جدید با موفقیت ایجاد شد`);

      console.log('🔄 [createAllVariations] در حال به‌روزرسانی لیست ترکیبات...');
      await refreshVariations();
      console.log('✅ [createAllVariations] لیست ترکیبات به‌روزرسانی شد');

      if (onAttributesChange) onAttributesChange();
    } catch (error) {
      console.error('❌ [createAllVariations] خطا در ایجاد ترکیبات:', error);
      toast.error(error.response?.data?.message || 'خطا در ایجاد ترکیبات');
    }
  };

  // تابع کمکی برای ایجاد همه ترکیبات
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

  const startEditVariation = (variation) => {
    setEditingVariation(variation);
    setEditPrice(variation.price || '');
    setEditStock(variation.stock || '');
    setEditSku(variation.sku || '');
  };

  const saveEditVariation = async () => {
    if (!editingVariation) return;

    const price = parseFloat(editPrice);
    if (isNaN(price) && editPrice !== '') {
      toast.error('قیمت نامعتبر است');
      return;
    }

    const stock = parseInt(editStock);
    if (isNaN(stock) && editStock !== '') {
      toast.error('موجودی نامعتبر است');
      return;
    }

    setEditingLoading(true);
    try {
      await api.put(`/admin/variations/${editingVariation.id}`, {
        price: editPrice !== '' ? price : null,
        stock: editStock !== '' ? stock : 0,
        sku: editSku || null,
      });
      toast.success('ترکیب با موفقیت ویرایش شد');
      setEditingVariation(null);
      await refreshVariations();
      if (onAttributesChange) onAttributesChange();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در ویرایش ترکیب');
    } finally {
      setEditingLoading(false);
    }
  };

  const handleDeleteVariation = async (variationId) => {
    if (!window.confirm('آیا از حذف این ترکیب مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) return;
    try {
      await api.delete(`/admin/variations/${variationId}`);
      toast.success('ترکیب با موفقیت حذف شد');
      await refreshVariations();
      if (onAttributesChange) onAttributesChange();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در حذف ترکیب');
    }
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl p-8 bg-gray-50/50 flex justify-center items-center min-h-[200px]">
        <Spinner size="md" />
        <span className="mr-3 text-gray-500">در حال بارگذاری ویژگی‌ها...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 rounded-xl p-4 bg-red-50 text-red-600">
        <p className="font-bold">⚠️ خطا</p>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  const allColors = [...colors, ...customColors];
  const isCustomColor = (colorId) => customColors.some(c => c.id === colorId);

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
      <h4 className="font-bold text-gray-800 mb-4">🎨 ویژگی‌های محصول</h4>

      {/* ===== رنگ‌ها ===== */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">رنگ‌ها</label>
          <button
            onClick={() => setShowCustomColorPicker(true)}
            className="text-xs bg-[#800E2F] text-white px-2.5 py-1 rounded-lg hover:bg-[#6B0A26] transition"
          >
            ➕ افزودن رنگ سفارشی
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {allColors.length === 0 ? (
            <p className="text-sm text-gray-400">هیچ رنگی یافت نشد</p>
          ) : (
            allColors.map((color) => {
              const isSelected = selectedColors.includes(color.id);
              const isCustom = isCustomColor(color.id);

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
            })
          )}
        </div>
      </div>

      {/* ===== مودال افزودن رنگ سفارشی ===== */}
      <Modal
        isOpen={showCustomColorPicker}
        onClose={() => setShowCustomColorPicker(false)}
        title="🎨 افزودن رنگ سفارشی"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام رنگ *</label>
            <input
              type="text"
              value={customColorName}
              onChange={(e) => setCustomColorName(e.target.value)}
              placeholder="مثلاً نارنجی سوخته"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">کد رنگ (HEX) *</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColorCode}
                onChange={(e) => setCustomColorCode(e.target.value)}
                className="w-12 h-12 p-1 border rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={customColorCode}
                onChange={(e) => setCustomColorCode(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F] font-mono text-sm"
                placeholder="#800E2F"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">مقدار HEX را وارد کنید (مثلاً #FF5733)</p>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <Button
              variant="primary"
              onClick={handleAddCustomColor}
              className="flex-1"
            >
              ✅ افزودن رنگ
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCustomColorPicker(false)}
              className="flex-1"
            >
              انصراف
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== ویژگی‌های اختصاصی (با فیلتر کامل) ===== */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ویژگی‌های اختصاصی (اختیاری)
        </label>

        {Object.keys(customAttributes).length > 0 ? (
          <div className="space-y-4 mb-3">
            {Object.keys(customAttributes).map((name) => {
              const selected = selectedCustomValues[name] || [];
              const isEditing = editingAttr === name;
              const values = customAttributes[name] || [];

              return (
                <div key={name} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditAttribute(name)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        ✏️ ویرایش مقادیر
                      </button>
                      <button
                        onClick={() => handleRemoveCustomAttribute(name)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕ حذف ویژگی
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-2 border-t pt-2">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {editingValues.map((val) => (
                          <span
                            key={val}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700 border border-gray-300"
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => removeValueFromEdit(val)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editNewValue}
                          onChange={(e) => setEditNewValue(e.target.value)}
                          placeholder="مقدار جدید..."
                          className="flex-1 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#800E2F]"
                          onKeyDown={(e) => e.key === 'Enter' && addValueToEdit()}
                        />
                        <button
                          type="button"
                          onClick={addValueToEdit}
                          className="px-3 py-1.5 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
                        >
                          ➕
                        </button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={saveEditedAttribute}
                          disabled={savingEdit}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          {savingEdit ? 'در حال ذخیره...' : '💾 ذخیره تغییرات'}
                        </button>
                        <button
                          onClick={cancelEditAttribute}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                        >
                          انصراف
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        برای هر مقدار، یک دکمه انتخاب در پایین ایجاد می‌شود.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const isSelected = selected.includes(val);
                        return (
                          <button
                            key={val}
                            onClick={() => toggleCustomValue(name, val)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition hover:shadow-md ${
                              isSelected
                                ? 'bg-[#800E2F] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-3">هیچ ویژگی اختصاصی تعریف نشده است.</p>
        )}

        {/* فرم افزودن ویژگی جدید */}
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">➕ افزودن ویژگی جدید</p>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">نام ویژگی</label>
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                placeholder="مثلاً رم یا سایز"
                className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">مقدار جدید</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addValueToNewAttr()}
                  placeholder="مثلاً 8GB"
                  className="flex-1 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#800E2F]"
                />
                <button
                  type="button"
                  onClick={addValueToNewAttr}
                  className="px-3 py-1.5 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
                >
                  ➕
                </button>
              </div>
            </div>
          </div>

          {newAttrValues.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {newAttrValues.map((val, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700 border border-gray-300"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeValueFromNewAttr(val)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddCustomAttribute}
            disabled={addingAttr || !newAttrName.trim() || newAttrValues.length === 0}
            className="mt-3 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {addingAttr ? '...' : '✅ ذخیره ویژگی'}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            ابتدا نام ویژگی را وارد کنید، سپس مقادیر را یکی‌یکی اضافه کنید.
          </p>
        </div>
      </div>

      {/* ===== دکمه ایجاد همه ترکیبات (با بک‌گراند آبی/سبز) ===== */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={createAllVariations}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm hover:shadow-md"
        >
          🔄 ایجاد همه ترکیبات (با موجودی ۰ و قیمت ۰)
        </button>
      </div>

      {/* ===== نمایش ترکیبات موجود ===== */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ترکیبات موجود ({variations.length})
        </label>
        {variations.length > 0 ? (
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
                  const colorId = attrValues['1'];
                  let colorName = '—';
                  if (colorId) {
                    const foundColor = allColors.find(c => c.id === colorId || c.value === colorId);
                    if (foundColor) {
                      colorName = foundColor.value;
                    } else {
                      colorName = colorId;
                    }
                  }

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
                      <td className="py-1 px-2">{v.stock || 0}</td>
                      <td className="py-1 px-2 whitespace-nowrap">
                        <button
                          onClick={() => startEditVariation(v)}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 ml-1"
                        >
                          ✏️ ویرایش
                        </button>
                        <button
                          onClick={() => handleDeleteVariation(v.id)}
                          className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100"
                        >
                          🗑️ حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
            <p>هیچ ترکیبی برای این محصول وجود ندارد.</p>
          </div>
        )}
      </div>

      {/* ===== مودال ویرایش ترکیب ===== */}
      <Modal
        isOpen={!!editingVariation}
        onClose={() => setEditingVariation(null)}
        title="✏️ ویرایش ترکیب"
        size="md"
      >
        {editingVariation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  placeholder="خالی = بدون تغییر"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">موجودی</label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                  placeholder="خالی = بدون تغییر"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (اختیاری)</label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                placeholder="کد محصول"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-600">
              <p><span className="font-medium">ترکیب فعلی:</span> {editingVariation.attribute_values && Object.entries(editingVariation.attribute_values).map(([k, v]) => {
                if (k === '1') {
                  const color = allColors.find(c => c.id === v || c.value === v);
                  return `رنگ: ${color?.value || v}`;
                }
                return `${k}: ${v}`;
              }).join(' - ')}</p>
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={saveEditVariation}
                loading={editingLoading}
                className="flex-1"
              >
                💾 ذخیره تغییرات
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingVariation(null)}
                className="flex-1"
              >
                انصراف
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ProductAttributes;