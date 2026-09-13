// src/components/shared/CustomConfirm.jsx
import Modal from './Modal';
import Button from './Button';

function CustomConfirm({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأیید عملیات',
  message = 'آیا از انجام این عملیات مطمئن هستید؟',
  confirmText = 'تأیید',
  cancelText = 'انصراف',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="py-4">
        <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-6">
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmText}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CustomConfirm;