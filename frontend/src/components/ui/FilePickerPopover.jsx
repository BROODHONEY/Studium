import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { filesAPI } from '../../services/api';

const TYPE_MAP = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'image/jpeg': 'img',
  'image/png': 'img',
};

const TYPE_COLORS = {
  pdf:  '#ef4444',
  ppt:  '#f97316',
  doc:  '#3b82f6',
  img:  '#10b981',
  file: 'rgba(255,255,255,0.3)',
};

function FileIcon({ mimeType }) {
  const kind = TYPE_MAP[mimeType] || 'file';
  const color = TYPE_COLORS[kind];
  return (
    <div style={{ width: 32, height: 32, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill={color}>
        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
      </svg>
    </div>
  );
}

export default function FilePickerPopover({ groupId, onPick, onClose, triggerRef }) {
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [pos, setPos]         = useState({ top: 0, left: 0, openUp: false });
  const popoverRef = useRef(null);
  const POP_W = 300;
  const POP_H = 320;

  // Compute position anchored to the trigger button
  useEffect(() => {
    const el = triggerRef?.current;
    if (!el) return;

    const recompute = () => {
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const openUp = spaceBelow < POP_H && r.top > POP_H;
      // Align right edge of popover with right edge of trigger
      let left = r.right - POP_W;
      if (left < 8) left = 8;
      if (left + POP_W > window.innerWidth - 8) left = window.innerWidth - POP_W - 8;
      setPos({ top: openUp ? r.top - POP_H - 4 : r.bottom + 4, left, openUp });
    };

    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [triggerRef]);

  useEffect(() => {
    filesAPI.list(groupId)
      .then(res => setFiles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          triggerRef?.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
  }, [onClose, triggerRef]);

  const filtered = files.filter(f =>
    !search.trim() || f.filename.toLowerCase().includes(search.toLowerCase())
  );

  const handlePick = (file) => {
    onPick(`{{file:${file.id}:${file.filename}:${file.file_url}}}`);
    onClose();
  };

  return createPortal(
    <div ref={popoverRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: POP_W,
        zIndex: 9999,
        background: '#111111',
        border: '1px solid #2a2a2a',
        borderRadius: 12,
        boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #1c1c1c' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>Attach file</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', lineHeight: 0, padding: 2 }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
            </svg>
          </button>
        </div>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 8, padding: '7px 10px' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search files…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}/>
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', lineHeight: 0, padding: 0 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 44, borderRadius: 8, background: '#0d0d0d' }}/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.2)', padding: '20px', textAlign: 'center', fontStyle: 'italic' }}>
            {files.length === 0 ? 'No files uploaded yet' : 'No matches'}
          </p>
        ) : (
          filtered.map(file => (
            <button key={file.id} onClick={() => handlePick(file)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <FileIcon mimeType={file.file_type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</p>
                <p style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>{file.users?.name}</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>
                <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
