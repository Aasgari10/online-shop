// src/components/admin/tabs/MobileFeaturedTab.jsx
import { useState } from 'react';
import { formatPrice } from '../../../utils/formatPrice';
import MobileAddDiscountModal from '../modals/MobileAddDiscountModal';
import MobileEditFeaturedModal from '../modals/MobileEditFeaturedModal';
import CustomConfirm from '../../shared/CustomConfirm';
import SimplePersianDatePicker from '../../shared/SimplePersianDatePicker';
import api from '../../../services/api';
import toast from 'react-hot-toast';

function MobileFeaturedTab({ featured, onDelete, onEdit, onAdd, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showBatchEditModal, setShowBatchEditModal] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [batchEditData, setBatchEditData] = useState({
    discount_percent: '',
    end_time: null,
    order_index: '',
  });

  const discountItems = featured.filter(item => item.type === 'discount');

  const filteredItems = discountItems.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_id?.toString().includes(searchTerm)
  );

  const toggleSelection = (id) => {
    console.log('🔄 [MobileFeaturedTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredItems.length && filteredItems.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileFeaturedTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredItems.map(item => item.featured_id || item.id);
      setSelectedItems(ids);
      setSelectAll(true);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileFeaturedTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} تخفیف...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/featured/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} تخفیف با موفقیت حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileFeaturedTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی تخفیف‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  // ============================================================
  // ✅ ویرایش گروهی (مستقیماً API)
  // ============================================================
  const handleBatchEdit = async () => {
    const hasChanges = batchEditData.discount_percent || batchEditData.end_time || batchEditData.order_index;
    if (!hasChanges) {
      toast.error('حداقل یک فیلد را برای ویرایش انتخاب کنید');
      return;
    }

    console.log('✏️ [MobileFeaturedTab] شروع ویرایش گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال ویرایش ${selectedItems.length} تخفیف...`);

    try {
      const promises = selectedItems.map(async (id) => {
        const updateData = {};
        if (batchEditData.discount_percent) {
          updateData.discount_percent = parseFloat(batchEditData.discount_percent);
        }
        if (batchEditData.end_time) {
          updateData.end_time = batchEditData.end_time.getTime();
        }
        if (batchEditData.order_index) {
          updateData.order_index = parseInt(batchEditData.order_index);
        }
        await api.put(`/admin/featured/${id}`, updateData);
      });

      await Promise.all(promises);
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} تخفیف با موفقیت ویرایش شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchEditModal(false);
      setBatchEditData({ discount_percent: '', end_time: null, order_index: '' });
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileFeaturedTab] خطا در ویرایش گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در ویرایش گروهی تخفیف‌ها');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleEditSave = async (id, data) => {
    await onEdit(id, data);
    setEditingItem(null);
  };

  const handleAddDiscount = async (data) => {
    await onAdd(data);
    setShowAddModal(false);
  };

  return (
    <div className="pb-4">
      {/* سرتیتر */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          ⭐ تخفیف‌دارها
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-[#800E2F] text-white rounded-xl text-sm font-medium hover:bg-[#6B0A26] transition whitespace-nowrap">
          ➕ جدید
        </button>
      </div>

      {/* جستجو */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی تخفیف..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* انتخاب همه */}
      {filteredItems.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredItems.length})</span>
        </div>
      )}

      {/* نوار عملیات گروهی */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button onClick={() => setShowBatchEditModal(true)} className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            ✏️ ویرایش
          </button>
          <button onClick={() => setShowBatchDeleteConfirm(true)} className="px-2 py-1 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            🗑️ حذف
          </button>
        </div>
      )}

      {/* لیست تخفیف‌ها */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">تخفیفی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const id = item.featured_id || item.id;
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
                        <h3 className="font-medium text-gray-800 text-sm truncate">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-bold text-[#800E2F]">{formatPrice(item.display_price || item.price)} ت</span>
                          {item.original_price_display && (
                            <span className="text-[9px] text-gray-400 line-through">{formatPrice(item.original_price_display)} ت</span>
                          )}
                          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">{item.discount_percent}%</span>
                        </div>
                        <p className="text-[9px] text-gray-400">شناسه محصول: {item.product_id}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => setEditingItem(item)} className="px-2 py-1 text-[10px] bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition">
                          ✏️
                        </button>
                        <button onClick={() => onDelete(id)} className="px-2 py-1 text-[10px] bg-red-50 text-red-500 rounded hover:bg-red-100 transition">
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

      {/* مودال ویرایش گروهی */}
      {showBatchEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">✏️ ویرایش گروهی تخفیف‌ها</h3>
              <button onClick={() => setShowBatchEditModal(false)} className="text-gray-400 text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">درصد تخفیف جدید</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batchEditData.discount_percent}
                  onChange={(e) => setBatchEditData({...batchEditData, discount_percent: e.target.value})}
                  placeholder="خالی = بدون تغییر"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">زمان پایان جدید</label>
                <SimplePersianDatePicker
                  value={batchEditData.end_time}
                  onChange={(date) => setBatchEditData({...batchEditData, end_time: date})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ترتیب نمایش</label>
                <input
                  type="number"
                  min="0"
                  value={batchEditData.order_index}
                  onChange={(e) => setBatchEditData({...batchEditData, order_index: e.target.value})}
                  placeholder="عدد بزرگتر = نمایش در ابتدا"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800E2F]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-200">
              <button onClick={handleBatchEdit} disabled={batchLoading} className="flex-1 py-2 bg-[#800E2F] text-white rounded-lg text-xs font-medium disabled:opacity-50">
                {batchLoading ? '...' : '💾 ذخیره'}
              </button>
              <button onClick={() => setShowBatchEditModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog حذف گروهی */}
      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی تخفیف‌ها"
        message={`آیا از حذف ${selectedItems.length} تخفیف انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      {/* مودال افزودن تخفیف */}
      <MobileAddDiscountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddDiscount}
      />

      {/* مودال ویرایش تخفیف */}
      <MobileEditFeaturedModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleEditSave}
      />
    </div>
  );
}

export default MobileFeaturedTab;