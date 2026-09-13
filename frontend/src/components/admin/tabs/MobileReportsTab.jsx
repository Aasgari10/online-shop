// src/components/admin/tabs/MobileReportsTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import MobileSalesReportContent from './MobileSalesReportContent';
import MobileInventoryReportTab from './MobileInventoryReportTab';

function MobileReportsTab() {
  const [activeSubTab, setActiveSubTab] = useState('sales');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories([{ id: 'همه', name: 'همه' }, ...res.data.data]);
        } else {
          setCategories([{ id: 'همه', name: 'همه' }]);
        }
      } catch (error) {
        console.error('خطا در دریافت دسته‌بندی‌ها:', error);
        setCategories([{ id: 'همه', name: 'همه' }]); // fallback
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="pb-4">
      <div className="flex gap-2 border-b border-gray-200 pb-2 mb-0 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('sales')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'sales' ? 'bg-[#800E2F] text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          📊 فروش
        </button>
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition whitespace-nowrap ${
            activeSubTab === 'inventory' ? 'bg-[#800E2F] text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          📦 موجودی
        </button>
      </div>

      {activeSubTab === 'sales' && <MobileSalesReportContent categories={categories} />}
      {activeSubTab === 'inventory' && <MobileInventoryReportTab categories={categories} />}
    </div>
  );
}

export default MobileReportsTab;