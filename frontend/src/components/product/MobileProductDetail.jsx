// src/components/product/MobileProductDetail.jsx
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

function MobileProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
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
  const [colorsMap, setColorsMap] = useState({});
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const hasLoggedInitial = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      setIsLoggedIn(!!user);
      setIsAdmin(user?.role === 'admin');
    }
  }, []);

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

  const cleanValue = (value) => {
    if (!value) return value;
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
          const colorValue = attrs[key];
          if (!colorValue) return;

          let colorCode = v.color_code || null;
          if (!colorCode && attrs['_color_code']) {
            colorCode = attrs['_color_code'];
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
                value: String(colorValue),
                color_code: colorCode || '#cccccc',
                isCustom: true,
                stock: v.stock || 0,
              });
            }
          } else {
            colorList.push({
              id: colorValue,
              value: colorValue,
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
          console.log('📦 [MobileProductDetail] محصول:', data.name, 'ID:', data.id);
          console.log('📦 [MobileProductDetail] ترکیبات:', data.variations?.length || 0);
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
  }, [slug]);

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
        console.log('✅ [MobileProductDetail] ترکیب پیش‌فرض:', defaultVariation.color_name || 'بدون رنگ');
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
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `${product.name} - خرید از فروشگاه HomeMart`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('لینک محصول کپی شد');
      }).catch(() => {
        toast.error('کپی لینک انجام نشد');
      });
    }
  };

  const handleImageSelect = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const isColorSelected = (colorId, colorValue) => {
    const selected = selectedAttrs['1'];
    if (selected === undefined || selected === null) return false;
    return String(selected) === String(colorId) || String(selected) === String(colorValue);
  };

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
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-8 px-4">
        <h1 className="sr-only">محصول یافت نشد | فروشگاه اینترنتی HomeMart</h1>
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">خطا</h2>
          <p className="text-gray-600 text-sm">{error || 'محصول یافت نشد'}</p>
          <Link to="/shop" className="inline-block mt-6 text-[#800E2F] hover:underline text-sm">
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

  const allImages = [];
  if (selectedImage) {
    allImages.push({ image_url: selectedImage, isMain: true });
  }
  galleryImages.forEach(img => {
    if (img.image_url !== selectedImage) {
      allImages.push({ image_url: img.image_url, isMain: false });
    }
  });

  const filteredCustomAttributes = product.custom_attributes ? Object.keys(product.custom_attributes)
    .filter(key => key !== '_color_code')
    .reduce((obj, key) => {
      obj[key] = product.custom_attributes[key];
      return obj;
    }, {}) : {};

  return (
    <div className="min-h-screen bg-[#E8DCC8] pb-4">
      <div className="mx-1 mt-1 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200/60">
        <div className="relative w-full bg-white">
          <div className="w-full h-[300px] overflow-hidden bg-white">
            {allImages.length > 0 ? (
              <img
                src={allImages[0]?.image_url}
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

          <button
            onClick={() => navigate(-1)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-200/50 z-10"
            aria-label="بازگشت"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 left-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition border border-gray-200/50"
          >
            <svg
              className={`w-5 h-5 transition-colors ${isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-500 fill-none'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {isDiscounted && (
            <span className="absolute top-3 left-16 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
              {discountPercent}٪
            </span>
          )}
          {maxStock === 0 && (
            <span className="absolute bottom-3 right-3 bg-gray-800/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
              ناموجود
            </span>
          )}

          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1.5 rounded-full">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(img.image_url)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    img.image_url === selectedImage
                      ? 'border-white shadow-lg scale-110'
                      : 'border-white/40 hover:border-white/80'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`تصویر ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/fallback-image.jpg'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pt-3 pb-2 space-y-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-snug">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              <div className="flex items-center gap-0.5">
                {renderStars(averageRating)}
              </div>
              <span>{averageRating.toFixed(1)}</span>
              <span className="text-gray-400">({totalReviews})</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">موجودی: {maxStock}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isDiscounted && originalPrice && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)} تومان</span>
            )}
            <span className="text-lg font-bold text-[#800E2F]">
              {formatPrice(displayPrice)}
              <span className="text-base font-extrabold text-[#800E2F] mr-1">تومان</span>
            </span>
            {isDiscounted && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {discountPercent}٪
              </span>
            )}
          </div>

          {hasVariations && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-3">
              {colorList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رنگ: <span className="font-normal text-gray-500">
                      {selectedAttrs['1']
                        ? colorList.find(c => String(c.id) === String(selectedAttrs['1']) || String(c.value) === String(selectedAttrs['1']))?.value || ''
                        : ''}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {colorList.map((color) => {
                      const colorId = color.id;
                      const isSelected = isColorSelected(colorId, color.value);

                      return (
                        <button
                          key={color.id}
                          onClick={() => selectAttribute('1', colorId)}
                          className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
                          title={color.value}
                        >
                          <div
                            className={`w-11 h-11 rounded-full transition-all duration-200 ${
                              isSelected
                                ? 'border-[3px] border-[#800E2F] shadow-md scale-110'
                                : 'border-2 border-gray-300'
                            }`}
                            style={{ backgroundColor: color.color_code || '#cccccc' }}
                          />
                          <span className={`text-[10px] ${isSelected ? 'text-[#800E2F] font-bold' : 'text-gray-700 font-medium'}`}>
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
                            className={`px-3 py-1.5 rounded-lg border-2 text-xs transition-all ${
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
                <div className={`text-xs p-2 rounded-lg border ${
                  maxStock > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {maxStock > 0 ? `✅ موجود — ${maxStock.toLocaleString('fa-IR')} عدد` : '❌ ناموجود'}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">تعداد:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => changeQuantity(-1)}
                disabled={quantity <= 1}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-lg font-bold text-gray-600"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-gray-800 text-sm">{quantity}</span>
              <button
                onClick={() => changeQuantity(1)}
                disabled={quantity >= maxStock}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 text-lg font-bold text-gray-600"
              >
                +
              </button>
            </div>
            <span className="text-[10px] text-gray-400">حداکثر: {maxStock}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={maxStock === 0}
              className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition ${
                maxStock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800E2F] hover:bg-[#6B0A26] active:scale-95'
              }`}
            >
              {maxStock === 0 ? 'ناموجود' : '🛒 افزودن به سبد خرید'}
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {product.description && (
          <div className="px-4 py-3 border-t border-gray-200/60">
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="w-full flex items-center justify-between text-right"
            >
              <span className="font-bold text-gray-800 text-sm">📝 توضیحات</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showFullDescription ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all ${
                showFullDescription ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          </div>
        )}

        {(product.brand || product.model || product.weight || product.dimensions || Object.keys(filteredCustomAttributes).length > 0) && (
          <div className="px-4 py-3 border-t border-gray-200/60">
            <button
              onClick={() => setShowAllSpecs(!showAllSpecs)}
              className="w-full flex items-center justify-between text-right"
            >
              <span className="font-bold text-gray-800 text-sm">📋 مشخصات فنی</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showAllSpecs ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all ${
                showAllSpecs ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.brand && (
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-[10px] text-gray-500">برند</span>
                    <p className="font-medium text-gray-800 text-sm">{product.brand}</p>
                  </div>
                )}
                {product.model && (
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-[10px] text-gray-500">مدل</span>
                    <p className="font-medium text-gray-800 text-sm">{product.model}</p>
                  </div>
                )}
                {product.weight && (
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-[10px] text-gray-500">وزن</span>
                    <p className="font-medium text-gray-800 text-sm">{product.weight}</p>
                  </div>
                )}
                {product.dimensions && (
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <span className="text-[10px] text-gray-500">ابعاد</span>
                    <p className="font-medium text-gray-800 text-sm">{product.dimensions}</p>
                  </div>
                )}
                {filteredCustomAttributes && Object.entries(filteredCustomAttributes).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-2 rounded-lg col-span-2">
                    <span className="text-[10px] text-gray-500">{key}</span>
                    <p className="font-medium text-gray-800 text-sm">
                      {Array.isArray(value) ? value.join('، ') : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="h-2"></div>
      </div>

      <div className="mx-1 mt-3 bg-white rounded-2xl shadow-sm border border-gray-200/60 p-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-800 text-sm">💬 نظرات ({totalReviews})</span>
          <span className="text-sm text-gray-600">{averageRating.toFixed(1)} از ۵</span>
        </div>

        {isLoggedIn ? (
          <form onSubmit={handleSubmitReview} className="mb-4">
            <div className="flex items-center gap-1 mb-2 mr-1">
              <span className="text-sm text-gray-700">امتیاز:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="text-xl transition"
                >
                  <span className={star <= reviewRating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows="3"
              placeholder="نظر خود را بنویسید..."
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white resize-none"
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="mt-2 px-5 py-2 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition disabled:opacity-50"
            >
              {submittingReview ? 'در حال ارسال...' : 'ارسال نظر'}
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            برای ثبت نظر <Link to="/login" className="text-[#800E2F] hover:underline">وارد شوید</Link>
          </p>
        )}

        {reviews.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">{review.user_name}</span>
                    <div className="flex items-center gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatJalaliDate(new Date(review.created_at))}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-2 mr-3 space-y-2 border-r-2 border-gray-300 pr-3">
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="bg-white p-2 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-[#800E2F]">{reply.user_name}</span>
                          {reply.user_role === 'admin' && <span className="text-[10px] bg-[#800E2F] text-white px-1.5 py-0.5 rounded-full">ادمین</span>}
                          <span className="text-xs text-gray-400">{formatJalaliDate(new Date(reply.created_at))}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{reply.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {reviews.length > 5 && (
              <button className="text-sm text-[#800E2F] font-medium hover:underline">
                مشاهده همه {reviews.length} نظر
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p>هنوز نظری ثبت نشده است.</p>
            <p className="text-sm mt-1">اولین نفری باشید که نظر می‌دهید.</p>
          </div>
        )}
      </div>

      <div className="h-4"></div>
    </div>
  );
}

export default MobileProductDetail;