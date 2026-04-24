import { useEffect, useRef } from 'react';

export default function Modal({ open = true, onClose, children, className }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Focus the close button for keyboard users.
    closeButtonRef.current?.focus?.();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: '0 16px' }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', fontFamily: 'Inter, sans-serif', ...className }}
        role="dialog"
        aria-modal="true"
      >
        {/* Hidden focus target for ESC/keyboard users */}
        <button
          ref={closeButtonRef}
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
          aria-label="Close dialog"
          onClick={onClose}
        />
        {children}
      </div>
    </div>
  );
}
