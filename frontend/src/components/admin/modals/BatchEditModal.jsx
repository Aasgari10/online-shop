// src/components/admin/modals/BatchEditModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../shared/Modal';
import Button from '../../shared/Button';
import api from '../../../services/api';
import toast from 'react-hot-toast';

function BatchEditModal({ isOpen, onClose, products, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // ===== فرم ویرایش گروهی =====
  const [formData, setFormData] = useState({
    category_id: '',
    new_price: '',
    stock: '',
  });

  // ===== دریافت دسته‌بندی‌ها =====
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error('خطا در دریافت دسته‌بندی‌ها:', error);
      }
    };
    if (isOpen) {
      fetchCategories();
      // ریست فرم هنگام باز شدن
      setFormData({
        category_id: '',
        new_price: '',
        stock: '',
      });
      setSelectedFile(null);
      setImagePreview(null);
    }
  }, [isOpen]);

  // ===== تغییر عکس =====
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ===== اعمال ویرایش گروهی =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // بررسی اینکه حداقل یک فیلد پر شده باشد
    const hasChanges = 
      formData.category_id !== '' ||
      formData.new_price !== '' ||
      formData.stock !== '' ||
      selectedFile !== null;

    if (!hasChanges) {
      toast.error('حداقل یک فیلد را برای ویرایش انتخاب کنید');
      return;
    }

    setLoading(true);
    try {
      // ایجاد لیست درخواست‌های به‌روزرسانی
      const updatePromises = products.map(async (product) => {
        const updateData = {};
        
        // ۱. تغییر دسته‌بندی
        if (formData.category_id) {
          updateData.category_id = formData.category_id;
        }

        // ۲. تغییر قیمت (عددی)
        if (formData.new_price !== '') {
          const newPrice = parseFloat(formData.new_price);
          if (!isNaN(newPrice) && newPrice >= 0) {
            updateData.price = Math.round(newPrice);
          } else {
            toast.error('قیمت وارد شده نامعتبر است');
            throw new Error('قیمت نامعتبر');
          }
        }

        // ۳. تغییر موجودی
        if (formData.stock !== '') {
          updateData.stock = parseInt(formData.stock);
        }

        // ۴. تغییر عکس (آپلود عکس جدید)
        if (selectedFile) {
          const formDataImage = new FormData();
          formDataImage.append('image', selectedFile);
          
          // آپلود عکس برای هر محصول
          const uploadRes = await api.post('/upload', formDataImage, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (uploadRes.data.success) {
            updateData.image_url = uploadRes.data.image_url;
          }
        }

        // به‌روزرسانی محصول
        if (Object.keys(updateData).length > 0) {
          // دریافت محصول فعلی برای داده‌های کامل
          const productRes = await api.get(`/products/${product.id}`);
          const currentProduct = productRes.data.data;
          
          // ترکیب داده‌های فعلی با داده‌های جدید
          const finalData = {
            name: currentProduct.name,
            description: currentProduct.description,
            price: updateData.price || currentProduct.price,
            stock: updateData.stock !== undefined ? updateData.stock : currentProduct.stock,
            category_id: updateData.category_id || currentProduct.category_id,
            image_url: updateData.image_url || currentProduct.image_url,
          };

          await api.put(`/products/${product.id}`, finalData);
        }
      });

      await Promise.all(updatePromises);
      
      toast.success(`${products.length} محصول با موفقیت ویرایش شدند`);
      onSuccess(); // رفرش لیست
      onClose(); // بستن مودال
    } catch (error) {
      console.error('❌ خطا در ویرایش گروهی:', error);
      toast.error('خطا در ویرایش گروهی محصولات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ ویرایش گروهی محصولات" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-bold">{products.length}</span> محصول انتخاب‌شده
          </p>
        </div>

        {/* ===== تغییر دسته‌بندی ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تغییر دسته‌بندی
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
          >
            <option value="">بدون تغییر</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* ===== تغییر قیمت (عددی) ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تغییر قیمت (قیمت نهایی)
          </label>
          <input
            type="number"
            min="0"
            value={formData.new_price}
            onChange={(e) => setFormData({ ...formData, new_price: e.target.value })}
            placeholder="قیمت جدید را وارد کنید (خالی = بدون تغییر)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
          />
          <p className="text-xs text-gray-400 mt-1">در صورت وارد کردن، قیمت تمام محصولات به این عدد تغییر خواهد کرد.</p>
        </div>

        {/* ===== تغییر موجودی ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تغییر موجودی
          </label>
          <input
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="مقدار جدید موجودی (خالی = بدون تغییر)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F]"
          />
          <p className="text-xs text-gray-400 mt-1">در صورت وارد کردن، تمام محصولات موجودی یکسانی خواهند داشت.</p>
        </div>

        {/* ===== تغییر عکس ===== */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تغییر عکس
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">فقط تصاویر (jpg, png, gif, webp) - حداکثر ۵ مگابایت</p>
          {imagePreview && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">پیش‌نمایش عکس جدید:</p>
              <img src={imagePreview} alt="پیش‌نمایش" className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
              <p className="text-xs text-gray-400 mt-1">این عکس برای همه محصولات انتخاب‌شده اعمال خواهد شد.</p>
            </div>
          )}
        </div>

        {/* ===== دکمه‌ها ===== */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="flex-1"
          >
            💾 اعمال تغییرات
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            انصراف
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default BatchEditModal;