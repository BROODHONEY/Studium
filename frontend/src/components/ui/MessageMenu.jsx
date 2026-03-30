import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function MenuItem({ icon, label, onClick, danger, disabled }) {
  const [hov, setHov] = useState(false);
  if (!onClick) return null;
  return (
    <button
      onClick={() => { if (!disabled) onClick(); }}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', background: hov && !disabled ? 'rgba(255,255,255,0.05)' : 'none',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
        opacity: disabled ? 0.4 : 1, transition: 'background 0.1s', fontFamily: 'Inter, sans-serif',
      }}>
      <span style={{ color: danger ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.35)', flexShrink: 0, lineHeight: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 300, color: danger ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.65)' }}>{label}</span>
    </button>
  );
}

export default function MessageMenu({
  anchorRect, isOwn, onClose,
  onReact, onReply, onEdit, onDelete,
  onPin, pinned, pinDisabled, onPrivateReply,
}) {
  const menuRef = useRef(null);
  const MENU_W = 176;
  const MARGIN = 8;
  const menuH = 260;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openDown = spaceBelow >= menuH || spaceBelow > anchorRect.top;

  // Horizontal: prefer aligning to the anchor side, but clamp to viewport
  let left, right;
  if (isOwn) {
    // Own messages — align right edge of menu to right edge of anchor
    const rawRight = window.innerWidth - anchorRect.right;
    right = Math.max(MARGIN, rawRight);
    // If that would push left edge off screen, switch to left-anchored
    const computedLeft = window.innerWidth - right - MENU_W;
    if (computedLeft < MARGIN) right = window.innerWidth - MENU_W - MARGIN;
  } else {
    // Others' messages — align left edge of menu to left edge of anchor
    left = Math.max(MARGIN, anchorRect.left);
    if (left + MENU_W > window.innerWidth - MARGIN) left = window.innerWidth - MENU_W - MARGIN;
  }

  const posStyle = {
    position: 'fixed',
    zIndex: 9999,
    width: MENU_W,
    ...(openDown ? { top: anchorRect.bottom + 6 } : { bottom: window.innerHeight - anchorRect.top + 6 }),
    ...(isOwn ? { right } : { left }),
  };

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const hasActions = onReply || onPrivateReply || onPin || onEdit || onDelete;

  return createPortal(
    <div ref={menuRef} onClick={e => e.stopPropagation()}
      style={{
        ...posStyle,
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}>

      {/* Emoji row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 10px', borderBottom: hasActions ? '1px solid #1c1c1c' : 'none' }}>
        {EMOJI_OPTIONS.map(e => (
          <button key={e} onClick={() => { onReact(e); onClose(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '2px 3px', borderRadius: 6, transition: 'transform 0.1s' }}
            onMouseEnter={el => el.currentTarget.style.transform = 'scale(1.3)'}
            onMouseLeave={el => el.currentTarget.style.transform = 'scale(1)'}>
            {e}
          </button>
        ))}
      </div>

      {/* Action items */}
      {hasActions && (
        <div style={{ padding: '4px 0' }}>
          <MenuItem label="Reply" onClick={onReply}
            icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.74 8.74 0 0 0-1.921-.306 7.404 7.404 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.499.499 0 0 0 .042-.028l3.984-2.933z"/></svg>}
          />
          <MenuItem label="Reply privately" onClick={onPrivateReply}
            icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5z"/></svg>}
          />
          <MenuItem label={pinned ? 'Unpin' : pinDisabled ? 'Pin (max 4)' : 'Pin'} onClick={onPin} disabled={pinDisabled}
            icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/></svg>}
          />
          <MenuItem label="Edit" onClick={onEdit}
            icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>}
          />
          <MenuItem label="Delete" onClick={onDelete} danger
            icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66H14.5a.5.5 0 0 0 0-1h-.996a.59.59 0 0 0-.01 0zM3.04 3.5h9.92l-.845 10.56a1 1 0 0 1-.997.94h-6.23a1 1 0 0 1-.997-.94z"/></svg>}
          />
        </div>
      )}
    </div>,
    document.body
  );
}
