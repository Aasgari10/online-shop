// src/components/admin/tabs/DiscountCodesTab.jsx
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../../shared/Spinner';
import CustomConfirm from '../../shared/CustomConfirm';
import CreateDiscountCodeModal from '../modals/CreateDiscountCodeModal';
import EditDiscountCodeModal from '../modals/EditDiscountCodeModal';
import { formatPrice } from '../../../utils/formatPrice';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import PageHeader from '../../shared/PageHeader';

function DiscountCodesTab() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/discount-codes');
      if (res.data.success) {
        setCodes(res.data.data);
      }
    } catch (error) {
      console.error('❌ [DiscountCodesTab] خطا در دریافت کدهای تخفیف:', error);
      toast.error('خطا در دریافت کدهای تخفیف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const toggleSelection = (id) => {
    console.log('🔄 [DiscountCodesTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === codes.length && codes.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(codes.map(d => d.id));
      setSelectAll(true);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [DiscountCodesTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchDeleting(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} کد تخفیف...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/discount-codes/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} کد تخفیف با موفقیت حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      fetchCodes();
    } catch (error) {
      console.error('❌ [DiscountCodesTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی کدهای تخفیف');
    } finally {
      setBatchDeleting(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/admin/discount-codes/${deleteTargetId}`);
      toast.success('کد تخفیف به سطل زباله منتقل شد');
      setShowDeleteConfirm(false);
      fetchCodes();
    } catch (error) {
      console.error('❌ خطا در حذف کد تخفیف:', error);
      toast.error('خطا در حذف کد تخفیف');
    } finally {
      setDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const getStatusBadge = (code) => {
    const now = new Date();
    const start = new Date(code.start_date);
    const end = code.end_date ? new Date(code.end_date) : null;

    if (!code.is_active) {
      return { label: 'غیرفعال', className: 'bg-gray-300 text-gray-700' };
    }
    if (end && end < now) {
      return { label: 'منقضی', className: 'bg-red-200 text-red-800' };
    }
    if (start > now) {
      return { label: 'شروع نشده', className: 'bg-blue-200 text-blue-800' };
    }
    if (code.usage_limit !== null && code.used_count >= code.usage_limit) {
      return { label: 'ظرفیت تکمیل', className: 'bg-orange-200 text-orange-800' };
    }
    return { label: 'فعال', className: 'bg-green-200 text-green-800' };
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader 
        title="🎫 مدیریت کدهای تخفیف" 
        subtitle="ایجاد و مدیریت کدهای تخفیف"
        className="mt-2" 
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 pr-2 mr-2 mt-1 bg-[#800E2F] text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
        >
          ➕ ایجاد کد تخفیف جدید
        </button>

        {selectedItems.length > 0 && (
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
          >
            🗑️ حذف گروهی ({selectedItems.length})
          </button>
        )}
      </div>

      {codes.length > 0 && (
        <div className="flex items-center gap-2 mb-3 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({codes.length})</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-xs">
              <th className="text-right py-2 px-3">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                  disabled={codes.length === 0}
                />
              </th>
              <th className="text-right py-2 px-3">#</th>
              <th className="text-right py-2 px-3">کد</th>
              <th className="text-right py-2 px-3">نوع</th>
              <th className="text-right py-2 px-3">مقدار</th>
              <th className="text-right py-2 px-3">شروع</th>
              <th className="text-right py-2 px-3">پایان</th>
              <th className="text-right py-2 px-3">استفاده</th>
              <th className="text-right py-2 px-3">وضعیت</th>
              <th className="text-right py-2 px-3">محصولات</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-8 text-gray-500">هیچ کد تخفیفی یافت نشد</td>
              </tr>
            ) : (
              codes.map((code) => {
                const status = getStatusBadge(code);
                return (
                  <tr key={code.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(code.id)}
                        onChange={() => toggleSelection(code.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-gray-500">{code.id}</td>
                    <td className="py-2 px-3 font-bold text-[#800E2F]">{code.code}</td>
                    <td className="py-2 px-3">
                      {code.discount_type === 'percent' ? 'درصدی' : 'ثابت'}
                    </td>
                    <td className="py-2 px-3">
                      {code.discount_type === 'percent'
                        ? `${code.discount_value}%`
                        : `${formatPrice(code.discount_value)} ت`}
                    </td>
                    <td className="py-2 px-3 text-xs">{formatJalaliDate(new Date(code.start_date))}</td>
                    <td className="py-2 px-3 text-xs">
                      {code.end_date ? formatJalaliDate(new Date(code.end_date)) : 'نامحدود'}
                    </td>
                    <td className="py-2 px-3 text-xs">
                      {code.used_count} {code.usage_limit ? `/ ${code.usage_limit}` : ''}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs">{code.product_count || 0}</td>
                    <td className="py-2 px-3 flex gap-2">
                      <button
                        onClick={() => setEditingCode(code)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded hover:bg-red-100 transition"
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateDiscountCodeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchCodes();
          setShowCreateModal(false);
        }}
      />

      <EditDiscountCodeModal
        isOpen={!!editingCode}
        onClose={() => setEditingCode(null)}
        code={editingCode}
        onSuccess={() => {
          fetchCodes();
          setEditingCode(null);
        }}
      />

      <CustomConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="⚠️ حذف کد تخفیف"
        message="آیا از انتقال این کد تخفیف به سطل زباله مطمئن هستید؟"
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={deleting}
      />

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی کدهای تخفیف"
        message={`آیا از حذف ${selectedItems.length} کد تخفیف انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchDeleting}
      />
    </div>
  );
}

export default DiscountCodesTab;