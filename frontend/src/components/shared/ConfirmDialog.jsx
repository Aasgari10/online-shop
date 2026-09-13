// src/components/shared/ConfirmDialog.jsx
import Button from './Button';
import Modal from './Modal';

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأیید حذف',
  message = 'آیا از انجام این عملیات مطمئن هستید؟',
  confirmText = 'تأیید',
  cancelText = 'انصراف',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="py-2">
        <p className="text-gray-600">{message}</p>
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

export default ConfirmDialog;