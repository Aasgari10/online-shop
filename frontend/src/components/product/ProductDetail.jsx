// src/components/product/ProductDetail.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import { formatPrice } from '../../utils/formatPrice';
import { formatJalaliDate } from '../../utils/jalaliUtils';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useProductSeo } from '../../context/ProductSeoContext';
import SocialShare from '../admin/shared/SocialShare';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();
  const { updateSeo, clearSeo } = useProductSeo();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isInWish, setIsInWish] = useState(false);
  const [colorsMap, setColorsMap] = useState({});
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      setIsLoggedIn(!!user);
      setIsAdmin(user?.role === 'admin');
    }
  }, []);

  const hasLoggedInitial = useRef(false);
  const hasInitialized = useRef(false);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    return [...Array(5)].map((_, i) => {
      if (i < fullStars) {
        return (
          <svg key={i} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        return (
          <div key={i} className="relative w-5 h-5">
            <svg className="absolute top-0 right-0 w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
            <svg className="absolute top-0 right-0 w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </div>
        );
      } else {
        return (
          <svg key={i} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    });
  };

  const cleanValue = (value) => {
    if (!value) return value;
    if (typeof value === 'string' && value.startsWith('#')) {
      return 'رنگ سفارشی';
    }
    return String(value).replace(/\s*\(\d+\)\s*$/, '').trim();
  };

  const parseAttrs = useCallback((v) => {
    if (!v.attribute_values_json) return {};
    try {
      return typeof v.attribute_values_json === 'string'
        ? JSON.parse(v.attribute_values_json)
        : v.attribute_values_json;
    } catch (e) {
      return {};
    }
  }, []);

  const findMatchingVariation = useCallback((selected) => {
    if (!product?.variations || product.variations.length === 0) return undefined;
    return product.variations.find(v => {
      const attrs = parseAttrs(v);
      for (const [key, val] of Object.entries(selected)) {
        if (key.startsWith('_')) continue;
        if (val === undefined || val === null) return false;
        if (attrs[key] === undefined || attrs[key] === null) return false;
        if (String(attrs[key]) !== String(val)) return false;
      }
      return true;
    });
  }, [product, parseAttrs]);

  const variationData = useMemo(() => {
    if (!product?.variations || product.variations.length === 0) {
      return { colorList: [], attrKeys: [], attrMap: {} };
    }

    const allAttrKeys = new Set();
    const attrMap = {};
    const colorList = [];
    const seenColors = new Set();

    product.variations.forEach((v) => {
      const attrs = parseAttrs(v);

      Object.keys(attrs).forEach(key => {
        if (key === '1') {
          let colorValue = attrs[key];
          if (!colorValue) return;

          let colorCode = v.color_code || null;
          if (!colorCode && attrs['_color_code']) {
            colorCode = attrs['_color_code'];
          }

          let displayValue = colorValue;
          if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
            colorCode = colorValue;
            const foundColor = Object.values(colorsMap).find(c => c.color_code === colorValue);
            if (foundColor) {
              displayValue = foundColor.value;
            } else {
              displayValue = 'رنگ سفارشی';
            }
          }

          const isNumeric = !isNaN(parseInt(colorValue)) && isFinite(colorValue);
          const colorId = isNumeric ? parseInt(colorValue) : colorValue;

          if (seenColors.has(colorId)) return;
          seenColors.add(colorId);

          if (isNumeric) {
            const colorInfo = colorsMap[colorId];
            if (colorInfo) {
              colorList.push({
                id: colorId,
                value: colorInfo.value,
                color_code: colorInfo.color_code || colorCode || '#cccccc',
                isCustom: false,
                stock: v.stock || 0,
              });
            } else if (v.color_name) {
              colorList.push({
                id: colorId,
                value: v.color_name,
                color_code: colorCode || '#cccccc',
                isCustom: false,
                stock: v.stock || 0,
              });
            } else {
              colorList.push({
                id: colorId,
                value: displayValue,
                color_code: colorCode || '#cccccc',
                isCustom: true,
                stock: v.stock || 0,
              });
            }
          } else {
            colorList.push({
              id: colorValue,
              value: displayValue,
              color_code: colorCode || '#cccccc',
              isCustom: true,
              stock: v.stock || 0,
            });
          }
        } else {
          if (key.startsWith('_')) {
            return;
          }
          allAttrKeys.add(key);
          if (!attrMap[key]) attrMap[key] = new Set();
          attrMap[key].add(attrs[key]);
        }
      });
    });

    return {
      colorList: colorList,
      attrKeys: Array.from(allAttrKeys),
      attrMap,
    };
  }, [product, colorsMap, parseAttrs]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setError('محصول یافت نشد');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/products/${slug}`);
        if (!res.data.success) {
          setError('محصول یافت نشد');
          setLoading(false);
          return;
        }

        const data = res.data.data;
        if (!hasLoggedInitial.current) {
          console.log('📦 [ProductDetail] محصول:', data.name, 'ID:', data.id);
          console.log('📦 [ProductDetail] ترکیبات:', data.variations?.length || 0);
          hasLoggedInitial.current = true;
        }

        setProduct(data);
        if (data.image_url) setSelectedImage(data.image_url);
        if (data.averageRating !== undefined) setAverageRating(data.averageRating);
        if (data.totalReviews !== undefined) setTotalReviews(data.totalReviews);

        try {
          const colorsRes = await api.get('/colors');
          if (colorsRes.data.success) {
            const map = {};
            colorsRes.data.data.forEach(c => {
              map[c.id] = c;
            });
            setColorsMap(map);
          }
        } catch (colorErr) {
          console.warn('⚠️ خطا در دریافت رنگ‌ها:', colorErr);
        }

        if (isLoggedIn) {
          try {
            const wishRes = await api.get(`/wishlist/check/${data.id}`);
            if (wishRes.data.success) setIsInWish(wishRes.data.inWishlist);
          } catch (wishErr) {
            console.warn('⚠️ خطا در بررسی علاقه‌مندی:', wishErr);
          }
        }

        try {
          const galleryRes = await api.get(`/products/${data.id}/images`);
          if (galleryRes.data.success) {
            setGalleryImages(galleryRes.data.data);
            if (galleryRes.data.data.length > 0 && !selectedImage) {
              setSelectedImage(galleryRes.data.data[0].image_url);
            }
          }
        } catch (galleryErr) {
          console.warn('⚠️ خطا در دریافت گالری:', galleryErr);
        }

        try {
          const reviewsRes = await api.get(`/products/${data.id}/reviews`);
          if (reviewsRes.data.success) {
            setReviews(reviewsRes.data.data.reviews || []);
            if (data.averageRating === undefined) {
              setAverageRating(reviewsRes.data.data.averageRating || 0);
              setTotalReviews(reviewsRes.data.data.totalReviews || 0);
            }
          }
        } catch (reviewErr) {
          console.warn('⚠️ خطا در دریافت نظرات:', reviewErr);
        }
      } catch (err) {
        console.error('❌ خطا در دریافت محصول:', err);
        setError('محصول مورد نظر یافت نشد');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, isLoggedIn]);

  useEffect(() => {
    if (hasInitialized.current) return;

    if (product?.variations?.length > 0 && Object.keys(selectedAttrs).length === 0) {
      const inStock = product.variations.filter(v => (v.stock || 0) > 0);
      const candidates = inStock.length > 0 ? inStock : product.variations;

      const defaultVariation = candidates.reduce((min, v) => {
        const price = parseFloat(v.final_price) || parseFloat(v.price) || 0;
        const minPrice = parseFloat(min.final_price) || parseFloat(min.price) || 0;
        return price < minPrice ? v : min;
      }, candidates[0]);

      if (defaultVariation) {
        const defaultAttrs = parseAttrs(defaultVariation);
        setSelectedAttrs(defaultAttrs);
        setSelectedVariation(defaultVariation);
        hasInitialized.current = true;
        console.log('✅ [ProductDetail] ترکیب پیش‌فرض:', defaultVariation.color_name || 'بدون رنگ');
      }
    }
  }, [product, selectedAttrs, parseAttrs]);

  useEffect(() => {
    if (selectedVariation?.image_url) {
      setSelectedImage(selectedVariation.image_url);
    }
  }, [selectedVariation]);

  useEffect(() => {
    if (product) {
      const siteName = 'HomeMart';
      updateSeo({
        title: product.meta_title || `${product.name} | ${siteName}`,
        description: product.meta_description || product.description || `خرید ${product.name} با بهترین قیمت از فروشگاه ${siteName}`,
        image: product.image_url || null,
        price: product.display_price || product.price || 0,
        inStock: (product.stock || 0) > 0,
        name: product.meta_title || product.name,
        slug: product.slug || product.id,
        brand: product.brand || null,
        sku: product.model || null,
        url: `https://aasgari.ir/product/${product.slug || product.id}`,
        rating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
      });
    }

    return () => {
      clearSeo();
    };
  }, [product, updateSeo, clearSeo]);

  const selectAttribute = (key, value) => {
    const newSelected = { ...selectedAttrs, [key]: value };
    setSelectedAttrs(newSelected);
    const matched = findMatchingVariation(newSelected);
    setSelectedVariation(matched || null);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedVariation) {
      toast.error('لطفاً یک ترکیب معتبر انتخاب کنید');
      return;
    }

    const displayPrice = selectedVariation?.final_price || selectedVariation?.price || product.display_price || product.price || 0;
    const stock = selectedVariation?.stock ?? 0;

    if (stock === 0) {
      toast.error('این ترکیب موجودی ندارد');
      return;
    }

    const finalProduct = {
      ...product,
      price: displayPrice,
      stock: stock,
      variation_id: selectedVariation?.id || null,
      color_name: selectedVariation?.color_name || null,
      size_name: selectedVariation?.size_name || null,
      attribute_values_json: selectedVariation?.attribute_values_json || null,
    };

    await addToCart(finalProduct, quantity, selectedVariation);
  };

  const changeQuantity = (delta) => {
    const newQty = quantity + delta;
    const maxStockLocal = selectedVariation?.stock ?? 0;
    if (newQty >= 1 && newQty <= maxStockLocal) {
      setQuantity(newQty);
    } else if (newQty > maxStockLocal) {
      toast.error(`موجودی کافی نیست (حداکثر ${maxStockLocal})`);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('برای ثبت نظر ابتدا وارد شوید');
      navigate('/login');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('لطفاً متن نظر را وارد کنید');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.post(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      if (res.data.success) {
        toast.success(res.data.message || 'نظر شما با موفقیت ثبت شد');
        setReviewText('');
        setReviewRating(0);
        const reviewsRes = await api.get(`/products/${product.id}/reviews`);
        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.data.reviews || []);
          setAverageRating(reviewsRes.data.data.averageRating || 0);
          setTotalReviews(reviewsRes.data.data.totalReviews || 0);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'خطا در ثبت نظر');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      toast.error('برای افزودن به علاقه‌مندی‌ها وارد شوید');
      navigate('/login');
      return;
    }
    await toggleWishlist(product);
    setIsInWish(!isInWish);
  };

  const isColorSelected = (colorId, colorValue) => {
    const selected = selectedAttrs['1'];
    if (selected === undefined || selected === null) return false;
    return String(selected) === String(colorId) || String(selected) === String(colorValue);
  };

  const filteredCustomAttributes = product?.custom_attributes ? Object.keys(product.custom_attributes)
    .filter(key => key !== '_color_code')
    .reduce((obj, key) => {
      obj[key] = product.custom_attributes[key];
      return obj;
    }, {}) : {};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center">
        <h1 className="sr-only">جزئیات محصول | فروشگاه اینترنتی HomeMart</h1>
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-16">
        <h1 className="sr-only">محصول یافت نشد | فروشگاه اینترنتی HomeMart</h1>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطا</h2>
          <p className="text-gray-600">{error || 'محصول یافت نشد'}</p>
          <Link to="/shop" className="inline-block mt-6 text-[#800E2F] hover:underline">
            بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    );
  }

  const hasVariations = product.variations && product.variations.length > 0;
  const { colorList, attrKeys, attrMap } = variationData;

  const maxStock = selectedVariation?.stock ?? 0;
  const displayPrice = selectedVariation?.final_price || selectedVariation?.price || product.display_price || product.price || 0;
  const originalPrice = selectedVariation?.original_price || product.original_price || null;
  const discountPercent = selectedVariation?.discount_percent || product.discount_percent || 0;
  const isDiscounted = discountPercent > 0 && originalPrice > displayPrice;

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-[#800E2F] transition">خانه</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#800E2F] transition">فروشگاه</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-96 md:h-[450px]">
              {selectedImage ? (
                <img
                  src={selectedImage.startsWith('http') ? selectedImage : `${selectedImage}`}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                  بدون تصویر
                </div>
              )}
            </div>
            {galleryImages.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {galleryImages.map((img, index) => {
                  const imgUrl = img.image_url.startsWith('http')
                    ? img.image_url
                    : `${img.image_url}`;
                  const isActive = img.image_url === selectedImage;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                        isActive ? 'border-[#800E2F] shadow-md' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`تصویر ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  {renderStars(averageRating)}
                </div>
                <span className="text-sm text-gray-500">
                  {averageRating.toFixed(1)} ({totalReviews} نظر)
                </span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-sm text-gray-500">موجودی: {maxStock}</span>
              </div>
            </div>

            <div className="mb-4">
              {isDiscounted && originalPrice && (
                <div className="flex items-center gap-3">
                  <span className="text-lg text-gray-400 line-through">{formatPrice(originalPrice)} ت</span>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {discountPercent}% تخفیف
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold text-[#800E2F]">{formatPrice(displayPrice)} ت</span>
                {isDiscounted && (
                  <span className="text-sm text-green-600 font-medium">قیمت ویژه</span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="mb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                <p>{product.description}</p>
              </div>
            )}

            {(product.brand || product.model || product.weight || product.dimensions) && (
              <div className="mb-4 grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                {product.brand && <div><span className="text-gray-500">برند:</span> <span className="font-medium">{product.brand}</span></div>}
                {product.model && <div><span className="text-gray-500">مدل:</span> <span className="font-medium">{product.model}</span></div>}
                {product.weight && <div><span className="text-gray-500">وزن:</span> <span className="font-medium">{product.weight}</span></div>}
                {product.dimensions && <div><span className="text-gray-500">ابعاد:</span> <span className="font-medium">{product.dimensions}</span></div>}
              </div>
            )}

            {hasVariations && (
              <div className="mb-4 space-y-4">
                {colorList.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رنگ: <span className="font-normal text-gray-500">
                        {selectedAttrs['1']
                          ? colorList.find(c => String(c.id) === String(selectedAttrs['1']) || String(c.value) === String(selectedAttrs['1']))?.value || ''
                          : ''}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {colorList.map((color) => {
                        const colorId = color.id;
                        const isSelected = isColorSelected(colorId, color.value);

                        return (
                          <button
                            key={color.id}
                            onClick={() => selectAttribute('1', colorId)}
                            className="flex flex-col items-center gap-2 transition-transform hover:scale-105"
                            title={color.value}
                          >
                            <div
                              className={`w-12 h-12 rounded-full transition-all duration-200 ${
                                isSelected
                                  ? 'border-[3px] border-[#800E2F] shadow-md scale-110'
                                  : 'border-2 border-gray-300'
                              }`}
                              style={{ backgroundColor: color.color_code || '#cccccc' }}
                            />
                            <span className={`text-xs ${isSelected ? 'text-[#800E2F] font-bold' : 'text-gray-700 font-medium'}`}>
                              {cleanValue(color.value)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {attrKeys.map((key) => {
                  const values = Array.from(attrMap[key]);
                  const selectedVal = selectedAttrs[key];
                  return (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cleanValue(key)}: <span className="font-normal text-gray-500">
                          {selectedVal !== undefined && selectedVal !== null ? cleanValue(selectedVal) : ''}
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => {
                          const isSelected = String(selectedVal) === String(val);
                          return (
                            <button
                              key={val}
                              onClick={() => selectAttribute(key, val)}
                              className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                                isSelected
                                  ? 'border-[#800E2F] bg-[#800E2F] text-white font-bold shadow-md'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#800E2F]'
                              }`}
                            >
                              {cleanValue(val)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {selectedVariation && (
                  <div className={`text-sm p-3 rounded-lg border ${
                    maxStock > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {maxStock > 0 ? `✅ موجود — ${maxStock.toLocaleString('fa-IR')} عدد` : '❌ ناموجود'}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-gray-700">تعداد:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => changeQuantity(-1)} disabled={quantity <= 1} className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition flex items-center justify-center text-lg font-bold">-</button>
                <span className="w-10 text-center font-bold text-gray-800">{quantity}</span>
                <button onClick={() => changeQuantity(1)} disabled={quantity >= maxStock} className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition flex items-center justify-center text-lg font-bold">+</button>
              </div>
              <span className="text-xs text-gray-400">موجودی: {maxStock}</span>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={handleAddToCart}
                disabled={maxStock === 0}
                className={`flex-1 py-3 rounded-xl text-white font-bold transition ${
                  maxStock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800E2F] hover:bg-[#6B0A26] hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                {maxStock === 0 ? 'ناموجود' : '🛒 افزودن به سبد خرید'}
              </button>
              <button onClick={handleToggleWishlist} className={`p-3 rounded-xl border-2 transition ${
                isInWish ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-300 hover:border-red-400 text-gray-500 hover:text-red-500'
              }`}>
                <svg className="w-6 h-6" fill={isInWish ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <SocialShare url={typeof window !== 'undefined' ? window.location.href : ''} title={`${product.name} - خرید از فروشگاه`} className="justify-center md:justify-start" />
            </div>

            {product.category_name && (
              <div className="mt-4 text-sm text-gray-500">
                دسته‌بندی: <Link to={`/shop?category=${product.category_id}`} className="text-[#800E2F] hover:underline">{product.category_name}</Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            نظرات کاربران ({totalReviews})
          </h3>

          {isLoggedIn ? (
            <form onSubmit={handleSubmitReview} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">امتیاز شما:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)} className="text-2xl transition">
                    <span className={star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                  </button>
                ))}
              </div>
              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows="3" placeholder="نظر خود را بنویسید..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white resize-y" />
              <button type="submit" disabled={submittingReview} className="mt-3 px-6 py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg font-medium transition disabled:opacity-50">
                {submittingReview ? 'در حال ارسال...' : 'ارسال نظر'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500 mb-6">برای ثبت نظر <Link to="/login" className="text-[#800E2F] hover:underline">وارد شوید</Link></p>
          )}

          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{review.user_name}</span>
                      <div className="flex items-center gap-0.5">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatJalaliDate(new Date(review.created_at))}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-2 mr-4 space-y-2 border-r-2 border-gray-200 pr-3">
                      {review.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 p-2 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-[#800E2F]">{reply.user_name}</span>
                            {reply.user_role === 'admin' && <span className="text-xs bg-[#800E2F] text-white px-2 py-0.5 rounded-full">ادمین</span>}
                            <span className="text-xs text-gray-400">{formatJalaliDate(new Date(reply.created_at))}</span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{reply.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>هنوز نظری برای این محصول ثبت نشده است.</p>
              <p className="text-xs mt-1">اولین نفری باشید که نظر خود را ثبت می‌کنید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;