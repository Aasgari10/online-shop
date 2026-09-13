// src/components/home/MobileBanner.jsx
import { Link } from 'react-router-dom';
import ImageWithFallback from '../shared/ImageWithFallback';

function MobileBanner({ imageUrl, link, title, altText = 'بنر تبلیغاتی' }) {
  if (!imageUrl) return null;

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/assets/')) return url;
    return `${url}`;
  };

  return (
    <div className="w-full" style={{ backgroundColor: '#FEFCF9' }}>
      <div className="container-padding py-2 px-1">
        <Link 
          to={link || '/'} 
          className="block w-full overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
        >
          <div className="relative w-full h-auto aspect-[16/9]">
            <ImageWithFallback
              src={getImageUrl(imageUrl)}
              alt={title || altText}
              className="w-full h-full object-contain"
              fallbackSrc="/fallback-banner.jpg"
            />
          </div>
        </Link>
      </div>
    </div>
  );
}

export default MobileBanner;