// src/components/home/PopularCategories.jsx
import { Link } from 'react-router-dom';

function PopularCategories() {
  const categories = [
    { id: 1, name: 'لوازم خانگی', icon: '🏠', color: 'from-blue-500/10 to-blue-500/5' },
    { id: 2, name: 'آشپزخانه', icon: '🍳', color: 'from-orange-500/10 to-orange-500/5' },
    { id: 3, name: 'تزئینی', icon: '🖼️', color: 'from-pink-500/10 to-pink-500/5' },
    { id: 4, name: 'برقی', icon: '💡', color: 'from-yellow-500/10 to-yellow-500/5' },
    { id: 5, name: 'خواب', icon: '🛏️', color: 'from-purple-500/10 to-purple-500/5' },
    { id: 6, name: 'موبایل', icon: '📱', color: 'from-green-500/10 to-green-500/5' },
  ];

  return (
    <div className="w-full py-12" style={{ backgroundColor: '#f8f4ee' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 relative inline-block">
            دسته‌بندی‌های <span className="text-[#800E2F]">محبوب</span>
            <span className="absolute -bottom-2 right-0 w-full h-0.5 rounded-full" style={{ backgroundColor: '#800E2F' }}></span>
          </h2>
          <p className="text-gray-400 text-sm mt-2">محبوب‌ترین دسته‌بندی‌های فروشگاه</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className={`flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br ${cat.color} border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#800E2F] transition">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PopularCategories;