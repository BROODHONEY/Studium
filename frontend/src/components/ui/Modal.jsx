import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, children, className }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="presentation"
      onMouseDown={(e) => {
        // Close only when clicking the backdrop.
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={className || 'bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm'}
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

