import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  useEffect(() => {
    return () => {
      // Cleanup any outstanding timers on unmount.
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
  };

  const addToast = ({ type = 'success', message, durationMs = 4000 }) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        message: message || '',
      },
    ]);

    const timer = setTimeout(() => removeToast(id), durationMs);
    timersRef.current.set(id, timer);
    return id;
  };

  const value = useMemo(() => ({ addToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-[92%] max-w-sm">
        {toasts.map((t) => {
          const tone =
            t.type === 'error'
              ? {
                  bg: 'bg-red-500/10',
                  border: 'border-red-500/30',
                  text: 'text-red-400',
                }
              : t.type === 'warning'
                ? {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/30',
                    text: 'text-amber-400',
                  }
                : {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/30',
                    text: 'text-emerald-400',
                  };

          return (
            <div
              key={t.id}
              className={`rounded-xl border ${tone.bg} ${tone.border} p-3 shadow-lg backdrop-blur bg-gray-900/60`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`text-xs font-medium ${tone.text} flex-1`}>{t.message}</p>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-300 transition text-xs"
                  onClick={() => removeToast(t.id)}
                  aria-label="Dismiss toast"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

