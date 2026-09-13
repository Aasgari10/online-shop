// src/components/home/DoubleBanner.jsx
import { Link } from 'react-router-dom';

function DoubleBanner({ banners }) {
  if (!banners || banners.length < 2) {
    return null;
  }

  const [banner1, banner2] = banners.slice(0, 2);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${imageUrl}`;
  };

  const img1 = getImageUrl(banner1.image_url);
  const img2 = getImageUrl(banner2.image_url);

  return (
    <div 
      className="w-full py-6" 
      style={{ 
        backgroundColor: '#F5F0EA',  // ✅ رنگ کمرنگ‌تر (روشن‌تر از قبل)
      }}
    > 
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* بنر اول */}
          <Link
            to={banner1.link || '/'}
            className="block overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 group"
          >
            {img1 ? (
              <img
                src={img1}
                alt={banner1.title || 'بنر'}
                className="w-full h-48 md:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = '/fallback-banner.jpg';
                }}
              />
            ) : (
              <div className="w-full h-48 md:h-56 lg:h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                تصویر موجود نیست
              </div>
            )}
          </Link>

          {/* بنر دوم */}
          <Link
            to={banner2.link || '/'}
            className="block overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 group"
          >
            {img2 ? (
              <img
                src={img2}
                alt={banner2.title || 'بنر'}
                className="w-full h-48 md:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = '/fallback-banner.jpg';
                }}
              />
            ) : (
              <div className="w-full h-48 md:h-56 lg:h-64 bg-gray-200 flex items-center justify-center text-gray-500">
                تصویر موجود نیست
              </div>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DoubleBanner;