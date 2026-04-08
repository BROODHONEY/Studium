import { useState, useRef, useCallback } from 'react';

const C = {
  surface:    '#1E1E1E',
  raised:     '#252525',
  border:     '#333333',
  borderHi:   '#444444',
  primary:    '#C0C1FF',
  primaryLo:  'rgba(192,193,255,0.12)',
  primaryMid: 'rgba(192,193,255,0.22)',
  secondary:  '#FFB38E',
  text1:      '#F0F0F0',
  text2:      '#9090A8',
  text3:      '#555566',
  danger:     '#EF4444',
  dangerLo:   'rgba(239,68,68,0.10)',
  success:    '#22C55E',
  successLo:  'rgba(34,197,94,0.10)',
};

const FILE_ICONS = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'image/jpeg': 'img', 'image/png': 'img', 'image/gif': 'img', 'image/webp': 'img',
};
const TYPE_COLOR = { pdf: '#ef4444', ppt: '#f97316', doc: '#3b82f6', img: '#10b981', file: C.text3 };

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

function FileIcon({ type, size = 16 }) {
  const kind = FILE_ICONS[type] || 'file';
  const color = TYPE_COLOR[kind];
  return (
    <div style={{ width: size + 12, height: size + 12, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
      </svg>
    </div>
  );
}

// status: 'pending' | 'uploading' | 'done' | 'error'
function FileItem({ item, onRemove }) {
  const { file, status, error } = item;
  const isDone    = status === 'done';
  const isError   = status === 'error';
  const isLoading = status === 'uploading';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 10,
      background: isDone ? 'rgba(34,197,94,0.06)' : isError ? C.dangerLo : C.raised,
      border: `1px solid ${isDone ? 'rgba(34,197,94,0.20)' : isError ? 'rgba(239,68,68,0.20)' : C.border}`,
      transition: 'all 0.15s',
    }}>
      <FileIcon type={file.type} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </p>
        <p style={{ fontSize: 11, color: isError ? C.danger : C.text3, margin: '2px 0 0', fontWeight: 300 }}>
          {isError ? error : formatSize(file.size)}
        </p>
      </div>

      {/* Status indicator */}
      {isLoading && (
        <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${C.primaryMid}`, borderTopColor: C.primary, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
      )}
      {isDone && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill={C.success} style={{ flexShrink: 0 }}>
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>
      )}
      {isError && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill={C.danger} style={{ flexShrink: 0 }}>
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
        </svg>
      )}
      {status === 'pending' && (
        <button onClick={() => onRemove(item.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 2, lineHeight: 0, flexShrink: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = C.danger}
          onMouseLeave={e => e.currentTarget.style.color = C.text3}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

let _id = 0;
const uid = () => String(++_id);

export default function MultiUploadModal({ onUpload, onClose }) {
  const [items, setItems]     = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const newItems = Array.from(fileList).map(file => ({ id: uid(), file, status: 'pending', error: null }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));

  // Drag handlers
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={e => e.target === e.currentTarget && !uploading && onClose()}
    >
      <div style={{ width: '100%', maxWidth: 520, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.85)', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: 0 }}>Upload Files</p>
            <p style={{ fontSize: 12, fontWeight: 300, color: C.text3, margin: '3px 0 0' }}>
              {items.length === 0 ? 'Select or drop files to upload' : `${items.length} file${items.length !== 1 ? 's' : ''} queued`}
            </p>
          </div>
          {!uploading && (
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 4, lineHeight: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.text1}
              onMouseLeave={e => e.currentTarget.style.color = C.text3}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? C.primary : C.border}`,
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              background: dragging ? C.primaryLo : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: dragging ? C.primaryMid : C.raised, border: `1px solid ${dragging ? C.primary : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'all 0.15s' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill={dragging ? C.primary : C.text3}>
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
              </svg>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, color: dragging ? C.primary : C.text2, margin: '0 0 4px', transition: 'color 0.15s' }}>
              {dragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p style={{ fontSize: 11, fontWeight: 300, color: C.text3, margin: 0 }}>
              or <span style={{ color: C.primary, fontWeight: 500 }}>browse</span> to select
            </p>
            <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
        </div>

        {/* File list */}
        {items.length > 0 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <FileItem key={item.id} item={item} onRemove={removeItem} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: items.length > 0 ? `1px solid ${C.border}` : 'none', flexShrink: 0 }}>
          {/* Summary when done */}
          {allDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {doneCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 500, color: C.success }}>
                  {doneCount} uploaded successfully
                </span>
              )}
              {errorCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 500, color: C.danger }}>
                  · {errorCount} failed
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {!allDone && (
              <button
                onClick={handleUpload}
                disabled={uploading || pendingItems.length === 0}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: pendingItems.length === 0 ? C.raised : C.primary,
                  border: 'none', color: pendingItems.length === 0 ? C.text3 : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: pendingItems.length === 0 || uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.8 : 1, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {uploading ? (
                  <>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                    Uploading…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                    </svg>
                    Upload {pendingItems.length > 0 ? `${pendingItems.length} file${pendingItems.length !== 1 ? 's' : ''}` : 'Files'}
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={uploading}
              style={{ flex: allDone ? 1 : 'none', padding: '12px 20px', borderRadius: 12, background: allDone ? C.primary : C.raised, border: `1px solid ${allDone ? 'transparent' : C.border}`, color: allDone ? '#fff' : C.text2, fontSize: 13, fontWeight: allDone ? 700 : 400, cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
            >
              {allDone ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
