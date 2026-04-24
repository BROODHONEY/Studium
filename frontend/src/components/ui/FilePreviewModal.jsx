import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const C = {
  bg:       '#111113',
  surface:  '#1A1A1E',
  raised:   '#252528',
  border:   '#333336',
  borderHi: '#444448',
  primary:  '#C0C1FF',
  primaryLo:'rgba(192,193,255,0.12)',
  secondary:'#FFB38E',
  text1:    '#F0F0F0',
  text2:    '#9090A8',
  text3:    '#555566',
  danger:   '#EF4444',
  success:  '#22C55E',
};

const FILE_KIND = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'image/jpeg': 'img', 'image/png': 'img', 'image/gif': 'img',
  'image/webp': 'img', 'image/svg+xml': 'img',
  'text/plain': 'txt', 'text/csv': 'txt',
  'video/mp4': 'video', 'video/webm': 'video', 'video/ogg': 'video',
  'audio/mpeg': 'audio', 'audio/ogg': 'audio', 'audio/wav': 'audio',
};

const KIND_COLOR = {
  pdf: '#ef4444', ppt: '#f97316', doc: '#3b82f6',
  img: '#10b981', txt: '#8b5cf6', video: '#ec4899',
  audio: '#f59e0b', file: C.text3,
};

const KIND_LABEL = {
  pdf: 'PDF', ppt: 'Presentation', doc: 'Document',
  img: 'Image', txt: 'Text', video: 'Video',
  audio: 'Audio', file: 'File',
};

const formatSize = (bytes) => {
  if (!bytes) return ' · · ';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

function BigFileIcon({ kind }) {
  const color = KIND_COLOR[kind] || KIND_COLOR.file;
  return (
    <div style={{ width: 80, height: 80, borderRadius: 20, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      <svg width="36" height="36" viewBox="0 0 16 16" fill={color}>
        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
      </svg>
    </div>
  );
}

function PreviewContent({ file, kind }) {
  const [textContent, setTextContent] = useState(null);
  const [textError, setTextError]     = useState(false);

  useEffect(() => {
    if (kind !== 'txt') return;
    fetch(file.file_url)
      .then(r => r.text())
      .then(t => setTextContent(t))
      .catch(() => setTextError(true));
  }, [file.file_url, kind]);

  if (kind === 'img') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: C.bg, borderRadius: 12 }}>
        <img
          src={file.file_url}
          alt={file.filename}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
        />
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <iframe
        src={`${file.file_url}#toolbar=0`}
        title={file.filename}
        style={{ flex: 1, width: '100%', border: 'none', borderRadius: 12, background: '#fff' }}
      />
    );
  }

  if (kind === 'video') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, borderRadius: 12 }}>
        <video
          src={file.file_url}
          controls
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, outline: 'none' }}
        />
      </div>
    );
  }

  if (kind === 'audio') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: C.bg, borderRadius: 12 }}>
        <BigFileIcon kind={kind} />
        <p style={{ fontSize: 15, fontWeight: 500, color: C.text1, margin: 0 }}>{file.filename}</p>
        <audio src={file.file_url} controls style={{ width: '80%', maxWidth: 400 }} />
      </div>
    );
  }

  if (kind === 'txt') {
    if (textError) return <NoPreview file={file} kind={kind} reason="Could not load text content." />;
    if (!textContent) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${C.primaryLo}`, borderTopColor: C.primary, animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
    return (
      <pre style={{ flex: 1, overflow: 'auto', margin: 0, padding: 20, background: C.raised, borderRadius: 12, fontSize: 13, color: C.text2, fontFamily: 'monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {textContent}
      </pre>
    );
  }

  // doc, ppt, unknown  · ·  no inline preview
  return <NoPreview file={file} kind={kind} />;
}

function NoPreview({ file, kind, reason }) {
  const color = KIND_COLOR[kind] || KIND_COLOR.file;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: C.bg, borderRadius: 12 }}>
      <div style={{ width: 72, height: 72, borderRadius: 18, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 16 16" fill={color}>
          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
        </svg>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: C.text2, margin: 0 }}>
        {reason || 'Preview not available for this file type'}
      </p>
      <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>Open or download to view</p>
    </div>
  );
}

export default function FilePreviewModal({ file, onClose, onDelete, canDelete }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded]   = useState(false);

  const kind = FILE_KIND[file.file_type] || 'file';
  const color = KIND_COLOR[kind] || KIND_COLOR.file;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(file.file_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch {
      // fallback: open in new tab
      window.open(file.file_url, '_blank');
    } finally {
      setDownloading(false);
    }
  }, [file]);

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'stretch', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', fontFamily: 'Inter, sans-serif' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', maxWidth: 1100, margin: '0 auto', padding: '20px 24px 24px' }}>

        {/*  · ·  · ·  Top bar  · ·  · ·  */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexShrink: 0 }}>

          {/* File type badge */}
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${color}18`, color, border: `1px solid ${color}30`, flexShrink: 0 }}>
            {KIND_LABEL[kind]}
          </span>

          {/* Filename */}
          <h2 style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.filename}
          </h2>

          {/* Meta */}
          <span style={{ fontSize: 12, color: C.text3, flexShrink: 0 }}>{formatSize(file.size_bytes)}</span>
          {file.users?.name && (
            <span style={{ fontSize: 12, color: C.text3, flexShrink: 0 }}>by {file.users.name}</span>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: downloaded ? 'rgba(34,197,94,0.15)' : C.primaryLo, border: `1px solid ${downloaded ? 'rgba(34,197,94,0.35)' : 'rgba(192,193,255,0.25)'}`, color: downloaded ? C.success : C.primary, fontSize: 12, fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: downloading ? 0.7 : 1 }}
            >
              {downloading ? (
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${C.primaryLo}`, borderTopColor: C.primary, animation: 'spin 0.7s linear infinite' }} />
              ) : downloaded ? (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
              )}
              {downloaded ? 'Downloaded' : downloading ? 'Downloading...' : 'Download'}
            </button>

            {/* Open in new tab */}
            <a
              href={file.file_url}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: C.text2, fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = C.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.text2; }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>
              Open
            </a>

            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => { onDelete(file.id); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: C.danger, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                Delete
              </button>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = C.text1; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.text3; }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
            </button>
          </div>
        </div>

        {/*  · ·  · ·  Preview area  · ·  · ·  */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 16 }}>

          {/* Main preview */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', padding: kind === 'pdf' ? 0 : 16 }}>
            <PreviewContent file={file} kind={kind} />
          </div>

          {/* Right info panel */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* File info card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>File Info</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow label="Name"     value={file.filename} mono={false} truncate />
                <InfoRow label="Type"     value={KIND_LABEL[kind]} />
                <InfoRow label="Size"     value={formatSize(file.size_bytes)} />
                {file.users?.name && <InfoRow label="Uploaded by" value={file.users.name} />}
                {file.created_at && <InfoRow label="Date" value={new Date(file.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />}
              </div>
            </div>

            {/* Download CTA card */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: C.primary, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity 0.15s' }}
                >
                  {downloading ? (
                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
                  )}
                  {downloading ? 'Downloading...' : downloaded ? 'Downloaded!' : 'Download'}
                </button>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: '100%', padding: '9px 14px', borderRadius: 10, background: 'transparent', border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxSizing: 'border-box', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.color = C.text1; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>
                  Open in new tab
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InfoRow({ label, value, truncate }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.10em', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontSize: 12, fontWeight: 400, color: C.text2, margin: 0, ...(truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : { wordBreak: 'break-word' }) }}>
        {value}
      </p>
    </div>
  );
}
