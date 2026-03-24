import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

/**
 * anchorRect – DOMRect captured at click time (getBoundingClientRect())
 * isOwn      – aligns menu left or right
 */
export default function MessageMenu({
  anchorRect, isOwn, onClose,
  onReact, onReply, onEdit, onDelete,
  onPin, pinned, onPrivateReply,
}) {
  const menuRef = useRef(null);

  const menuH = 220;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openDown = spaceBelow >= menuH || spaceBelow > anchorRect.top;

  const style = {
    position: 'fixed',
    zIndex: 9999,
    width: '11rem',
    ...(openDown
      ? { top: anchorRect.bottom + 4 }
      : { bottom: window.innerHeight - anchorRect.top + 4 }),
    ...(isOwn
      ? { right: window.innerWidth - anchorRect.right }
      : { left: anchorRect.left }),
  };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      style={style}
      onClick={e => e.stopPropagation()}
      className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl"
    >
      {/* Emoji row */}
      <div className="flex justify-around px-2 py-2 border-b border-gray-800">
        {EMOJI_OPTIONS.map(e => (
          <button key={e}
            onClick={() => { onReact(e); onClose(); }}
            className="text-base hover:scale-125 transition-transform leading-none p-0.5">
            {e}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="py-1">
        <button onClick={() => { onReply(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition text-left">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="text-green-400 flex-shrink-0">
            <path d="M6.598 5.013a.144.144 0 0 1 .202.134V6.3a.5.5 0 0 0 .5.5c.667 0 2.013.005 3.3.822.984.624 1.99 1.76 2.595 3.876-1.02-.983-2.185-1.516-3.205-1.799a8.74 8.74 0 0 0-1.921-.306 7.404 7.404 0 0 0-.798.008h-.013l-.005.001h-.001L7.3 9.9l-.05-.498a.5.5 0 0 0-.45.498v1.153c0 .108-.11.176-.202.134L2.614 8.254a.503.503 0 0 0-.042-.028.147.147 0 0 1 0-.252.499.499 0 0 0 .042-.028l3.984-2.933z"/>
          </svg>
          Reply
        </button>

        {onPrivateReply && (
          <button onClick={() => { onPrivateReply(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition text-left">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="text-purple-400 flex-shrink-0">
              <path d="M8 1a5 5 0 0 0-5 5v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a6 6 0 1 1 12 0v6a2.5 2.5 0 0 1-2.5 2.5H9.366a1 1 0 0 1-.866.5h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 .866.5H11.5A1.5 1.5 0 0 0 13 12h-1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1V6a5 5 0 0 0-5-5z"/>
            </svg>
            Reply privately
          </button>
        )}

        {onPin && (
          <button onClick={() => { onPin(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition text-left">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className={`flex-shrink-0 ${pinned ? 'text-indigo-400' : 'text-gray-500'}`}>
              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
            </svg>
            {pinned ? 'Unpin' : 'Pin'}
          </button>
        )}

        {onEdit && (
          <button onClick={() => { onEdit(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition text-left">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-blue-400 flex-shrink-0">
              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
            </svg>
            Edit
          </button>
        )}

        {onDelete && (
          <button onClick={() => { onDelete(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-gray-800 transition text-left">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66H14.5a.5.5 0 0 0 0-1h-.996a.59.59 0 0 0-.01 0zM3.04 3.5h9.92l-.845 10.56a1 1 0 0 1-.997.94h-6.23a1 1 0 0 1-.997-.94z"/>
            </svg>
            Delete
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
