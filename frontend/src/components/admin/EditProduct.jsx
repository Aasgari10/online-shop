// src/components/admin/EditProduct.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';
import ProductImageGallery from './ProductImageGallery';
import ProductAttributes from './ProductAttributes';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState('');

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

  // دریافت اطلاعات محصول
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data.success) {
          const product = response.data.data;
          setFormData({
            name: product.name || '',
            slug: product.slug || '',
            description: product.description || '',
            category_id: product.category_id || '',
            brand: product.brand || '',
            model: product.model || '',
            weight: product.weight || '',
            dimensions: product.dimensions || '',
            meta_title: product.meta_title || '',
            meta_description: product.meta_description || '',
            meta_keywords: product.meta_keywords || '',
          });
          setCurrentImage(product.image_url || '');
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error('خطا در دریافت اطلاعات محصول');
        navigate('/admin');
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('slug', formData.slug || '');
    data.append('description', formData.description || '');
    data.append('category_id', formData.category_id || '');
    data.append('brand', formData.brand || '');
    data.append('model', formData.model || '');
    data.append('weight', formData.weight || '');
    data.append('dimensions', formData.dimensions || '');
    data.append('meta_title', formData.meta_title || '');
    data.append('meta_description', formData.meta_description || '');
    data.append('meta_keywords', formData.meta_keywords || '');
    if (image) data.append('image', image);

    try {
      const response = await api.put(`/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        toast.success('محصول با موفقیت ویرایش شد!');
        navigate('/admin');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'خطا در ارتباط با سرور');
    } finally {
      setUploading(false);
    }
  };

  if (loading || categoriesLoading) return <Spinner />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">✏️ ویرایش محصول</h1>
        <button onClick={() => navigate('/admin')} className="text-sm text-[#800E2F] hover:underline">
          بازگشت به پنل
        </button>
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

        {/* ===== تصویر فعلی ===== */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">تصویر فعلی</label>
          {currentImage ? (
            <img src={`${currentImage}`} alt="تصویر فعلی" className="w-32 h-32 object-cover rounded border mt-2" />
          ) : (
            <p className="text-gray-500">تصویری وجود ندارد</p>
          )}
        </div>

        {/* ===== تغییر تصویر ===== */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">تغییر تصویر (اختیاری)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full px-3 py-2 border rounded-lg focus:outline-none" />
          <p className="text-xs text-gray-500 mt-1">فقط تصاویر (jpg, png, gif, webp) - حداکثر ۵ مگابایت</p>
          {imagePreview && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">پیش‌نمایش عکس جدید:</p>
              <img src={imagePreview} alt="پیش‌نمایش" className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
            </div>
          )}
        </div>

        {/* ===== دکمه‌ها ===== */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading}
            className={`flex-1 py-2.5 rounded-lg text-white font-bold transition ${uploading ? 'bg-gray-400' : 'bg-[#800E2F] hover:bg-[#6B0A26]'}`}
          >
            {uploading ? <Spinner size="sm" /> : '💾 ذخیره تغییرات'}
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

      {/* ===== گالری و ویژگی‌ها ===== */}
      <div className="space-y-6 mt-6">
        <ProductImageGallery productId={id} />
        <ProductAttributes productId={id} />
      </div>
    </div>
  );
}

export default EditProduct;