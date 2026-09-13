// src/components/cart/AddressModal.jsx
import { useState, useEffect } from 'react';
import AddressSelector from './AddressSelector';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../shared/Button';

function AddressModal({ isOpen, onClose, onConfirm, loading }) {
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen]);

  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/addresses');
      if (res.data.success) {
        setAddresses(res.data.data);
        const defaultAddr = res.data.data.find(a => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (res.data.data.length > 0) {
          setSelectedAddressId(res.data.data[0].id);
        }
      }
    } catch (error) {
      toast.error('خطا در دریافت آدرس‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedAddressId) {
      toast.error('لطفاً یک آدرس انتخاب کنید');
      return;
    }
    onConfirm(selectedAddressId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-lg sm:max-w-sm max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        {/* هدر مودال */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 sm:pb-4 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-xl font-bold text-gray-800">📍 انتخاب آدرس تحویل</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* دکمه افزودن آدرس جدید */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-3 sm:mb-4 py-1.5 sm:py-2 text-xs sm:text-sm border-2 border-dashed border-[#800E2F] text-[#800E2F] rounded-lg hover:bg-[#800E2F]/5 transition font-medium"
        >
          {showAddForm ? '✕ بستن فرم' : '➕ افزودن آدرس جدید'}
        </button>

        {/* فرم افزودن آدرس (در صورت نمایش) */}
        {showAddForm && (
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 mb-3 sm:mb-4">
            <AddressSelector
              selectedAddressId={selectedAddressId}
              onAddressSelect={setSelectedAddressId}
              onAddressChange={() => {
                fetchAddresses();
                setShowAddForm(false);
              }}
              compact={false}
            />
          </div>
        )}

        {/* لیست آدرس‌ها */}
        {isLoading ? (
          <div className="flex justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-4 border-[#800E2F] border-t-transparent"></div>
          </div>
        ) : (
          <>
            {addresses.length === 0 ? (
              <div className="text-center py-4 sm:py-6">
                <p className="text-sm sm:text-base text-gray-500">هیچ آدرسی ثبت نشده است.</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  برای افزودن آدرس، روی دکمه «افزودن آدرس جدید» کلیک کنید.
                </p>
              </div>
            ) : (
              <AddressSelector
                selectedAddressId={selectedAddressId}
                onAddressSelect={setSelectedAddressId}
                onAddressChange={() => {}}
                compact={true}
              />
            )}

            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                onClick={handleConfirm}
                loading={loading}
                className="flex-1 text-xs sm:text-sm py-2 sm:py-2.5"
              >
                {loading ? 'در حال ثبت...' : '✅ ثبت سفارش'}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 text-xs sm:text-sm py-2 sm:py-2.5"
              >
                انصراف
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AddressModal;