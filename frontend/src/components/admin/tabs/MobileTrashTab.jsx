// src/components/admin/tabs/MobileTrashTab.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import api from '../../../services/api';

function MobileTrashTab({ trashData, onRestore, onForceDelete, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchRestoreConfirm, setShowBatchRestoreConfirm] = useState(false);
  const [showBatchForceDeleteConfirm, setShowBatchForceDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const subTabs = [
    { key: 'users', label: '👤 کاربران' },
    { key: 'products', label: '📦 محصولات' },
    { key: 'categories', label: '📂 دسته‌بندی‌ها' },
    { key: 'banners', label: '🖼️ بنرها' },
    { key: 'featured', label: '⭐ تخفیف‌دارها' },
    { key: 'orders', label: '📋 سفارشات' },
    { key: 'reviews', label: '💬 نظرات' },
    { key: 'tickets', label: '🎫 تیکت‌ها' },
    { key: 'discountCodes', label: '🎫 کدهای تخفیف' },
  ];

  const items = trashData[activeSubTab] || [];

  const getItemName = (item, tabKey) => {
    switch(tabKey) {
      case 'users': return item.name || 'بدون نام';
      case 'products': return item.name || 'بدون نام';
      case 'categories': return item.name || 'بدون نام';
      case 'banners': return item.title || 'بدون نام';
      case 'featured': return item.product_name || item.name || 'بدون نام';
      case 'orders': return `سفارش #${item.id}` || 'بدون نام';
      case 'reviews': return item.product_name || `نظر #${item.id}` || 'بدون نام';
      case 'tickets': return item.subject || 'بدون نام';
      case 'discountCodes': return item.code || 'بدون نام';
      default: return item.name || item.title || item.subject || item.code || 'بدون نام';
    }
  };

  const toggleSelection = (id) => {
    console.log('🔄 [MobileTrashTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === items.length && items.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileTrashTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = items.map(item => item.id || item.featured_id || item.ticket_id);
      setSelectedItems(ids);
      setSelectAll(true);
      console.log('📊 همه انتخاب شدند:', ids.length);
    }
  };

  // ============================================================
  // ✅ بازیابی گروهی (مستقیماً API)
  // ============================================================
  const handleBatchRestore = async () => {
    if (selectedItems.length === 0) return;
    console.log('♻️ [MobileTrashTab] شروع بازیابی گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال بازیابی ${selectedItems.length} آیتم...`);

    try {
      await Promise.all(selectedItems.map(id => onRestore(activeSubTab, id)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} آیتم با موفقیت بازیابی شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchRestoreConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileTrashTab] خطا در بازیابی گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در بازیابی گروهی آیتم‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  // ============================================================
  // ✅ حذف دائمی گروهی (مستقیماً API)
  // ============================================================
  const handleBatchForceDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('💀 [MobileTrashTab] شروع حذف دائمی گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف دائمی ${selectedItems.length} آیتم...`);

    try {
      await Promise.all(selectedItems.map(id => onForceDelete(activeSubTab, id)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} آیتم برای همیشه حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchForceDeleteConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileTrashTab] خطا در حذف دائمی گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف دائمی گروهی آیتم‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleSingleRestore = async (type, id) => {
    try {
      await onRestore(type, id);
      toast.success('آیتم بازیابی شد');
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error('خطا در بازیابی');
    }
  };

  const handleSingleForceDelete = async (type, id) => {
    try {
      await onForceDelete(type, id);
      toast.success('آیتم برای همیشه حذف شد');
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error('خطا در حذف دائمی');
    }
  };

  return (
    <div className="pb-4">
      {/* تب‌های زیرمجموعه */}
      <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1 scrollbar-hidden">
        {subTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveSubTab(tab.key); setSelectedItems([]); setSelectAll(false); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              activeSubTab === tab.key ? 'bg-[#800E2F] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* انتخاب همه */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 mb-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({items.length})</span>
        </div>
      )}

      {/* نوار عملیات گروهی */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button onClick={() => setShowBatchRestoreConfirm(true)} className="px-2.5 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            ♻️ بازیابی
          </button>
          <button onClick={() => setShowBatchForceDeleteConfirm(true)} className="px-2.5 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            💀 حذف دائمی
          </button>
        </div>
      )}

      {/* لیست آیتم‌ها */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">سطل زباله خالی است</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const id = item.id || item.featured_id || item.ticket_id;
            const name = getItemName(item, activeSubTab);
            const deletedAt = item.deleted_at || item.created_at;
            
            let extraInfo = null;
            if (activeSubTab === 'users' && item.email) extraInfo = item.email;
            else if (activeSubTab === 'orders') extraInfo = `کاربر: ${item.user_name || 'نامشخص'}`;
            else if (activeSubTab === 'products' && item.price) extraInfo = `${item.price.toLocaleString()} ت`;
            else if (activeSubTab === 'discountCodes' && item.discount_type) {
              extraInfo = item.discount_type === 'percent' ? `${item.discount_value}%` : `${item.discount_value} ت`;
            }
            else if (activeSubTab === 'featured' && item.discount_percent) extraInfo = `${item.discount_percent}% تخفیف`;
            
            return (
              <div key={id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(id)}
                    onChange={() => toggleSelection(id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800 text-sm truncate">{name}</h3>
                        {extraInfo && <p className="text-xs text-gray-500">{extraInfo}</p>}
                        <p className="text-[10px] text-gray-400">حذف: {new Date(deletedAt).toLocaleDateString('fa-IR')}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => handleSingleRestore(activeSubTab, id)} className="px-2.5 py-0.5 text-[10px] bg-green-50 text-green-600 rounded hover:bg-green-100 transition">
                          ♻️ بازیابی
                        </button>
                        <button onClick={() => handleSingleForceDelete(activeSubTab, id)} className="px-2.5 py-0.5 text-[10px] bg-red-50 text-red-500 rounded hover:bg-red-100 transition">
                          💀 حذف
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog بازیابی گروهی */}
      <CustomConfirm
        isOpen={showBatchRestoreConfirm}
        onClose={() => setShowBatchRestoreConfirm(false)}
        onConfirm={handleBatchRestore}
        title="♻️ بازیابی گروهی"
        message={`آیا از بازیابی ${selectedItems.length} آیتم انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، بازیابی"
        cancelText="انصراف"
        variant="success"
        loading={batchLoading}
      />

      {/* Confirm Dialog حذف دائمی گروهی */}
      <CustomConfirm
        isOpen={showBatchForceDeleteConfirm}
        onClose={() => setShowBatchForceDeleteConfirm(false)}
        onConfirm={handleBatchForceDelete}
        title="💀 حذف دائمی گروهی"
        message={`آیا از حذف دائمی ${selectedItems.length} آیتم انتخاب‌شده مطمئن هستید؟ این عمل غیرقابل بازگشت است!`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      <style>{`.scrollbar-hidden { scrollbar-width: none; -ms-overflow-style: none; } .scrollbar-hidden::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

export default MobileTrashTab;