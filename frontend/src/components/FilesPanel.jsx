import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { filesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatDate as formatDateIST } from '../utils/time';

// ── Design tokens — palette ────────────────────────────
const C = {
  bg:        '#111116',
  surface:   '#16161E',
  raised:    '#1C1C26',
  border:    '#2A2A3A',
  borderHi:  '#363650',
  primary:   '#6366F1',
  primaryHi: '#8B8EF8',
  primaryLo: 'rgba(99,102,241,0.14)',
  secondary: '#7072A2',
  tertiary:  '#BD5F00',
  tertiaryLo:'rgba(189,95,0,0.14)',
  text1:     '#EEEEF8',
  text2:     '#9090B0',
  text3:     '#55556E',
  danger:    '#EF4444',
  dangerLo:  'rgba(239,68,68,0.10)',
};

const FILE_ICONS = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'image/jpeg': 'img', 'image/png': 'img',
};

const TYPE_COLOR = { pdf: '#ef4444', ppt: '#f97316', doc: '#3b82f6', img: '#10b981', file: C.text3 };
const TYPE_LABEL = { pdf: 'PDF', ppt: 'PPT', doc: 'DOC', img: 'IMG', file: 'FILE' };

function FileTypeIcon({ type, size = 18 }) {
  const kind = FILE_ICONS[type] || 'file';
  const color = TYPE_COLOR[kind];
  return (
    <div style={{ width: size + 14, height: size + 14, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
      </svg>
    </div>
  );
}

const formatSize = (bytes) => {
  if (!bytes) return '�';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
const formatDate = (ts) => formatDateIST(ts);

const catKey  = (groupId) => `file_categories_${groupId}`;
const loadCats = (groupId) => { try { return JSON.parse(localStorage.getItem(catKey(groupId))) || []; } catch { return []; } };
const saveCats = (groupId, cats) => localStorage.setItem(catKey(groupId), JSON.stringify(cats));

function ConfirmUploadModal({ file, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ width: '100%', maxWidth: 380, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 18, padding: 24, boxShadow: '0 32px 80px rgba(0,0,0,0.8)', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.text1, margin: '0 0 16px' }}>Upload this file?</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.raised, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 20 }}>
          <FileTypeIcon type={file.type} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
            <p style={{ fontSize: 11, color: C.text3, margin: '3px 0 0' }}>{formatSize(file.size)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 10, background: C.primary, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Upload</button>
        </div>
      </div>
    </div>
  );
}

