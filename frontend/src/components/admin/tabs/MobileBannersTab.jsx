// src/components/admin/tabs/MobileBannersTab.jsx
import { useState } from 'react';
import MobileEditBannerModal from '../modals/MobileEditBannerModal';
import MobileAddBannerModal from '../modals/MobileAddBannerModal';
import CustomConfirm from '../../shared/CustomConfirm';
import toast from 'react-hot-toast';
import api from '../../../services/api';

function MobileBannersTab({ banners, onToggle, onDelete, onEdit, onAdd, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBanner, setEditingBanner] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const filteredBanners = banners.filter(b =>
    b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toString().includes(searchTerm)
  );

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${imageUrl}`;
  };

  const toggleSelection = (id) => {
    console.log('🔄 [MobileBannersTab] toggleSelection:', id);
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      setSelectAll(newSelection.length === filteredBanners.length && filteredBanners.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    console.log('🔄 [MobileBannersTab] toggleSelectAll, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const ids = filteredBanners.map(b => b.id);
      setSelectedItems(ids);
      setSelectAll(true);
    }
  };

  // ============================================================
  // ✅ حذف گروهی (مستقیماً API)
  // ============================================================
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    console.log('🗑️ [MobileBannersTab] شروع حذف گروهی، تعداد:', selectedItems.length);
    setBatchLoading(true);
    const loadingToast = toast.loading(`در حال حذف ${selectedItems.length} بنر...`);

    try {
      await Promise.all(selectedItems.map(id => api.delete(`/admin/banners/${id}`)));
      toast.dismiss(loadingToast);
      toast.success(`${selectedItems.length} بنر با موفقیت حذف شدند`);
      setSelectedItems([]);
      setSelectAll(false);
      setShowBatchDeleteConfirm(false);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('❌ [MobileBannersTab] خطا در حذف گروهی:', error);
      toast.dismiss(loadingToast);
      toast.error('خطا در حذف گروهی بنرها');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleEditClick = (banner) => {
    setEditingBanner(banner);
  };

  const handleEditSave = async (id, data) => {
    await onEdit(id, data);
    setEditingBanner(null);
  };

  const handleAddBanner = async (data) => {
    try {
      await onAdd(data);
      setShowAddModal(false);
    } catch (error) {
      // خطا در خود onAdd مدیریت می‌شود
    }
  };

  return (
    <div className="pb-4">
      {/* سرتیتر */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold text-gray-800 relative inline-block pb-1.5">
          🖼️ بنرها
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-[#800E2F] text-white rounded-xl text-sm font-medium hover:bg-[#6B0A26] transition whitespace-nowrap"
        >
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
            placeholder="جستجوی بنر..."
            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
          />
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* انتخاب همه */}
      {filteredBanners.length > 0 && (
        <div className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F]"
          />
          <span className="text-xs text-gray-500">انتخاب همه ({filteredBanners.length})</span>
        </div>
      )}

      {/* نوار عملیات گروهی */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#800E2F]/5 rounded-xl border border-[#800E2F]/20">
          <span className="text-xs font-medium text-gray-700 mr-1">{selectedItems.length} انتخاب</span>
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="px-2 py-1 text-[10px] bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            🗑️ حذف
          </button>
        </div>
      )}

      {/* لیست بنرها */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
          <p className="text-sm text-gray-500">بنری یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredBanners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(banner.id)}
                  onChange={() => toggleSelection(banner.id)}
                  className="absolute top-1 right-1 z-10 w-4 h-4 rounded border-gray-300 text-[#800E2F] focus:ring-[#800E2F] bg-white/90"
                />
                <div className="relative h-32 bg-gray-100">
                  <img
                    src={getImageUrl(banner.image_url)}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/fallback-banner.jpg'; }}
                  />
                  <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-medium ${banner.is_active ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'}`}>
                    {banner.is_active ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <div className="p-2">
                  <h4 className="text-xs font-semibold text-gray-800 truncate">{banner.title || 'بدون عنوان'}</h4>
                  <p className="text-[8px] text-gray-400">{banner.position === 'home' ? 'صفحه اصلی' : 'دوگانه'}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <button
                      onClick={() => onToggle(banner.id, banner.is_active)}
                      className="flex-1 px-1.5 py-0.5 text-[8px] bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                    >
                      {banner.is_active ? 'غیرفعال' : 'فعال'}
                    </button>
                    <button
                      onClick={() => handleEditClick(banner)}
                      className="flex-1 px-1.5 py-0.5 text-[8px] bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(banner.id)}
                      className="flex-1 px-1.5 py-0.5 text-[8px] bg-red-50 text-red-500 rounded hover:bg-red-100 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Dialog حذف گروهی */}
      <CustomConfirm
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={handleBatchDelete}
        title="⚠️ حذف گروهی بنرها"
        message={`آیا از حذف ${selectedItems.length} بنر انتخاب‌شده مطمئن هستید؟`}
        confirmText="بله، حذف کن"
        cancelText="انصراف"
        variant="danger"
        loading={batchLoading}
      />

      {/* مودال افزودن بنر */}
      <MobileAddBannerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddBanner}
      />

      {/* مودال ویرایش بنر */}
      <MobileEditBannerModal
        isOpen={!!editingBanner}
        onClose={() => setEditingBanner(null)}
        banner={editingBanner}
        onSave={handleEditSave}
      />
    </div>
  );
}

export default MobileBannersTab;  