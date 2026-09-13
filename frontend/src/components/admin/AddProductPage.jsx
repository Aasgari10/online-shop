// src/components/admin/AddProductPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import ProductImageGallery from './ProductImageGallery';
import ProductAttributes from './ProductAttributes';
import useIsMobile from '../../hooks/useIsMobile';

function AddProductPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768); // تشخیص موبایل (عرض کمتر از 768px)
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productId, setProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    brand: '',
    model: '',
    weight: '',
    dimensions: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // دریافت دسته‌بندی‌ها
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) setCategories(res.data.data);
      } catch (error) {
        toast.error('خطا در دریافت دسته‌بندی‌ها');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // ===== تصویر شاخص =====
  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setMainImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ===== تصاویر گالری =====
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setGalleryFiles(prev => [...prev, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeGalleryImage = (index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ===== بررسی وجود حداقل یک ترکیب =====
  const checkVariationsExist = async (productId) => {
    try {
      const res = await api.get(`/products/${productId}/variations`);
      if (res.data.success && res.data.data.length > 0) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ خطا در بررسی ترکیبات:', error);
      return false;
    }
  };

  // ============================================================
  // handleSubmit
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim()) {
      toast.error('نام محصول الزامی است');
      setLoading(false);
      return;
    }

    const productData = new FormData();
    productData.append('name', formData.name);
    productData.append('slug', formData.slug || '');
    productData.append('description', formData.description || '');
    productData.append('category_id', formData.category_id || '');
    productData.append('brand', formData.brand || '');
    productData.append('model', formData.model || '');
    productData.append('weight', formData.weight || '');
    productData.append('dimensions', formData.dimensions || '');
    productData.append('meta_title', formData.meta_title || '');
    productData.append('meta_description', formData.meta_description || '');
    productData.append('meta_keywords', formData.meta_keywords || '');
    if (mainImage) productData.append('image', mainImage);

    try {
      const productRes = await api.post('/products', productData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!productRes.data.success) {
        toast.error('خطا در ایجاد محصول');
        setLoading(false);
        return;
      }

      const newProductId = productRes.data.data.id;
      setProductId(newProductId);
      toast.success('محصول با موفقیت اضافه شد!');

      // آپلود تصاویر گالری
      if (galleryFiles.length > 0) {
        const galleryFormData = new FormData();
        galleryFiles.forEach((file) => {
          galleryFormData.append('images', file);
        });
        try {
          const galleryRes = await api.post(`/products/${newProductId}/images/multiple`, galleryFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (galleryRes.data.success) {
            toast.success(`${galleryRes.data.data.length} تصویر گالری آپلود شد`);
          }
        } catch (galleryError) {
          console.error('❌ خطا در آپلود گالری:', galleryError);
          toast.warning('محصول ایجاد شد، اما آپلود تصاویر گالری انجام نشد');
        }
      }

      // بررسی وجود ترکیب
      setTimeout(async () => {
        const hasVariations = await checkVariationsExist(newProductId);
        if (!hasVariations) {
          toast.warning('⚠️ محصول ایجاد شد، اما هیچ ترکیبی ندارد! لطفاً حداقل یک ترکیب با موجودی و قیمت اضافه کنید.');
        }
      }, 1000);

      setLoading(false);
    } catch (error) {
      console.error('❌ خطا در افزودن محصول:', error);
      toast.error(error.response?.data?.message || 'خطا در افزودن محصول');
      setLoading(false);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* ===== هدر صفحه - تغییرات برای موبایل ===== */}
        <div className="flex items-center justify-between mb-6">
          {/* ✅ در موبایل: آیکون برگشت + عنوان کوچکتر */}
          {isMobile ? (
            <>
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 border border-gray-200/50"
                aria-label="بازگشت"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-800">➕ افزودن محصول جدید</h1>
              <div className="w-9"></div> {/* فضای خالی برای تعادل */}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-800">➕ افزودن محصول جدید</h1>
              <button
                onClick={() => navigate('/admin')}
                className="text-[#800E2F] hover:underline text-sm"
              >
                بازگشت به پنل
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6">
          {/* ===== نام محصول ===== */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">نام محصول *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
              placeholder="نام محصول را وارد کنید"
            />
          </div>

          {/* ===== اسلاگ ===== */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              لینک یکتا (اسلاگ)
              <span className="text-xs text-gray-400 mr-2">(اختیاری - در صورت خالی بودن از نام محصول تولید می‌شود)</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/product/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                placeholder="مثلاً کیف-چرمی-مردانه"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              فقط حروف انگلیسی، اعداد و خط تیره (-) مجاز است.
            </p>
          </div>

          {/* ===== متا تگ‌ها ===== */}
          <div className="border-t border-gray-200 pt-4 mt-4 mb-4">
            <h3 className="text-md font-bold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10h.01M9 10h.01M13 14h.01M9 14h.01" />
              </svg>
              تنظیمات سئو (متا تگ‌ها)
            </h3>
            <p className="text-xs text-gray-400 mb-3">در صورت خالی گذاشتن، به‌صورت خودکار از اطلاعات محصول تولید می‌شوند.</p>
            
            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm">عنوان سئو (Meta Title)</label>
              <input
                type="text"
                value={formData.meta_title}
                onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] text-sm"
                placeholder="عنوانی که در گوگل نمایش داده می‌شود"
              />
              <p className="text-xs text-gray-400 mt-1">حداکثر ۶۰ کاراکتر توصیه می‌شود.</p>
            </div>
            
            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm">توضیحات سئو (Meta Description)</label>
              <textarea
                value={formData.meta_description}
                onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                rows="2"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] text-sm"
                placeholder="توضیح مختصر برای نمایش در نتایج جستجو"
              />
              <p className="text-xs text-gray-400 mt-1">حداکثر ۱۶۰ کاراکتر توصیه می‌شود.</p>
            </div>
            
            <div className="mb-3">
              <label className="block text-gray-700 mb-1 text-sm">کلمات کلیدی (Meta Keywords)</label>
              <input
                type="text"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({...formData, meta_keywords: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] text-sm"
                placeholder="با کاما جدا کنید، مثال: کیف, چرم, کیف چرمی"
              />
            </div>
          </div>

          {/* ===== توضیحات ===== */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">توضیحات</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
              placeholder="توضیحات محصول..."
            />
          </div>

          {/* ===== دسته‌بندی ===== */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">دسته‌بندی</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
            >
              <option value="">انتخاب دسته‌بندی...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* ===== ویژگی‌های ثابت ===== */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-gray-700 mb-1 text-sm">برند</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] text-sm"
                placeholder="برند..."
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm">مدل</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] text-sm"
                placeholder="مدل..."
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm">وزن</label>
              <input
                type="text"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] text-sm"
                placeholder="مثلاً ۲.۵ کیلوگرم"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm">ابعاد</label>
              <input
                type="text"
                value={formData.dimensions}
                onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] text-sm"
                placeholder="مثلاً ۴۵×۳۰×۲۰ سانتی‌متر"
              />
            </div>
          </div>

          {/* ===== تصویر شاخص ===== */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">تصویر شاخص (اصلی)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">تصویر اصلی محصول (اختیاری)</p>
            {mainImagePreview && (
              <img src={mainImagePreview} alt="پیش‌نمایش شاخص" className="mt-3 w-32 h-32 object-cover rounded-lg border shadow-sm" />
            )}
          </div>

          {/* ===== گالری تصاویر ===== */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">تصاویر گالری (چند تصویر)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">می‌توانید چندین تصویر را با هم انتخاب کنید (حداکثر ۱۰ عدد)</p>
            {galleryPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {galleryPreviews.map((src, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={src} alt={`گالری ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs"
                    >
                      ✕ حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
            {galleryPreviews.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">{galleryPreviews.length} تصویر انتخاب شده است</p>
            )}
          </div>

          {/* ===== دکمه‌ها ===== */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2.5 rounded-lg text-white font-bold transition ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800E2F] hover:bg-[#6B0A26]'
              }`}
            >
              {loading ? <Spinner size="sm" /> : '💾 ذخیره محصول'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 py-2.5 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold transition"
            >
              انصراف
            </button>
          </div>
        </form>

        {/* ============================================================ */}
        {/* ===== بخش گالری و ویژگی‌ها (بعد از ایجاد محصول) ===== */}
        {/* ============================================================ */}
        {productId && (
          <div className="space-y-6 mt-6">
            {/* پیام هشدار برای وجود حداقل یک ترکیب */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                ⚠️ لطفاً حداقل یک ترکیب با موجودی و قیمت برای این محصول اضافه کنید.
              </p>
              <p className="text-xs text-yellow-600 mt-1">برای افزودن ترکیب، از بخش "ویژگی‌های محصول" استفاده کنید. قیمت هر ترکیب به‌صورت جداگانه تعیین می‌شود.</p>
            </div>

            <ProductImageGallery productId={productId} />
            <ProductAttributes productId={productId} />
            
            <button
              onClick={() => navigate('/admin')}
              className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition"
            >
              ✅ اتمام و بازگشت به پنل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddProductPage;