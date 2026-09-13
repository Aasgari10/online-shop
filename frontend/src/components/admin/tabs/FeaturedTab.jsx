// src/components/admin/tabs/FeaturedTab.jsx
import { useState, useEffect } from 'react';
import { formatPrice } from '../../../utils/formatPrice';
import { formatJalaliDate } from '../../../utils/jalaliUtils';
import { parseLocalDate } from '../../../utils/dateUtils';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import CustomConfirm from '../../shared/CustomConfirm';
import BatchEditFeaturedModal from '../modals/BatchEditFeaturedModal';
import PageHeader from '../../shared/PageHeader';

function FeaturedTab({ featured, onEdit, onDelete, onRefresh, onAddDiscount }) {
  console.log('🔥 [FeaturedTab] کامپوننت رندر شد');

  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState(featured || []);
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchEditModal, setShowBatchEditModal] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    console.log('🔥 [FeaturedTab] useEffect - featured prop changed:', featured?.length);
    setItems(featured || []);
    setSelectedItems([]);
    setSelectAll(false);
  }, [featured]);

  const discountItems = items.filter(item => item.type === 'discount');

  const filtered = discountItems
    .filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_id?.toString().includes(searchTerm)
    );

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id];
      setSelectAll(newSelection.length === filtered.length && filtered.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filtered.map(item => item.featured_id || item.id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteClick = (id) => {
    console.log('🔥 [handleDeleteClick] کلیک حذف برای id:', id);
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    console.log('🔥 [confirmDelete] شروع حذف تکی برای id:', deleteTargetId);
    setDeleteLoading(true);
    try {
      await onDelete(deleteTargetId);
      console.log('🔥 [confirmDelete] onDelete با موفقیت انجام شد');
      
      if (onRefresh) {
        console.log('🔥 [confirmDelete] فراخوانی onRefresh');
        await onRefresh();
      } else if (onAddDiscount) {
        console.log('🔥 [confirmDelete] فراخوانی onAddDiscount به عنوان fallback');
        onAddDiscount();
      }
      
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error('🔥 [confirmDelete] خطا در حذف:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setBatchDeleteLoading(true);
    try {
      const deletePromises = selectedItems.map(id => api.delete(`/admin/featured/${id}`));
      await Promise.all(deletePromises);
      toast.success(`${selectedItems.length} تخفیف با موفقیت به سطل زباله منتقل شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) await onRefresh();
      else if (onAddDiscount) onAddDiscount();
    } catch (error) {
      console.error('❌ [FeaturedTab] خطا در حذف گروهی:', error);
      toast.error('خطا در حذف گروهی تخفیف‌ها');
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  const handleBatchEditSuccess = () => {
    console.log('🔥 [handleBatchEditSuccess] ویرایش گروهی موفق');
    setSelectedItems([]);
    setSelectAll(false);
    if (onRefresh) onRefresh();
    else if (onAddDiscount) onAddDiscount();
  };

  const handleEditClick = (item) => {
    console.log('🔥 [handleEditClick] ویرایش تخفیف برای item:', item.id);
    onEdit(item);
  };

  return (
    <div>
      <PageHeader 
        title="⭐ مدیریت تخفیف‌دارها" 
        subtitle="مدیریت محصولات تخفیف‌دار ویژه" 
      />

      <div className="flex flex-wrap items-center gap-2 mb-6 mt-2">
        {selectedItems.length > 0 && (
          <>
            <button
              onClick={() => setShowBatchEditModal(true)}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
            >
              ✏️ ویرایش گروهی ({selectedItems.length})
            </button>
            <button
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
            >
              🗑️ حذف گروهی ({selectedItems.length})
            </button>
          </>
        )}
        
        <button
          onClick={onAddDiscount}
          className="px-3 py-2 bg-[#800E2F] mr-2 text-white rounded-lg text-sm font-medium hover:bg-[#6B0A26] transition"
        >
          ➕ افزودن تخفیف
        </button>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="جستجو بر اساس نام یا شناسه محصول..."
          className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
        />
      </div>

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
                  disabled={filtered.length === 0}
                />
              </th>
              <th className="text-right py-2 px-3">شناسه محصول</th>
              <th className="text-right py-2 px-3">نام</th>
              <th className="text-right py-2 px-3">قیمت اصلی</th>
              <th className="text-right py-2 px-3">قیمت فعلی</th>
              <th className="text-right py-2 px-3">تخفیف</th>
              <th className="text-right py-2 px-3">زمان پایان</th>
              <th className="text-right py-2 px-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  {searchTerm ? 'محصول تخفیف‌داری با این مشخصات یافت نشد' : 'هیچ محصول تخفیف‌داری یافت نشد'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const id = item.featured_id || item.id;
                return (
                  <tr key={id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-2 px-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(id)}
                        onChange={() => toggleSelection(id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono text-xs text-gray-500">{item.product_id}</td>
                    <td className="py-2 px-3 font-medium text-gray-800">{item.name}</td>
                    <td className="py-2 px-3 text-gray-600">
                      {item.original_price_display ? formatPrice(item.original_price_display) : '-'}
                    </td>
                    <td className="py-2 px-3 text-[#800E2F] font-medium">
                      {formatPrice(item.display_price || item.price)} ت
                    </td>
                    <td className="py-2 px-3">{item.discount_percent || 0}%</td>
                    <td className="py-2 px-3 text-xs text-gray-500">
                      {item.end_time ? formatJalaliDate(parseLocalDate(item.end_time)) : 'نامحدود'}
                    </td>
                    <td className="py-2 px-3 flex gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                      >
                        ✏️ ویرایش تخفیف
                      </button>
                      <button
                        onClick={() => handleDeleteClick(id)}
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

      <CustomConfirm
        isOpen={showDeleteConfirm}
        onClose={() => {
          console.log('🔥 [CustomConfirm] onClose اجرا شد');
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={confirmDelete}
        title="⚠️ حذف تخفیف"
        message="آیا از انتقال این تخفیف به سطل زباله مطمئن هستید؟"
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={deleteLoading}
      />

      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی تخفیف‌ها"
        message={`آیا از حذف ${selectedItems.length} تخفیف انتخاب‌شده مطمئن هستید؟ این تخفیف‌ها به سطل زباله منتقل خواهند شد.`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchDeleteLoading}
      />

      <BatchEditFeaturedModal
        isOpen={showBatchEditModal}
        onClose={() => setShowBatchEditModal(false)}
        items={filtered.filter(item => selectedItems.includes(item.featured_id || item.id))}
        onSuccess={handleBatchEditSuccess}
      />
    </div>
  );
}

export default FeaturedTab;