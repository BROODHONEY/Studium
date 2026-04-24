export default function ConfirmDialog({
  open, title, description,
  confirmText = 'Confirm', cancelText = 'Cancel',
  danger = false, onConfirm, onCancel, disabled = false, icon,
}) {
  void icon;
  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && !disabled && onCancel?.()}
    >
      {/* gradient glow */}
      <div style={{ position: 'absolute', width: 400, height: 280, background: `radial-gradient(ellipse at center, ${danger ? 'rgba(239,68,68,0.10)' : 'rgba(165,166,246,0.12)'} 0%, transparent 70%)`, pointerEvents: 'none', borderRadius: '50%' }} />

      <div
        style={{ width: '100%', maxWidth: 400, background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', fontFamily: 'Inter, sans-serif', position: 'relative', zIndex: 1 }}
        onClick={e => e.stopPropagation()}
      >
        {/* eyebrow */}
        <p style={{ fontSize: 10, fontWeight: 700, color: danger ? 'rgba(239,68,68,0.7)' : '#555', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 10px' }}>
          {danger ? 'Destructive Action' : 'Confirmation Required'}
        </p>

        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 10px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        {description && (
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: '0 0 28px' }}>
            {description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            style={{
              width: '100%', padding: '14px',
              background: danger ? 'rgba(239,68,68,0.75)' : 'rgba(165,166,246,0.75)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14, fontWeight: 500,
              letterSpacing: '0.01em',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.9)' : 'rgba(165,166,246,0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.75)' : 'rgba(165,166,246,0.75)'; }}
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            style={{
              width: '100%', padding: '13px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
              color: '#666', fontSize: 14, fontWeight: 400,
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#666'; }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
