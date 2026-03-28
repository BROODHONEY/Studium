import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { filesAPI } from '../../services/api';

const FILE_ICONS = {
  'application/pdf': '📄',
  'application/vnd.ms-powerpoint': '📊',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'image/jpeg': '🖼️', 'image/png': '🖼️',
};

/**
 * Renders via a portal so it's never clipped by overflow:hidden parents.
 * triggerRef — ref to the button that opens the popover (for positioning)
 * onPick(ref) — called with the {{file:...}} token to insert
 */
export default function FilePickerPopover({ groupId, onPick, onClose, triggerRef }) {
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [style, setStyle]     = useState({});
  const popoverRef = useRef(null);

  // Position relative to trigger button
  useEffect(() => {
    if (!triggerRef?.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const popH = 280;
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow >= popH ? r.bottom + 4 : r.top - popH - 4;
    setStyle({
      position: 'fixed',
      top,
      left: Math.min(r.left, window.innerWidth - 290),
      width: 280,
      zIndex: 9999,
    });
  }, [triggerRef]);

  useEffect(() => {
    filesAPI.list(groupId)
      .then(res => setFiles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (popoverRef.current && !popoverRef.current.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [onClose]);

  const filtered = files.filter(f =>
    !search.trim() || f.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handlePick = (file) => {
    const token = `{{file:${file.id}:${file.filename}:${file.file_url}}}`;
    onPick(token);
    onClose();
  };

  return createPortal(
    <div ref={popoverRef} style={style}
      className="dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-3 py-2 border-b dark:border-gray-800 border-gray-100">
        <p className="text-xs font-semibold dark:text-gray-300 text-gray-700 mb-1.5">Attach file reference</p>
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search files…"
          className="w-full text-xs dark:bg-gray-800 bg-gray-100 dark:text-white text-gray-900
            dark:placeholder-gray-500 placeholder-gray-400 rounded-lg px-2.5 py-1.5 outline-none
            dark:border-gray-700 border-gray-200 border"/>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {loading
          ? <p className="text-xs dark:text-gray-500 text-gray-400 px-3 py-4 text-center">Loading…</p>
          : filtered.length === 0
            ? <p className="text-xs dark:text-gray-500 text-gray-400 px-3 py-4 text-center italic">
                {files.length === 0 ? 'No files uploaded yet' : 'No matches'}
              </p>
            : filtered.map(file => (
              <button key={file.id} onClick={() => handlePick(file)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left dark:hover:bg-gray-800 hover:bg-gray-50 transition">
                <span className="text-base flex-shrink-0">{FILE_ICONS[file.file_type] || '📎'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs dark:text-white text-gray-900 font-medium truncate">{file.filename}</p>
                  <p className="text-[10px] dark:text-gray-500 text-gray-400 mt-0.5">{file.users?.name}</p>
                </div>
              </button>
            ))
        }
      </div>
    </div>,
    document.body
  );
}
