import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '../context/NotificationContext';
import { formatTime } from '../utils/time';

const TYPE_ICONS = {
  message:      { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="#6366F1"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793V2z"/></svg> },
  announcement: { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="#d97706"><path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-.214c-2.162-1.241-4.49-1.843-6.912-2.083l.405 2.712A1 1 0 0 1 5.51 15.1h-.548a1 1 0 0 1-.916-.599l-1.85-3.49-.202-.003A2.014 2.014 0 0 1 0 9V7a2.02 2.02 0 0 1 1.992-2.013 74.663 74.663 0 0 0 2.483-.075c3.043-.154 6.148-.849 8.525-2.199V2.5zm1 0v11a.5.5 0 0 0 1 0v-11a.5.5 0 0 0-1 0zm-1 1.35C10.72 4.555 8.055 5.11 5.005 5.27c-.988.05-1.975.09-2.96.11a1.01 1.01 0 0 0-.005.12v2c0 .55.45 1 1.002 1h.114c.022 0 .045.002.068.004l1.928 3.639h.348l-.405-2.712c-.07-.467.287-.888.759-.888 2.44 0 4.827.583 7.151 1.686V3.85z"/></svg> },
  due:          { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="#ef4444"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg> },
};

export default function NotificationBell({ onNavigate, inline, onOpenPanel }) {
  const { notifications, markRead, clear, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef  = useRef(null);
  const dropRef = useRef(null);
  const unread  = notifications.length;

  // Hooks must always run  ÂÂ· before any early return
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target))
        setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [open]);

  // -- Inline mode (panel / mobile) ----------------------
  if (inline) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {unread > 0 ? `${unread} notification${unread !== 1 ? 's' : ''}` : 'All caught up'}
          </span>
          {unread > 0 && (
            <button onClick={clear} style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear all
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8 }}>
              <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-3)' }}>
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z"/>
              </svg>
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 300 }}>No notifications</p>
            </div>
          ) : notifications.map(n => {
            const { icon } = TYPE_ICONS[n.type] || TYPE_ICONS.message;
            return (
              <div key={n.id}
                onClick={() => { onNavigate?.(n); dismiss(n.id); markRead(); }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '3px 0 0' }}>{formatTime(n.at)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, lineHeight: 0, flexShrink: 0 }}>
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

  // -- Bell button + dropdown -----------------------------
  const openDropdown = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const left = r.right + 8;
      // Clamp top so the dropdown (max ~380px tall) doesn't overflow the bottom
      const maxTop = window.innerHeight - 400;
      const top = Math.min(r.top, Math.max(8, maxTop));
      setPos({ top, left });
    }
    setOpen(true);
    markRead();
  };

  return (
    <>
      <button ref={btnRef} onClick={openDropdown} title="Notifications"
        style={{
          width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          background: open ? 'rgba(99,102,241,0.14)' : 'none',
          color: open ? '#6366F1' : 'var(--text-3)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#6366F1'; }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? 'rgba(99,102,241,0.14)' : 'none'; e.currentTarget.style.color = open ? '#6366F1' : 'var(--text-3)'; }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
        </svg>
        {unread > 0 && (
          <span className="badge-pop" style={{ position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div ref={dropRef}
          style={{ position: 'fixed', top: pos.top, left: Math.min(pos.left, window.innerWidth - 316), zIndex: 9999, width: 300, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', fontFamily: 'Inter, sans-serif' }}
          className="dropdown-enter"
          onMouseDown={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={clear} style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                Clear all
              </button>
            )}
          </div>

          {/* List  ÂÂ· up to 5 items */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }}>
                  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917z"/>
                </svg>
                <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 300, margin: 0 }}>You're all caught up</p>
              </div>
            ) : notifications.slice(0, 5).map(n => {
              const { icon } = TYPE_ICONS[n.type] || TYPE_ICONS.message;
              return (
                <div key={n.id}
                  onClick={() => { onNavigate?.(n); dismiss(n.id); setOpen(false); }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '3px 0 0' }}>{formatTime(n.at)}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, lineHeight: 0, flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => { setOpen(false); onOpenPanel?.(); }}
              style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366F1', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}>
              All notifications
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
