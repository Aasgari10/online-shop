// src/components/home/ProductGrid.jsx
import React from 'react';
import ProductCard from './ProductCard';

function ProductGrid({ 
  products, 
  discountLookup, 
  isAdmin, 
  onDelete, 
  onEdit,
  showAddToCart = false,
  emptyMessage = 'محصولی برای این دسته یافت نشد'
}) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 bg-white/50 rounded-2xl">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          discountInfo={discountLookup?.[product.id]}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
          showAddToCart={showAddToCart}
        />
      ))}
    </div>
  );
}

export default React.memo(ProductGrid);