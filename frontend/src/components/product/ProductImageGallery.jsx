// src/components/admin/ProductImageGallery.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';

function ProductImageGallery({ productId, onImageChange }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchImages = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}/images`);
      if (res.data.success) {
        setImages(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedImage(res.data.data[0].image_url);
        }
        if (onImageChange) onImageChange(res.data.data);
      }
    } catch (error) {
      toast.error('خطا در دریافت تصاویر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedFiles(files);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('لطفاً حداقل یک تصویر انتخاب کنید');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const res = await api.post(`/products/${productId}/images/multiple`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedFiles([]);
        setPreviews([]);
        document.getElementById('imageInput').value = '';
        fetchImages();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در آپلود تصاویر');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (imageId === 0) {
      toast.error('تصویر اصلی قابل حذف نیست');
      return;
    }
    if (!window.confirm('آیا از حذف این تصویر مطمئن هستید؟')) return;
    try {
      await api.delete(`/products/${productId}/images/${imageId}`);
      toast.success('تصویر با موفقیت حذف شد');
      fetchImages();
    } catch (error) {
      toast.error('خطا در حذف تصویر');
    }
  };

  const moveImage = async (index, direction) => {
    const newImages = [...images];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    if (newImages[index].id === 0 || newImages[newIndex].id === 0) {
      toast.error('تصویر اصلی قابل جابه‌جایی نیست');
      return;
    }
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    const imageOrders = newImages
      .filter(img => img.id !== 0)
      .map((img, idx) => ({ id: img.id, order_index: idx }));
    
    try {
      await api.put(`/products/${productId}/images/reorder`, { imageOrders });
      setImages(newImages);
      toast.success('ترتیب تصاویر به‌روزرسانی شد');
      if (onImageChange) onImageChange(newImages);
    } catch (error) {
      toast.error('خطا در تغییر ترتیب');
    }
  };

  const setAsPrimary = (index) => {
    if (images[index].id === 0) {
      toast.info('این تصویر همان تصویر اصلی است');
      return;
    }
    if (index === 0) return;
    const newImages = [...images];
    const [item] = newImages.splice(index, 1);
    newImages.unshift(item);
    const imageOrders = newImages
      .filter(img => img.id !== 0)
      .map((img, idx) => ({ id: img.id, order_index: idx }));
    
    api.put(`/products/${productId}/images/reorder`, { imageOrders })
      .then(() => {
        setImages(newImages);
        toast.success('تصویر شاخص تغییر کرد');
        if (onImageChange) onImageChange(newImages);
      })
      .catch(() => toast.error('خطا در تغییر تصویر شاخص'));
  };

  const selectImage = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  if (loading) return <Spinner size="sm" />;

  const selectedImageData = images.find(img => img.image_url === selectedImage) || images[0] || null;

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          گالری تصاویر
        </h4>
        <span className="text-sm text-gray-500">{images.length} تصویر</span>
      </div>

      {/* نمایش تصویر بزرگ */}
      {selectedImageData && (
        <div className="relative mb-4 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm h-64 md:h-80">
          <img
            src={selectedImageData.image_url.startsWith('http') ? selectedImageData.image_url : `${selectedImageData.image_url}`}
            alt="تصویر انتخاب‌شده"
            className="w-full h-full object-contain"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
          />
          {selectedImageData.id === 0 && (
            <div className="absolute bottom-2 right-2 bg-[#800E2F] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              تصویر اصلی
            </div>
          )}
        </div>
      )}

      {/* بخش آپلود */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => document.getElementById('imageInput').click()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
          >
            انتخاب تصاویر
          </button>
          {selectedFiles.length > 0 && (
            <>
              <span className="text-sm text-gray-500">{selectedFiles.length} فایل انتخاب شد</span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {uploading ? 'در حال آپلود...' : '📤 آپلود'}
              </button>
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setPreviews([]);
                  document.getElementById('imageInput').value = '';
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
              >
                لغو
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">فقط تصاویر (jpg, png, gif, webp) - حداکثر ۵ مگابایت</p>
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {previews.map((src, index) => (
              <div key={index} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                <img src={src} alt={`پیش‌نمایش ${index}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* نمایش تامبنیل‌ها */}
      {images.length === 0 ? (
        <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">هیچ تصویری برای این محصول وجود ندارد</p>
          <p className="text-xs">برای افزودن، از دکمه "انتخاب تصاویر" استفاده کنید</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img, index) => {
            const isLegacy = img.id === 0;
            const isSelected = selectedImage === img.image_url;
            const imgUrl = img.image_url.startsWith('http') ? img.image_url : `${img.image_url}`;
            
            return (
              <div
                key={img.id || index}
                className={`relative group bg-white rounded-lg border-2 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer ${
                  isSelected ? 'border-[#800E2F] shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => selectImage(img.image_url)}
              >
                <img
                  src={imgUrl}
                  alt={`تصویر ${index + 1}`}
                  className="w-full h-24 object-cover"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                />
                
                {/* برچسب اصلی */}
                {isLegacy && (
                  <span className="absolute top-1 right-1 bg-[#800E2F] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                    اصلی
                  </span>
                )}
                
                {/* برچسب انتخاب‌شده */}
                {isSelected && !isLegacy && (
                  <span className="absolute top-1 right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                    ✓
                  </span>
                )}
                
                {/* دکمه‌های عملیات (هاور) */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  {!isLegacy && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsPrimary(index);
                        }}
                        className="p-1 bg-white/20 hover:bg-white/40 rounded text-white text-xs transition"
                        title="تنظیم به عنوان تصویر اصلی"
                      >
                        ★
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(index, -1);
                        }}
                        disabled={index === 0 || images[index-1]?.id === 0}
                        className={`p-1 rounded text-white text-xs transition ${
                          index === 0 || images[index-1]?.id === 0
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-white/40'
                        }`}
                        title="بالا"
                      >
                        ↑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(index, 1);
                        }}
                        disabled={index === images.length - 1}
                        className={`p-1 rounded text-white text-xs transition ${
                          index === images.length - 1
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-white/40'
                        }`}
                        title="پایین"
                      >
                        ↓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(img.id);
                        }}
                        className="p-1 bg-red-500/50 hover:bg-red-500 rounded text-white text-xs transition"
                        title="حذف"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  {isLegacy && (
                    <span className="text-white text-xs bg-gray-800/70 px-2 py-1 rounded">تصویر اصلی</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductImageGallery;