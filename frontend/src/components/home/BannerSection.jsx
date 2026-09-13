// src/components/home/BannerSection.jsx
import { Link } from 'react-router-dom';

function BannerSection({ imageUrl, link, title, altText = 'بنر تبلیغاتی' }) {
  if (!imageUrl) return null;

  let finalImageUrl = imageUrl;
  if (imageUrl.startsWith('http')) {
    finalImageUrl = imageUrl;
  } else if (imageUrl.startsWith('/assets/')) {
    finalImageUrl = imageUrl;
  } else if (imageUrl.startsWith('/uploads/')) {
    finalImageUrl = `${imageUrl}`;
  } else {
    finalImageUrl = `${imageUrl}`;
  }

  return (
    <Link to={link || '/'} className="block w-full min-h-[60vh] overflow-hidden">
      <img
        src={finalImageUrl}
        alt={title || altText}
        className="w-full min-h-[60vh] object-cover transition-transform duration-300 hover:scale-[1.01]"
        onError={(e) => { 
          e.target.src = '/fallback-banner.jpg'; 
        }}
      />
    </Link>
  );
}

export default BannerSection;