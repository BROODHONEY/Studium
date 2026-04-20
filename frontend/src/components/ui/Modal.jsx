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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={className || 'bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl'}
        role="dialog"
        aria-modal="true"
      >
        {/* Hidden focus target for ESC/keyboard users */}
        <button
          ref={closeButtonRef}
          className="sr-only"
          aria-label="Close dialog"
          onClick={onClose}
        />
        {children}
      </div>
    </div>
  );
}