// -- File row (list layout) ----------------------------
function FileRow({ file, selecting, selected, onToggle, canDelete, onDelete, canAssign, onAssign, rowRef }) {
  const [hov, setHov] = useState(false);
  const kind = FILE_ICONS[file.file_type] || 'file'; void kind;

  return (
    <div ref={rowRef}
      onClick={() => selecting && onToggle(file.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        background: selected ? C.primaryLo : hov ? `${C.primary}06` : 'transparent',
        borderBottom: `1px solid ${C.border}`,
        cursor: selecting ? 'pointer' : 'default',
        transition: 'background 0.12s',
        position: 'relative',
      }}>

      {/* Checkbox */}
      {selecting && (
        <div onClick={e => { e.stopPropagation(); onToggle(file.id); }}
          style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? C.primary : C.borderHi}`, background: selected ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
          {selected && <svg width="8" height="8" viewBox="0 0 16 16" fill="white"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>}
        </div>
      )}

      {/* Icon */}
      <FileTypeIcon type={file.file_type} size={16} />

      {/* Name + uploader */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={file.file_url} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 13, fontWeight: 500, color: hov ? C.primaryHi : C.text1, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.12s' }}>
          {file.filename}
        </a>
        <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0', fontWeight: 300 }}>
          {file.users?.name ? `Uploaded by ${file.users.name}` : 'Unknown uploader'}
        </p>
      </div>

      {/* Size */}
      <span style={{ fontSize: 12, color: C.text3, fontWeight: 300, flexShrink: 0, minWidth: 56, textAlign: 'right' }}>{formatSize(file.size_bytes)}</span>

      {/* Date */}
      <span style={{ fontSize: 12, color: C.text3, fontWeight: 300, flexShrink: 0, minWidth: 80, textAlign: 'right' }}>{formatDate(file.created_at)}</span>

      {/* Actions (hover) */}
      {!selecting && hov && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <a href={file.file_url} target="_blank" rel="noreferrer"
            style={{ padding: '5px 10px', borderRadius: 7, background: C.primaryLo, border: `1px solid ${C.primary}40`, color: C.primaryHi, fontSize: 11, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Download
          </a>
          {canAssign && (
            <button onClick={() => onAssign(file.id)}
              style={{ padding: '5px 10px', borderRadius: 7, background: 'none', border: `1px solid ${C.border}`, color: C.text2, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Move
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(file.id)}
              style={{ padding: '5px 10px', borderRadius: 7, background: C.dangerLo, border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilesPanel({ group, highlightFileId, onHighlightClear }) {
  const { user } = useAuth(); void user;
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isAdmin   = myRole === 'admin';
  const isTeacher = myRole === 'teacher';
  const isStudent = myRole === 'student';
  const canUploadAll = isAdmin || isTeacher;
  const canDelete    = isAdmin || isTeacher;

  const teacherInputRef = useRef(null);
  const studentInputRef = useRef(null);
  const catNameInput    = useRef(null);
  const fileRowRefs     = useRef({});

  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  const [selecting, setSelecting]   = useState(false);
  const [selected, setSelected]     = useState(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false); void deleting;
  const [confirmSingleDelete, setConfirmSingleDelete] = useState(null);

  const [categories, setCategories]   = useState([]);
  const [catModal, setCatModal]       = useState(false);
  const [catName, setCatName]         = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [catCollapsed, setCatCollapsed] = useState({}); void catCollapsed; void setCatCollapsed;

  // Active section filter: 'all' | 'teacher' | 'student' | catId
  const [activeSection, setActiveSection] = useState('all');

  useEffect(() => {
    if (!group) return;
    setLoading(true); setError('');
    filesAPI.list(group.id)
      .then(res => setFiles(res.data))
      .catch(() => setError('Could not load files'))
      .finally(() => setLoading(false));
    setCategories(loadCats(group.id));
  }, [group?.id]);

  useEffect(() => { setSelecting(false); setSelected(new Set()); }, [group?.id]);
  useEffect(() => { if (catModal) setTimeout(() => catNameInput.current?.focus(), 50); }, [catModal]);

  useEffect(() => {
    if (!highlightFileId) return;
    const attempt = (tries) => {
      const el = fileRowRefs.current[highlightFileId];
      if (!el) { if (tries > 0) setTimeout(() => attempt(tries - 1), 300); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('file-highlight');
      const t = setTimeout(() => { el.classList.remove('file-highlight'); onHighlightClear?.(); }, 2000);
      return () => clearTimeout(t);
    };
    attempt(15);
  }, [highlightFileId, files]);

  const persistCats = (next) => { setCategories(next); saveCats(group.id, next); };
  const createCategory = () => {
    const name = catName.trim(); if (!name) return;
    persistCats([...categories, { id: Date.now().toString(), name, fileIds: [] }]);
    setCatName(''); setCatModal(false);
  };
  const deleteCategory = (catId) => persistCats(categories.filter(c => c.id !== catId));
  const assignFileToCategory = (fileId, catId) => {
    const next = categories.map(c => ({ ...c, fileIds: c.fileIds.filter(id => id !== fileId) }));
    if (catId) { const i = next.findIndex(c => c.id === catId); if (i >= 0) next[i] = { ...next[i], fileIds: [...next[i].fileIds, fileId] }; }
    persistCats(next); setAssignTarget(null);
  };

  const handleFilePick = (e) => { const file = e.target.files?.[0]; if (!file) return; setPendingFile(file); e.target.value = ''; };
  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true); setError('');
    const formData = new FormData(); formData.append('file', pendingFile);
    try { const res = await filesAPI.upload(group.id, formData); setFiles(prev => [res.data, ...prev]); }
    catch (err) { setError(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); setPendingFile(null); }
  };

  const toggleSelect = (id) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false); setDeleting(true);
    const ids = [...selected]; let failed = 0;
    for (const id of ids) { try { await filesAPI.delete(group.id, id); } catch { failed++; } }
    setFiles(prev => prev.filter(f => !selected.has(f.id)));
    persistCats(categories.map(c => ({ ...c, fileIds: c.fileIds.filter(id => !selected.has(id)) })));
    setSelected(new Set()); setSelecting(false); setDeleting(false);
    if (failed > 0) addToast({ type: 'error', message: `${failed} file(s) could not be deleted` });
    else addToast({ type: 'success', message: `${ids.length} file(s) deleted` });
  };

  const handleSingleDelete = async () => {
    if (!confirmSingleDelete) return;
    const id = confirmSingleDelete; setConfirmSingleDelete(null);
    try {
      await filesAPI.delete(group.id, id);
      setFiles(prev => prev.filter(f => f.id !== id));
      persistCats(categories.map(c => ({ ...c, fileIds: c.fileIds.filter(fid => fid !== id) })));
      addToast({ type: 'success', message: 'File deleted' });
    } catch { addToast({ type: 'error', message: 'Could not delete file' }); }
  };

  const fileMap = Object.fromEntries(files.map(f => [f.id, f]));
  const categorizedIds = new Set(categories.flatMap(c => c.fileIds));
  const teacherFiles = files.filter(f => f.uploaded_by_role !== 'student' && !categorizedIds.has(f.id));
  const studentFiles = files.filter(f => f.uploaded_by_role === 'student' && !categorizedIds.has(f.id));

  // Determine which files to show based on active section
  const getVisibleFiles = () => {
    if (activeSection === 'all') return files;
    if (activeSection === 'teacher') return teacherFiles;
    if (activeSection === 'student') return studentFiles;
    const cat = categories.find(c => c.id === activeSection);
    return cat ? cat.fileIds.map(id => fileMap[id]).filter(Boolean) : [];
  };
  const visibleFiles = getVisibleFiles();

  // Sidebar nav items
  const navItems = [
    { id: 'all', label: 'All Files', count: files.length },
    { id: 'teacher', label: 'Study Materials', count: teacherFiles.length },
    ...(isStudent || canUploadAll ? [{ id: 'student', label: 'Student Media', count: studentFiles.length }] : []),
    ...categories.map(c => ({ id: c.id, label: c.name, count: c.fileIds.filter(id => fileMap[id]).length, isCat: true })),
  ];

  // Upload ref for current section
  const uploadRef = activeSection === 'student' ? studentInputRef : teacherInputRef;
  const canUploadHere = activeSection === 'student' ? isStudent : canUploadAll;

  return (
    <div style={{ display: 'flex', height: '100%', background: C.bg, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* -- Right sidebar nav -- */}
      <div style={{ width: 200, flexShrink: 0, borderLeft: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden', order: 1 }}>
        <div style={{ padding: '18px 14px 12px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Files</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(item => {
              const active = activeSection === item.id;
              return (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: active ? C.primaryLo : 'none', border: `1px solid ${active ? `${C.primary}30` : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', width: '100%' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${C.primary}06`; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill={active ? C.primaryHi : C.text3} style={{ flexShrink: 0 }}>
                    {item.isCat
                      ? <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                      : <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>}
                  </svg>
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.primaryHi : C.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: item.isCat ? 'none' : 'uppercase', letterSpacing: item.isCat ? 'normal' : '0.05em' }}>{item.label}</span>
                  <span style={{ fontSize: 10, color: active ? C.primaryHi : C.text3, background: active ? `${C.primary}20` : C.raised, padding: '1px 6px', borderRadius: 10, flexShrink: 0 }}>{item.count}</span>
                  {item.isCat && canDelete && (
                    <button onClick={e => { e.stopPropagation(); deleteCategory(item.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 0, padding: 2, flexShrink: 0 }}
                      
                      onMouseEnter={e => e.currentTarget.style.color = C.danger}
                      onMouseLeave={e => e.currentTarget.style.color = C.text3}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add category button */}
        {canDelete && (
          <div style={{ padding: '0 14px 14px', marginTop: 'auto' }}>
            <button onClick={() => setCatModal(true)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'none', border: `1px dashed ${C.border}`, color: C.text3, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primaryHi; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text3; }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
              New folder
            </button>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', order: 0 }}>

        {/* Toolbar */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: C.surface }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text1, flex: 1 }}>
            {navItems.find(n => n.id === activeSection)?.label || 'Files'}
            <span style={{ fontSize: 11, fontWeight: 300, color: C.text3, marginLeft: 8 }}>{visibleFiles.length} file{visibleFiles.length !== 1 ? 's' : ''}</span>
          </span>

          {selecting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.text3 }}>{selected.size} selected</span>
              {selected.size > 0 && canDelete && (
                <button onClick={() => setConfirmBulkDelete(true)}
                  style={{ padding: '6px 14px', borderRadius: 8, background: C.dangerLo, border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Delete
                </button>
              )}
              <button onClick={() => { setSelecting(false); setSelected(new Set()); }}
                style={{ padding: '6px 14px', borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {canDelete && files.length > 0 && (
                <button onClick={() => setSelecting(true)}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'none', border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHi}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                  Select
                </button>
              )}
              {canUploadHere && (
                <>
                  <input ref={uploadRef} type="file" style={{ display: 'none' }} onChange={handleFilePick} />
                  <button onClick={() => uploadRef.current?.click()} disabled={uploading}
                    style={{ padding: '6px 16px', borderRadius: 8, background: uploading ? C.raised : C.primary, border: 'none', color: uploading ? C.text3 : '#fff', fontSize: 12, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                    {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Column headers */}
        {visibleFiles.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
            {selecting && <div style={{ width: 16, flexShrink: 0 }} />}
            <div style={{ width: 32, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: 56, textAlign: 'right' }}>Size</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: 80, textAlign: 'right' }}>Date</span>
            <div style={{ width: 80, flexShrink: 0 }} />
          </div>
        )}

        {/* File list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.raised, flexShrink: 0 }}/>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 11, background: C.raised, borderRadius: 5, width: '45%' }}/>
                    <div style={{ height: 9, background: C.raised, borderRadius: 5, width: '25%' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ color: C.danger, fontSize: 13 }}>{error}</p>
            </div>
          ) : visibleFiles.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <svg width="32" height="32" viewBox="0 0 16 16" fill={C.text3}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
              <p style={{ color: C.text3, fontSize: 13, fontWeight: 300, margin: 0 }}>No files here yet</p>
              {canUploadHere && <p style={{ color: C.text3, fontSize: 11, fontWeight: 300, margin: 0 }}>Upload a file to get started</p>}
            </div>
          ) : (
            visibleFiles.map(file => (
              <FileRow key={file.id}
                file={file}
                rowRef={el => { if (el) fileRowRefs.current[file.id] = el; else delete fileRowRefs.current[file.id]; }}
                selecting={selecting}
                selected={selected.has(file.id)}
                onToggle={toggleSelect}
                canDelete={canDelete}
                onDelete={setConfirmSingleDelete}
                canAssign={canDelete && categories.length > 0}
                onAssign={id => setAssignTarget(id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Pending upload confirm */}
      {pendingFile && <ConfirmUploadModal file={pendingFile} onConfirm={handleConfirmUpload} onCancel={() => setPendingFile(null)} />}

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={confirmBulkDelete}
        title={`Delete ${selected.size} file${selected.size !== 1 ? 's' : ''}?`}
        description="This cannot be undone."
        confirmText="Delete" cancelText="Cancel" danger
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {/* Single delete confirm */}
      <ConfirmDialog
        open={!!confirmSingleDelete}
        title="Delete file?"
        description="This cannot be undone."
        confirmText="Delete" cancelText="Cancel" danger
        onConfirm={handleSingleDelete}
        onCancel={() => setConfirmSingleDelete(null)}
      />

      {/* New category modal */}
      {catModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setCatModal(false)}>
          <div style={{ width: '100%', maxWidth: 340, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 16, padding: 22, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', fontFamily: 'Inter, sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text1, margin: '0 0 14px' }}>New folder</p>
            <input ref={catNameInput} value={catName} onChange={e => setCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createCategory(); if (e.key === 'Escape') setCatModal(false); }}
              placeholder="Folder name…"
              style={{ width: '100%', background: C.raised, border: `1px solid ${C.borderHi}`, borderRadius: 9, padding: '10px 14px', fontSize: 13, color: C.text1, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCatModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: C.raised, border: `1px solid ${C.border}`, color: C.text2, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={createCategory} disabled={!catName.trim()} style={{ flex: 1, padding: '10px', borderRadius: 9, background: catName.trim() ? C.primary : C.raised, border: 'none', color: catName.trim() ? '#fff' : C.text3, fontSize: 13, fontWeight: 600, cursor: catName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to category modal */}
      {assignTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setAssignTarget(null)}>
          <div style={{ width: '100%', maxWidth: 300, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', fontFamily: 'Inter, sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: 0 }}>Move to folder</p>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              <button onClick={() => assignFileToCategory(assignTarget, null)}
                style={{ width: '100%', padding: '11px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: C.text2, fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background = C.raised}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                Uncategorized
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => assignFileToCategory(assignTarget, cat.id)}
                  style={{ width: '100%', padding: '11px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: C.text2, fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = C.raised}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
