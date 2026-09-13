// src/components/admin/tabs/ReportsTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import SalesReportContent from './SalesReportContent';
import InventoryReportTab from './InventoryReportTab';
import PageHeader from '../../shared/PageHeader';

function ReportsTab() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories([{ id: 'همه', name: 'همه' }, ...res.data.data]);
        }
      } catch (error) {
        console.error('خطا در دریافت دسته‌بندی‌ها:', error);
      }
    };
    fetchCategories();
  }, []);

  // ✅ تبدیل تاریخ به فرمت کامل با زمان (YYYY-MM-DD HH:MM:SS)
  const formatDateForAPI = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleGenerateReport = async ({ startDate, endDate, filters }) => {
    if (!startDate || !endDate) {
      toast.error('لطفاً تاریخ شروع و پایان را انتخاب کنید');
      return;
    }

    const startStr = formatDateForAPI(startDate);
    const endStr = formatDateForAPI(endDate);

    if (!startStr || !endStr) {
      toast.error('خطا در تبدیل تاریخ');
      return;
    }

    setLoading(true);
    setReportData(null);

    try {
      const params = { startDate: startStr, endDate: endStr };
      if (filters.status && filters.status !== 'همه') {
        params.status = filters.status;
      }
      const categoryId = filters.categoryId === 'همه' ? 'همه' : parseInt(filters.categoryId);
      if (categoryId !== 'همه') {
        params.categoryId = categoryId;
      }

      const res = await api.get('/admin/reports/sales', { params });
      if (res.data.success) {
        setReportData(res.data.data);
        toast.success('گزارش با موفقیت تولید شد');
      }
    } catch (error) {
      console.error('❌ [ReportsTab] خطا:', error);
      toast.error(error.response?.data?.message || 'خطا در دریافت گزارش');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="📊 گزارش‌ها" 
        subtitle="گزارش‌های فروش و موجودی" 
        className="mt-4"
      />

      <div className="flex mt-3 flex-wrap gap-2 mr-2 mb-0 border-b border-gray-200 pb-3">
        <button 
          onClick={() => setActiveTab('sales')}
          className={`px-4 pr-2.5 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'sales' ? 'bg-[#800E2F] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📊 گزارش فروش
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'inventory' ? 'bg-[#800E2F] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📦 گزارش موجودی
        </button>
      </div>

      {activeTab === 'sales' && (
        <SalesReportContent
          categories={categories}
          reportData={reportData}
          loading={loading}
          onGenerateReport={handleGenerateReport}
        />
      )}
      {activeTab === 'inventory' && <InventoryReportTab categories={categories} />}
    </div>
  );
}

export default ReportsTab;