// src/components/shared/PriceTag.jsx
import { formatPrice } from '../../utils/formatPrice';

function PriceTag({ price, originalPrice, discountPercent, size = 'md', className = '' }) {
  const isDiscounted = originalPrice && originalPrice > price;

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex flex-col items-end ${className}`}>
      {isDiscounted && (
        <span className={`text-gray-400 line-through ${sizes[size]}`}>
          {formatPrice(originalPrice)} ت
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className={`font-bold text-[#800E2F] ${sizes[size]}`}>
          {formatPrice(price)} ت
        </span>
        {isDiscounted && discountPercent > 0 && (
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            {discountPercent}٪
          </span>
        )}
      </div>
    </div>
  );
}

export default PriceTag;