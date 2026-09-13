// src/components/product/VariationSelector.jsx
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const cleanValue = (value) => {
  if (!value) return value;
  return value.replace(/\s*\(\d+\)\s*$/, '').trim();
};

function VariationSelector({ productId, onSelectionChange, onAttributesLoaded }) {
  const [loading, setLoading] = useState(true);
  const [variations, setVariations] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [error, setError] = useState(null);
  const [attributeKeys, setAttributeKeys] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [hasVariations, setHasVariations] = useState(false);

  const containerRef = useRef(null);
  const hasLoaded = useRef(false);

  const resetToDefault = () => {
    if (variations.length === 0) return;
    const first = variations[0];
    const defaultAttrs = first.attribute_values || {};
    setSelectedValues(defaultAttrs);
    setSelectedVariation(first);
    if (onSelectionChange) {
      onSelectionChange({
        selectedValues: defaultAttrs,
        variation: first,
        hasVariations: true,
      });
    }
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    if (!productId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const colorsRes = await api.get('/colors');
        const colors = colorsRes.data.data || [];
        const colorMapObj = {};
        colors.forEach(c => { colorMapObj[c.id] = c; });
        setColorMap(colorMapObj);

        let allVariations = [];
        try {
          const varRes = await api.get(`/products/${productId}/variations`);
          if (varRes.data.success) {
            allVariations = varRes.data.data || [];
          }
        } catch (err) {
          allVariations = [];
        }

        setVariations(allVariations);

        if (allVariations.length === 0) {
          setHasVariations(false);
          setLoading(false);
          if (onAttributesLoaded) {
            onAttributesLoaded({ types: [], valuesMap: {}, variations: [] });
          }
          if (onSelectionChange) {
            onSelectionChange({ selectedValues: {}, variation: null, hasVariations: false });
          }
          return;
        }

        setHasVariations(true);

        const firstAttrs = allVariations[0]?.attribute_values || {};
        const keys = Object.keys(firstAttrs).filter(k => k !== '1');
        setAttributeKeys(keys);

        const firstAvailable = allVariations[0];
        const defaultAttrs = firstAvailable.attribute_values || {};
        setSelectedValues(defaultAttrs);
        setSelectedVariation(firstAvailable);

        if (onSelectionChange) {
          onSelectionChange({
            selectedValues: defaultAttrs,
            variation: firstAvailable,
            hasVariations: true,
          });
        }

        if (onAttributesLoaded) {
          onAttributesLoaded({
            types: [],
            valuesMap: {},
            variations: allVariations,
          });
        }

        setLoading(false);
        hasLoaded.current = true;
      } catch (err) {
        console.error('❌ خطا در دریافت ترکیبات:', err);
        setHasVariations(false);
        setLoading(false);
        if (onSelectionChange) {
          onSelectionChange({ selectedValues: {}, variation: null, hasVariations: false });
        }
      }
    };

    fetchData();
  }, [productId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        resetToDefault();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variations]);

  const handleValueSelect = (key, value) => {
    const newSelected = { ...selectedValues, [key]: value };
    setSelectedValues(newSelected);

    const matched = variations.find(v => {
      const attrs = v.attribute_values || {};
      for (const [k, v] of Object.entries(newSelected)) {
        if (attrs[k] !== v) return false;
      }
      return true;
    });

    setSelectedVariation(matched || null);

    if (onSelectionChange) {
      onSelectionChange({
        selectedValues: newSelected,
        variation: matched || null,
        hasVariations: true,
      });
    }
  };

  const getAvailableValuesFor = (key) => {
    const values = new Set();
    variations.forEach(v => {
      const attrs = v.attribute_values || {};
      let match = true;
      for (const [k, val] of Object.entries(selectedValues)) {
        if (k === key) continue;
        if (attrs[k] !== val) {
          match = false;
          break;
        }
      }
      if (match && attrs[key]) {
        values.add(attrs[key]);
      }
    });
    return Array.from(values);
  };

  const isComplete = () => {
    const allKeys = ['1', ...attributeKeys];
    for (const key of allKeys) {
      if (!selectedValues[key]) return false;
    }
    return true;
  };

  const matchedVariation = variations.find(v => {
    const attrs = v.attribute_values || {};
    for (const [k, val] of Object.entries(selectedValues)) {
      if (attrs[k] !== val) return false;
    }
    return true;
  });

  // ✅ اصلاح: استخراج رنگ‌ها با پشتیبانی از color_code سفارشی
  const colorItems = [];
  const seenColors = new Set();

  variations.forEach(v => {
    const attrs = v.attribute_values || {};
    let colorValue = attrs['1'];
    if (!colorValue) return;

    // ✅ استخراج color_code از attribute_values_json (برای رنگ‌های سفارشی)
    let colorCode = v.color_code || null;
    if (!colorCode && attrs['_color_code']) {
      colorCode = attrs['_color_code'];
    }

    if (v.color_value_id && colorMap[v.color_value_id]) {
      const color = colorMap[v.color_value_id];
      if (!seenColors.has(color.id)) {
        seenColors.add(color.id);
        colorItems.push({
          id: color.id,
          value: color.value,
          color_code: color.color_code || colorCode || '#cccccc',
          isCustom: false,
          stock: v.stock || 0,
        });
      }
    } else {
      const colorName = String(colorValue);
      if (!seenColors.has(colorName)) {
        seenColors.add(colorName);
        colorItems.push({
          id: colorName,
          value: colorName,
          color_code: colorCode || '#cccccc',
          isCustom: true,
          stock: v.stock || 0,
        });
      }
    }
  });

  const firstAttrs = variations[0]?.attribute_values || {};
  const attrKeys = Object.keys(firstAttrs).filter(k => k !== '1');

  const isColorSelected = (colorId, colorValue) => {
    const selected = selectedValues['1'];
    if (selected === undefined || selected === null) return false;
    return String(selected) === String(colorId) || String(selected) === String(colorValue);
  };

  if (loading) return <div className="text-sm text-gray-400">در حال بارگذاری ترکیبات...</div>;
  if (!hasVariations) return null;
  if (variations.length === 0) return null;

  const effectiveVariation = matchedVariation || variations[0];

  return (
    <div ref={containerRef} className="space-y-4">
      {colorItems.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رنگ:{' '}
            <span className="font-normal text-gray-500">
              {selectedValues[1] ? cleanValue(selectedValues[1]) : 'انتخاب کنید'}
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            {colorItems.map((color) => {
              const colorId = color.id;
              const colorValue = color.value;
              const isSelected = isColorSelected(colorId, colorValue);
              const isAvailable = getAvailableValuesFor('1').includes(colorId) || getAvailableValuesFor('1').includes(colorValue);
              const isOutOfStock = color.stock === 0;

              return (
                <button
                  key={color.id}
                  onClick={() => handleValueSelect('1', colorId)}
                  disabled={!isAvailable}
                  className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition hover:shadow-md ${
                    isSelected
                      ? 'border-[#800E2F] bg-[#800E2F]/10'
                      : isAvailable
                      ? 'border-transparent hover:border-gray-300'
                      : 'opacity-40 cursor-not-allowed border-gray-200'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
                    style={{ backgroundColor: color.color_code || '#cccccc' }}
                  />
                  <span className="text-xs text-gray-600">{cleanValue(color.value)}</span>
                  {color.isCustom && (
                    <span className="text-[8px] text-blue-500 bg-blue-50 px-1 rounded-full">سفارشی</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {attrKeys.map((key) => {
        const availableValues = getAvailableValuesFor(key);
        const selectedValue = selectedValues[key];
        const attrName = cleanValue(key);

        return (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {attrName}:{' '}
              <span className="font-normal text-gray-500">
                {selectedValue ? cleanValue(selectedValue) : 'انتخاب کنید'}
              </span>
            </label>
            <div className="flex flex-wrap gap-3">
              {availableValues.map((val) => {
                const isSelected = selectedValue === val;
                const displayVal = cleanValue(val);
                const matchedVar = variations.find(v => {
                  const attrs = v.attribute_values || {};
                  const tempSelected = { ...selectedValues, [key]: val };
                  for (const [k, v] of Object.entries(tempSelected)) {
                    if (attrs[k] !== v) return false;
                  }
                  return true;
                });
                const isOutOfStock = matchedVar && matchedVar.stock === 0;

                return (
                  <button
                    key={val}
                    onClick={() => handleValueSelect(key, val)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition hover:shadow-md ${
                      isSelected
                        ? 'bg-[#800E2F] text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {displayVal}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {!isComplete() && (
        <div className="text-sm text-orange-600 mt-2">
          لطفاً همه ویژگی‌ها را انتخاب کنید.
        </div>
      )}

      {isComplete() && (
        <>
          {matchedVariation ? (
            <div className={`text-sm p-2 rounded-lg border ${
              matchedVariation.stock === 0
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={matchedVariation.stock === 0 ? 'text-red-600' : 'text-green-600'}>
                  {matchedVariation.stock === 0 ? '❌ ترکیب انتخاب‌شده موجود نیست.' : '✅ ترکیب انتخاب‌شده موجود است.'}
                </span>
                {matchedVariation.stock > 0 && (
                  <span className="text-green-600 font-medium">موجودی: {matchedVariation.stock.toLocaleString('fa-IR')} عدد</span>
                )}
                {matchedVariation.stock === 0 && (
                  <span className="text-red-500 font-medium">⚠️ ناموجود</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              ❌ محصول با این ویژگی موجود نیست.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VariationSelector;