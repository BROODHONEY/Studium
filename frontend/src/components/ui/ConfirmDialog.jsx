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
  void icon;
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && !disabled && onCancel?.()}
    >
      <div
        style={{
          width: '100%', maxWidth: 380,
          background: '#1A1A1F', borderRadius: 18,
          padding: 28,
          boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
          fontFamily: 'Inter, sans-serif',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#EEEEF5', margin: '0 0 10px' }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: 13, fontWeight: 300, color: '#9898B0', lineHeight: 1.6, margin: '0 0 24px' }}>
            {description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            style={{
              width: '100%', padding: '14px',
              background: danger
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : 'linear-gradient(135deg, #5B5FEF, #4338CA)',
              border: 'none', borderRadius: 12,
              color: '#fff', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'opacity 0.15s',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            style={{
              width: '100%', padding: '12px',
              background: 'none', border: 'none',
              color: '#55556A', fontSize: 13, fontWeight: 400,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.color = '#9898B0'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#55556A'; }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
