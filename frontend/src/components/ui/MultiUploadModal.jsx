import { useState, useRef, useCallback } from 'react';
import AnimatedContent from '../AnimatedContent';

const FILE_ICONS = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'image/jpeg': 'img', 'image/png': 'img', 'image/gif': 'img', 'image/webp': 'img',
};
const TYPE_COLOR  = { pdf: '#ef4444', ppt: '#f97316', doc: '#3b82f6', img: '#10b981', file: '#666' };
const TYPE_LABEL  = { pdf: 'PDF DOCUMENT', ppt: 'PRESENTATION', doc: 'DOCUMENT', img: 'IMAGE', file: 'FILE' };

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

function FileRow({ item, onRemove }) {
  const { file, status, error } = item;
  const kind  = FILE_ICONS[file.type] || 'file';
  const color = TYPE_COLOR[kind];
  const label = TYPE_LABEL[kind];
  const isDone    = status === 'done';
  const isError   = status === 'error';
  const isLoading = status === 'uploading';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: 10,
      background: isDone ? 'rgba(34,197,94,0.05)' : isError ? 'rgba(239,68,68,0.05)' : '#0d0d10',
      border: `1px solid ${isDone ? 'rgba(34,197,94,0.15)' : isError ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)'}`,
      transition: 'all 0.15s',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 16 16" fill={color}>
          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
        <p style={{ fontSize: 11, color: isError ? '#ef4444' : '#555', margin: '3px 0 0' }}>
          {isError ? error : `${formatSize(file.size)} · ${label}`}
        </p>
      </div>
      {isLoading && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(165,166,246,0.2)', borderTopColor: '#A5A6F6', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
      {isDone && <svg width="16" height="16" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>}
      {isError && <svg width="16" height="16" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
      {status === 'pending' && (
        <button onClick={() => onRemove(item.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 4, lineHeight: 0, flexShrink: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      )}
    </div>
  );
}

let _id = 0;
const uid = () => String(++_id);

export default function MultiUploadModal({ onUpload, onClose }) {
  const [items, setItems]         = useState([]);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const newItems = Array.from(fileList).map(file => ({ id: uid(), file, status: 'pending', error: null }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); };
  const onDrop      = (e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); };

  const pendingItems = items.filter(i => i.status === 'pending');
  const doneCount    = items.filter(i => i.status === 'done').length;
  const errorCount   = items.filter(i => i.status === 'error').length;
  const allDone      = items.length > 0 && items.every(i => i.status === 'done' || i.status === 'error');

  const handleUpload = async () => {
    if (!pendingItems.length) return;
    setUploading(true);
    for (const item of pendingItems) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        const result = await onUpload(formData);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done', result } : i));
      } catch (err) {
        const msg = err?.response?.data?.error || 'Upload failed';
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: msg } : i));
      }
    }
    setUploading(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={e => e.target === e.currentTarget && !uploading && onClose()}
    >
      <div style={{ position: 'absolute', width: 520, height: 360, background: 'radial-gradient(ellipse at center, rgba(165,166,246,0.10) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

      <AnimatedContent immediate distance={18} duration={0.3} ease="power3.out" scale={0.97}
        style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>
      <div style={{ width: '100%', background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>

        <div style={{ padding: '28px 32px 0' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 8px' }}>Action Required</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 6px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Upload Files</h2>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
                {items.length === 0 ? 'Select or drop files to upload' : `${items.length} file${items.length !== 1 ? 's' : ''} queued`}
              </p>
            </div>
            {!uploading && (
              <button onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', transition: 'all 0.2s', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#666'; }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '20px 32px 0' }}>
          <div
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            style={{ border: `2px dashed ${dragging ? 'rgba(165,166,246,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', background: dragging ? 'rgba(165,166,246,0.05)' : 'transparent', transition: 'all 0.2s' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: dragging ? 'rgba(165,166,246,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dragging ? 'rgba(165,166,246,0.3)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'all 0.2s' }}>
              <svg width="18" height="18" fill="none" stroke={dragging ? '#A5A6F6' : '#555'} strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: dragging ? '#A5A6F6' : '#888', margin: '0 0 4px', transition: 'color 0.2s' }}>
              {dragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
              or <span style={{ color: '#A5A6F6', fontWeight: 500 }}>browse</span> to select
            </p>
            <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
        </div>

        {items.length > 0 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 32px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => <FileRow key={item.id} item={item} onRemove={removeItem} />)}
          </div>
        )}

        <div style={{ padding: '20px 32px 28px', borderTop: items.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', marginTop: 20 }}>
          {allDone && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              {doneCount > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: '#22c55e' }}>{doneCount} uploaded successfully</span>}
              {errorCount > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: '#ef4444' }}>{errorCount} failed</span>}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose} disabled={uploading}
              style={{ padding: '14px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#666', fontSize: 11, fontWeight: 400, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              onMouseEnter={e => { if (!uploading) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#666'; }}
            >
              {allDone ? 'Close' : 'Cancel Action'}
            </button>
            {!allDone && (
              <button
                onClick={handleUpload} disabled={uploading || pendingItems.length === 0}
                style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: pendingItems.length === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(165,166,246,0.75)', color: pendingItems.length === 0 ? '#444' : '#fff', fontSize: 11, fontWeight: 600, cursor: pendingItems.length === 0 || uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.8 : 1, transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onMouseEnter={e => { if (!uploading && pendingItems.length > 0) e.currentTarget.style.background = 'rgba(165,166,246,0.9)'; }}
                onMouseLeave={e => { if (pendingItems.length > 0) e.currentTarget.style.background = 'rgba(165,166,246,0.75)'; }}
              >
                {uploading
                  ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> Uploading...</>
                  : <>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Confirm Upload{pendingItems.length > 0 ? ` · ${pendingItems.length}` : ''}
                    </>
                }
              </button>
            )}
          </div>
        </div>
      </div>
      </AnimatedContent>
    </div>
  );
}
