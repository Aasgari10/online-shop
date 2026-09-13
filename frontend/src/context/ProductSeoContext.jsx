// frontend/src/context/ProductSeoContext.jsx
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ProductSeoContext = createContext(null);

export const useProductSeo = () => {
  const ctx = useContext(ProductSeoContext);
  if (!ctx) {
    return { productSeo: null, updateSeo: () => {}, clearSeo: () => {} };
  }
  return ctx;
};

export function ProductSeoProvider({ children }) {
  const [productSeo, setProductSeo] = useState(null);

  const updateSeo = useCallback((data) => {
    setProductSeo(data);
  }, []);

  const clearSeo = useCallback(() => {
    setProductSeo(null);
  }, []);

  const value = useMemo(
    () => ({ productSeo, updateSeo, clearSeo }),
    [productSeo, updateSeo, clearSeo]
  );

  return (
    <ProductSeoContext.Provider value={value}>
      {children}
    </ProductSeoContext.Provider>
  );
}