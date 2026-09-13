// frontend/src/context/PageDataContext.jsx
import { createContext, useContext } from 'react';

const PageDataContext = createContext({});

export const PageDataProvider = ({ children, initialData = {} }) => {
  return (
    <PageDataContext.Provider value={initialData}>
      {children}
    </PageDataContext.Provider>
  );
};

export const usePageData = () => {
  const context = useContext(PageDataContext);
  if (!context) {
    console.warn('⚠️ usePageData must be used within a PageDataProvider');
    return {};
  }
  return context;
};