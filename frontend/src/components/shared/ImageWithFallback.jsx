// src/components/shared/ImageWithFallback.jsx
import { useState } from 'react';

function ImageWithFallback({
  src,
  alt,
  fallbackSrc = '/fallback-image.jpg', // ✅ تصویر پیش‌فرض در پوشه public
  className = '',
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = () => {
    setImgSrc(fallbackSrc);
  };

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}

export default ImageWithFallback;