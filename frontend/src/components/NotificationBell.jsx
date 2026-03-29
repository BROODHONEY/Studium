import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../context/NotificationContext';
import { formatTime } from '../utils/time';

const TYPE_ICONS = {
  message:      { icon: '💬', color: 'text-brand-400' },
  announcement: { icon: '📢', color: 'text-amber-400' },
  due:          { icon: '📅', color: 'text-red-400' },
};

export default function NotificationBell({ onNavigate, inline }) {
  const { notifications, hasUnread, markRead, clear, dismiss } = useNotifications();
  const [open, setOpen]   = useState(false);
  const [pos, setPos]     = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const unread = notifications.length;

  // Inline mode — render list directly in parent container
  if (inline) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
          <span className="text-xs text-white/40 font-light uppercase tracking-wide">
            {unread > 0 ? `${unread} notification${unread !== 1 ? 's' : ''}` : 'All caught up'}
          </span>
          {unread > 0 && (
            <button onClick={clear} className="text-xs text-white/30 hover:text-white/60 transition font-light">
              Clear all
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" className="text-white/10">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z"/>
              </svg>
              <p className="text-xs text-white/20 font-light">No notifications</p>
            </div>
          ) : notifications.map(n => {
            const { icon, color } = TYPE_ICONS[n.type] || TYPE_ICONS.message;
            return (
              <div key={n.id}
                onClick={() => { onNavigate?.(n); dismiss(n.id); markRead(); }}
                className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition cursor-pointer group">
                <span className={`text-sm flex-shrink-0 mt-0.5 ${color}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-normal text-white/70 truncate">{n.title}</p>
                  <p className="text-xs text-white/30 mt-0.5 line-clamp-2 font-light">{n.body}</p>
                  <p className="text-[10px] text-white/20 mt-1 font-light">{formatTime(n.at)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                  className="opacity-0 group-hover:opacity-100 transition text-white/20 hover:text-white/50 flex-shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const openPanel = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setOpen(true);
    markRead(); // mark as seen when panel opens
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (!btnRef.current?.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [open]);

  return (
    <>
      <button ref={btnRef} onClick={openPanel}
        className={`relative p-1.5 rounded-lg border transition
          ${open
            ? 'bg-brand-600 border-brand-500 text-white'
            : 'dark:bg-surface-2 dark:border-brand-900/40 dark:text-gray-400 dark:hover:text-brand-300 bg-gray-100 border-gray-200 text-gray-500 hover:text-brand-600'}`}
        title="Notifications">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
        </svg>
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 dark:ring-surface-2 ring-white animate-pulse"/>
        )}
        {!hasUnread && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999, width: 320 }}
          className="dark:bg-surface-1 bg-white border dark:border-brand-900/40 border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
          onMouseDown={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-brand-900/40 border-gray-100">
            <span className="text-sm font-semibold dark:text-white text-gray-900">Notifications</span>
            {unread > 0 && (
              <button onClick={clear}
                className="text-xs dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 transition">
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor" className="mx-auto mb-2 dark:text-gray-700 text-gray-300">
                  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>
                <p className="text-xs dark:text-gray-600 text-gray-400">You're all caught up</p>
              </div>
            ) : (
              notifications.map(n => {
                const { icon, color } = TYPE_ICONS[n.type] || TYPE_ICONS.message;
                return (
                  <div key={n.id}
                    onClick={() => { onNavigate?.(n); dismiss(n.id); setOpen(false); }}
                    className="flex items-start gap-3 px-4 py-3 border-b dark:border-brand-900/20 border-gray-50 dark:hover:bg-surface-2 hover:bg-gray-50 transition cursor-pointer group">
                    <span className={`text-base flex-shrink-0 mt-0.5 ${color}`}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium dark:text-white text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] dark:text-gray-600 text-gray-400 mt-1">{formatTime(n.at)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                      className="opacity-0 group-hover:opacity-100 transition dark:text-gray-600 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
