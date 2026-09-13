// src/components/admin/tabs/MobileDiscountCodesTab.jsx
import { useState, useEffect } from 'react';
import { formatPrice } from '../../../utils/formatPrice';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import MobileAddDiscountCodeModal from '../modals/MobileAddDiscountCodeModal';
import MobileEditDiscountCodeModal from '../modals/MobileEditDiscountCodeModal';
import CustomConfirm from '../../shared/CustomConfirm';
import api from '../../../services/api';
import toast from 'react-hot-toast';

function MobileDiscountCodesTab({ discountCodes, onDelete, onAdd, onEdit, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);

  const filteredCodes = discountCodes.filter(d =>
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.id.toString().includes(searchTerm)
  );

  const getStatusBadge = (code) => {
    const now = new Date();
    const start = new Date(code.start_date);
    const end = code.end_date ? new Date(code.end_date) : null;
    if (!code.is_active) return { label: 'غیرفعال', className: 'bg-gray-300 text-gray-700' };
    if (end && end < now) return { label: 'منقضی', className: 'bg-red-200 text-red-800' };
    if (start > now) return { label: 'شروع نشده', className: 'bg-blue-200 text-blue-800' };
    if (code.usage_limit !== null && code.used_count >= code.usage_limit) {
      return { label: 'تکمیل', className: 'bg-orange-200 text-orange-800' };
    }
    return { label: 'فعال', className: 'bg-green-200 text-green-800' };
  };

  const toggleSelection = (id) => {
    console.log('🔄 [MobileDiscountCodesTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredCodes.length && filteredCodes.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileDiscountCodesTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredCodes.map(d => d.id);
      setSelectedItems(ids);
      setSelectAll(true);
      console.log('📊 همه انتخاب شدند:', ids.length);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileDiscountCodesTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} کد تخفیف...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/discount-codes/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} کد تخفیف با موفقیت حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileDiscountCodesTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی کدهای تخفیف');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    if (onRefresh) onRefresh();
  };

  const handleEditSuccess = () => {
    setEditingCode(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          🎫 کدهای تخفیف
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-[#800E2F] text-white rounded-xl text-sm font-medium hover:bg-[#6B0A26] transition whitespace-nowrap">
          ➕ جدید
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی کد تخفیف..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {filteredCodes.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredCodes.length})</span>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button onClick={() => setShowBatchDeleteConfirm(true)} className="px-2 py-1 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            🗑️ حذف
          </button>
        </div>
      )}

      {filteredCodes.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">کد تخفیفی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCodes.map((code) => {
            const status = getStatusBadge(code);
            return (
              <div key={code.id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(code.id)}
                    onChange={() => toggleSelection(code.id)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#800E2F] text-sm">{code.code}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {code.discount_type === 'percent' ? `${code.discount_value}%` : `${formatPrice(code.discount_value)} ت`}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          شروع: {formatJalaliDate(new Date(code.start_date))}
                          {code.end_date && ` | پایان: ${formatJalaliDate(new Date(code.end_date))}`}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          استفاده: {code.used_count} {code.usage_limit ? `/ ${code.usage_limit}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => setEditingCode(code)} className="px-2 py-1 text-[10px] bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition">
                          ✏️
                        </button>
                        <button onClick={() => onDelete(code.id)} className="px-2 py-1 text-[10px] bg-red-50 text-red-500 rounded hover:bg-red-100 transition">
                          🗑️
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

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی کدهای تخفیف"
        message={`آیا از حذف ${selectedItems.length} کد تخفیف انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      <MobileAddDiscountCodeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      <MobileEditDiscountCodeModal
        isOpen={!!editingCode}
        onClose={() => setEditingCode(null)}
        code={editingCode}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default MobileDiscountCodesTab;