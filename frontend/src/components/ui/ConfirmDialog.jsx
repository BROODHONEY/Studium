import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
  disabled = false,
  icon,
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold dark:text-white text-gray-900 mb-1.5">
            {icon ? <span className="mr-2">{icon}</span> : null}
            {title}
          </h3>
          {description ? (
            <p className="text-xs dark:text-gray-500 text-gray-500">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="flex-1 py-2.5 rounded-xl text-sm dark:text-gray-400 text-gray-600 dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 transition disabled:opacity-50">
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
            danger
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-brand-600 hover:bg-brand-500 text-white'
          }`}>
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
