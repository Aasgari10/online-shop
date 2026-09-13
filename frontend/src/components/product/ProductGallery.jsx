// src/components/product/ProductGallery.jsx
import { useState } from 'react';
import ImageWithFallback from '../shared/ImageWithFallback';

function ProductGallery({ mainImage, galleryImages, productName, onImageSelect }) {
  const [activeImage, setActiveImage] = useState(mainImage);

  const allImages = [];
  if (mainImage) {
    allImages.push({ image_url: mainImage, isMain: true });
  }
  if (galleryImages && galleryImages.length > 0) {
    galleryImages.forEach(img => {
      if (img.image_url !== mainImage) {
        allImages.push({ image_url: img.image_url, isMain: false });
      }
    });
  }

  if (allImages.length === 0) {
    return (
      <div className="bg-gray-100 rounded-2xl h-96 flex items-center justify-center">
        <span className="text-gray-400">بدون تصویر</span>
      </div>
    );
  }

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${url}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-96 md:h-[450px]">
        <ImageWithFallback
          src={getImageUrl(activeImage || mainImage)}
          alt={productName}
          className="w-full h-full object-contain"
          fallbackSrc="/fallback-image.jpg"
        />
      </div>

      {allImages.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {allImages.map((img, index) => {
            const isActive = (img.image_url === activeImage);
            return (
              <button
                key={index}
                onClick={() => {
                  setActiveImage(img.image_url);
                  if (onImageSelect) onImageSelect(img.image_url);
                }}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  isActive ? 'border-[#800E2F] shadow-md' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <ImageWithFallback
                  src={getImageUrl(img.image_url)}
                  alt={`تصویر ${index + 1}`}
                  className="w-full h-full object-cover"
                  fallbackSrc="/fallback-image.jpg"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;