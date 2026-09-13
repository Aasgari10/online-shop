// src/components/admin/AddProductPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';

function AddProductPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
    setLoading(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('stock', formData.stock);
    if (image) data.append('image', image);

    try {
      const response = await api.post('/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        toast.success('محصول با موفقیت اضافه شد!');
        navigate('/admin');
      }
    } catch (error) {
      console.error('❌ خطا در افزودن محصول:', error);
      toast.error(error.response?.data?.message || 'خطا در افزودن محصول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">➕ افزودن محصول جدید</h1>
          <button
            onClick={() => navigate('/admin')}
            className="text-[#800E2F] hover:underline text-sm"
          >
            بازگشت به پنل
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6">
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
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">قیمت (تومان) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
              placeholder="مثلاً 250000"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">موجودی</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
              placeholder="مثلاً 10"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">تصویر محصول</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">فقط تصاویر (jpg, png, gif, webp) - حداکثر ۵ مگابایت</p>
            {imagePreview && (
              <img src={imagePreview} alt="پیش‌نمایش" className="mt-3 w-32 h-32 object-cover rounded-lg border shadow-sm" />
            )}
          </div>
          
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
      </div>
    </div>
  );
}

export default AddProductPage;