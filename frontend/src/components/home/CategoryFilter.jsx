// src/components/home/CategoryFilter.jsx
import React from 'react';

function CategoryFilter({ categories, selected, onChange }) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mb-6">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-4 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300 ${
            selected === cat.id
              ? 'bg-[#800E2F] text-white shadow-md scale-105'
              : 'bg-white/70 text-gray-600 hover:bg-white hover:shadow-md hover:scale-105'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export default React.memo(CategoryFilter);