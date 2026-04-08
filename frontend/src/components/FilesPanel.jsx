import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { filesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';
import MultiUploadModal from './ui/MultiUploadModal';
import FilePreviewModal from './ui/FilePreviewModal';
import { formatDate as formatDateIST } from '../utils/time';

// -- Design tokens - palette ---------------------------
const C = {
  bg:        '#181818',
  surface:   '#1E1E1E',
  raised:    '#252525',
  overlay:   '#2C2C2C',
  border:    '#333333',
  borderHi:  '#444444',
  primary:   '#C0C1FF',
  primaryHi: '#D4D5FF',
  primaryLo: 'rgba(192,193,255,0.12)',
  secondary: '#FFB38E',
  secondaryHi:'#FFC9A8',
  secondaryLo:'rgba(255,179,142,0.12)',
  tertiary:  '#9E9E9E',
  tertiaryHi:'#BDBDBD',
  tertiaryLo:'rgba(158,158,158,0.10)',
  text1:     '#F0F0F0',
  text2:     '#9090A8',
  text3:     '#555566',
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

function FileRow({ file, selecting, selected, onToggle, canDelete, onDelete, canAssign, onAssign, onPreview, rowRef }) {
  const [hov, setHov] = useState(false);
  const kind = FILE_ICONS[file.file_type] || 'file'; void kind;

  return (
    <div ref={rowRef}
      onClick={() => selecting && onToggle(file.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        background: selected ? 'rgba(192,193,255,0.08)' : hov ? 'rgba(192,193,255,0.04)' : 'transparent',
        borderBottom: `1px solid ${C.border}`,
        cursor: selecting ? 'pointer' : 'default',
        transition: 'background 0.12s',
        position: 'relative',
      }}>

      {selecting && (
        <div onClick={e => { e.stopPropagation(); onToggle(file.id); }}
          style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? C.primary : C.borderHi}`, background: selected ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
          {selected && <svg width="8" height="8" viewBox="0 0 16 16" fill="white"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>}
        </div>
      )}

      <FileTypeIcon type={file.file_type} size={18} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); if (!selecting) onPreview?.(file); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', width: '100%' }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: hov ? C.primary : C.text1, textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.12s' }}>
            {file.filename}
          </span>
        </button>
        <p style={{ fontSize: 11, color: C.text3, margin: '3px 0 0', fontWeight: 300 }}>
          {file.users?.name ? `Uploaded by ${file.users.name}` : 'Unknown uploader'}
        </p>
      </div>

      {!selecting && hov ? (
        /* On hover: replace size+date with action buttons — no overlap */
        <>
          <div style={{ flexShrink: 0, width: 70 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, width: 200, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => onPreview?.(file)}
              style={{ padding: '5px 10px', borderRadius: 7, background: C.primaryLo, border: `1px solid ${C.primary}40`, color: C.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Preview
            </button>
            {canAssign && (
              <button onClick={() => onAssign(file.id)}
                style={{ padding: '5px 9px', borderRadius: 7, background: C.secondaryLo, border: `1px solid ${C.secondary}40`, color: C.secondary, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Move
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(file.id)}
                style={{ padding: '5px 9px', borderRadius: 7, background: C.dangerLo, border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Delete
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <span style={{ fontSize: 12, color: C.text2, fontWeight: 400, flexShrink: 0, width: 70, textAlign: 'right' }}>{formatSize(file.size_bytes)}</span>
          <span style={{ fontSize: 12, color: C.text3, fontWeight: 300, flexShrink: 0, width: 160, textAlign: 'center' }}>{formatDate(file.created_at)}</span>
          <div style={{ width: 70, flexShrink: 0 }} />
        </>
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

  const catNameInput    = useRef(null);
  const fileRowRefs     = useRef({});

  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

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
  const [searchQuery, setSearchQuery] = useState('');

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
  const assignFileToCategory = (fileIdOrIds, catId) => {
    const ids = Array.isArray(fileIdOrIds) ? fileIdOrIds : [fileIdOrIds];
    const next = categories.map(c => ({ ...c, fileIds: c.fileIds.filter(id => !ids.includes(id)) }));
    if (catId) {
      const i = next.findIndex(c => c.id === catId);
      if (i >= 0) next[i] = { ...next[i], fileIds: [...next[i].fileIds, ...ids.filter(id => !next[i].fileIds.includes(id))] };
    }
    persistCats(next);
    setAssignTarget(null);
    if (Array.isArray(fileIdOrIds)) { setSelecting(false); setSelected(new Set()); }
  };

  const handleUploadFile = async (formData) => {
    const res = await filesAPI.upload(group.id, formData);
    setFiles(prev => [res.data, ...prev]);
    return res.data;
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
  const studentFiles = files.filter(f => f.uploaded_by_role === 'student');

  // Determine which files to show based on active section + search
  const getVisibleFiles = () => {
    let base;
    if (activeSection === 'all') base = files;
    else if (activeSection === 'student') base = studentFiles;
    else {
      const cat = categories.find(c => c.id === activeSection);
      base = cat ? cat.fileIds.map(id => fileMap[id]).filter(Boolean) : [];
    }
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(f => f.filename?.toLowerCase().includes(q) || f.users?.name?.toLowerCase().includes(q));
  };
  const visibleFiles = getVisibleFiles();

  // Sidebar nav items
  const navItems = [
    { id: 'all',     label: 'All Files',       count: files.length },
    { id: 'student', label: 'Student Uploads',  count: studentFiles.length },
    ...categories.map(c => ({ id: c.id, label: c.name, count: c.fileIds.filter(id => fileMap[id]).length, isCat: true })),
  ];

  const canUploadHere = activeSection === 'student' ? (isStudent || canUploadAll) : canUploadAll;

  return (
    <div style={{ display: 'flex', height: '100%', background: C.bg, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── Left nav sidebar ── */}
      <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Hero area */}
        <div style={{ padding: '28px 20px 20px', borderBottom: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            {group?.subject || 'Group Files'}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text1, margin: '0 0 4px', fontFamily: "'Manrope', 'Inter', sans-serif", letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            File Archive
          </h2>
          <p style={{ fontSize: 12, fontWeight: 300, color: C.text3, margin: 0, lineHeight: 1.5 }}>
            Manage shared resources
          </p>
        </div>

        {/* Nav items */}
        <div style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
          {/* SECTIONS */}
          <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px 4px' }}>Sections</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
            {navItems.filter(i => !i.isCat).map(item => {
              const active = activeSection === item.id;
              return (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: active ? C.primaryLo : 'transparent', border: `1px solid ${active ? `${C.primary}30` : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', width: '100%', borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${C.primary}08`; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill={active ? C.primary : C.text3} style={{ flexShrink: 0 }}>
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.text1 : C.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  <span style={{ fontSize: 10, color: active ? C.primary : C.text3, background: active ? C.primaryLo : C.raised, padding: '2px 7px', borderRadius: 10, flexShrink: 0, fontWeight: 600 }}>{item.count}</span>
                </button>
              );
            })}
          </div>

          {/* CATEGORIES */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 4 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Categories</p>
            {canDelete && (
              <button onClick={() => setCatModal(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 0, padding: 2 }}
                title="New category"
                onMouseEnter={e => e.currentTarget.style.color = C.primary}
                onMouseLeave={e => e.currentTarget.style.color = C.text3}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.filter(i => i.isCat).length === 0 ? (
              <p style={{ fontSize: 12, color: C.text3, fontStyle: 'italic', fontWeight: 300, padding: '4px 12px', margin: 0 }}>No categories yet</p>
            ) : navItems.filter(i => i.isCat).map(item => {
              const active = activeSection === item.id;
              return (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: active ? C.secondaryLo : 'transparent', border: `1px solid ${active ? `${C.secondary}30` : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', width: '100%', borderLeft: active ? `3px solid ${C.secondary}` : '3px solid transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = `${C.secondary}08`; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill={active ? C.secondary : C.text3} style={{ flexShrink: 0 }}>
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.text1 : C.text2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  <span style={{ fontSize: 10, color: active ? C.secondary : C.text3, background: active ? C.secondaryLo : C.raised, padding: '2px 7px', borderRadius: 10, flexShrink: 0, fontWeight: 600 }}>{item.count}</span>
                  {canDelete && (
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

        {/* Upload CTA + new folder */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {canUploadHere && (
              <button onClick={() => setShowUploadModal(true)}
                style={{ width: '100%', padding: '11px 16px', borderRadius: 10, background: C.secondary, border: 'none', color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.02em' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                Upload Resource
              </button>
          )}
          {canDelete && (
            <button onClick={() => setCatModal(true)}
              style={{ width: '100%', padding: '9px 16px', borderRadius: 10, background: 'none', border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
              New Category
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar — title + stats + actions */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text1, margin: '0 0 3px', fontFamily: "'Manrope', 'Inter', sans-serif", letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {navItems.find(n => n.id === activeSection)?.label || 'All Files'}
              </h1>
              <p style={{ fontSize: 12, fontWeight: 300, color: C.text3, margin: 0 }}>
                {visibleFiles.length} resource{visibleFiles.length !== 1 ? 's' : ''} available
              </p>
            </div>
            {canDelete && files.length > 0 && !selecting && (
              <button onClick={() => setSelecting(true)}
                style={{ padding: '7px 16px', borderRadius: 8, background: 'none', border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s', marginTop: 2 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>
                Select
              </button>
            )}
            {selecting && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 12, color: C.text3 }}>{selected.size} selected</span>
                {selected.size > 0 && categories.length > 0 && (
                  <button onClick={() => setAssignTarget([...selected])}
                    style={{ padding: '6px 12px', borderRadius: 8, background: C.secondaryLo, border: `1px solid ${C.secondary}40`, color: C.secondary, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Move
                  </button>
                )}
                {selected.size > 0 && canDelete && (
                  <button onClick={() => setConfirmBulkDelete(true)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: C.dangerLo, border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Delete
                  </button>
                )}
                <button onClick={() => { setSelecting(false); setSelected(new Set()); }}
                  style={{ padding: '6px 12px', borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total Files',      value: files.length,                                          color: C.primary },
              { label: 'Student Uploads',  value: files.filter(f => f.uploaded_by_role === 'student').length, color: C.secondary },
              { label: 'Categories',       value: categories.length,                                     color: C.tertiary },
            ].map(stat => (
              <div key={stat.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 5px' }}>{stat.label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: stat.color, margin: 0, fontFamily: "'Manrope', 'Inter', sans-serif" }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Body: file list + recently uploaded card */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', gap: 0 }}>

          {/* File list */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Column headers */}
            <div style={{ padding: '0 28px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 16px', borderBottom: `1px solid ${C.border}` }}>
                {selecting && <div style={{ width: 16, flexShrink: 0 }} />}
                <div style={{ width: 36, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Resource Title</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', width: 70, textAlign: 'right' }}>Size</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', width: 160, textAlign: 'center' }}>Date</span>
                <div style={{ width: 70, flexShrink: 0 }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px 24px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: C.raised, flexShrink: 0 }}/>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ height: 12, background: C.raised, borderRadius: 5, width: '40%' }}/>
                        <div style={{ height: 10, background: C.raised, borderRadius: 5, width: '22%' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <p style={{ color: C.danger, fontSize: 13 }}>{error}</p>
                </div>
              ) : visibleFiles.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: C.raised, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 16 16" fill={C.text3}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                  </div>
                  <p style={{ color: C.text2, fontSize: 14, fontWeight: 500, margin: 0 }}>No resources yet</p>
                  {canUploadHere && <p style={{ color: C.text3, fontSize: 12, fontWeight: 300, margin: 0 }}>Upload a file to get started</p>}
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
                    onPreview={setPreviewFile}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right panel: Search + Recently Uploaded */}
          <div style={{ width: 300, flexShrink: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 16px 20px 8px', gap: 12 }}>

            {/* Search card */}
            <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 16px', flexShrink: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.text1, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Search Files</p>
              <div style={{ position: 'relative' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill={C.text3} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
                </svg>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or uploader…"
                  style={{ width: '100%', background: C.overlay, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 10px 8px 30px', fontSize: 12, color: C.text1, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 0, padding: 2 }}
                    onMouseEnter={e => e.currentTarget.style.color = C.text1}
                    onMouseLeave={e => e.currentTarget.style.color = C.text3}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                    </svg>
                  </button>
                )}
              </div>
              {searchQuery && (
                <p style={{ fontSize: 11, color: C.text3, margin: '8px 0 0', fontWeight: 300 }}>
                  {visibleFiles.length} result{visibleFiles.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            {/* Recently Uploaded card */}
            <div style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ padding: '16px 18px 14px', flexShrink: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.text1, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Recently Uploaded</p>
              </div>
              <div style={{ overflowY: 'auto', padding: '0 12px 12px', flex: 1 }}>
                {files.length === 0 ? (
                  <p style={{ fontSize: 12, color: C.text3, fontStyle: 'italic', fontWeight: 300, padding: '4px 6px', margin: 0 }}>No files yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...files].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6).map(file => {
                      const kind = FILE_ICONS[file.file_type] || 'file';
                      const color = TYPE_COLOR[kind];
                      return (
                        <button key={file.id}
                          onClick={() => setPreviewFile(file)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderRadius: 12, background: C.overlay, textDecoration: 'none', transition: 'background 0.12s', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.border}
                          onMouseLeave={e => e.currentTarget.style.background = C.overlay}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, border: `1px solid ${color}38`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 16 16" fill={color}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</p>
                            <p style={{ fontSize: 11, color: C.text3, margin: '4px 0 0', fontWeight: 300 }}>{formatSize(file.size_bytes)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          canDelete={canDelete}
          onDelete={(id) => { setConfirmSingleDelete(id); setPreviewFile(null); }}
        />
      )}
      {showUploadModal && (
        <MultiUploadModal
          onUpload={handleUploadFile}
          onClose={() => setShowUploadModal(false)}
        />
      )}
      <ConfirmDialog open={confirmBulkDelete} title={`Delete ${selected.size} file${selected.size !== 1 ? 's' : ''}?`} description="This cannot be undone." confirmText="Delete" cancelText="Cancel" danger onConfirm={handleBulkDelete} onCancel={() => setConfirmBulkDelete(false)} />
      <ConfirmDialog open={!!confirmSingleDelete} title="Delete file?" description="This cannot be undone." confirmText="Delete" cancelText="Cancel" danger onConfirm={handleSingleDelete} onCancel={() => setConfirmSingleDelete(null)} />

      {catModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setCatModal(false)}>
          <div style={{ width: '100%', maxWidth: 360, background: '#18181F', border: `1px solid ${C.borderHi}`, borderRadius: 18, padding: 28, boxShadow: '0 32px 80px rgba(0,0,0,0.85)', fontFamily: 'Inter, sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: '0 0 6px', fontFamily: "'Manrope', 'Inter', sans-serif" }}>New Category</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: C.text3, margin: '0 0 20px' }}>Organise your files into a category.</p>
            <input ref={catNameInput} value={catName} onChange={e => setCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createCategory(); if (e.key === 'Escape') setCatModal(false); }}
              placeholder="Folder name…"
              style={{ width: '100%', background: '#252525', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: C.text1, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', marginBottom: 16, transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={createCategory} disabled={!catName.trim()}
                style={{ width: '100%', padding: '13px', borderRadius: 10, background: catName.trim() ? C.primary : C.raised, border: 'none', color: catName.trim() ? '#fff' : C.text3, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: catName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif' }}>
                Create Category
              </button>
              <button onClick={() => setCatModal(false)}
                style={{ width: '100%', padding: '11px', borderRadius: 10, background: 'none', border: 'none', color: C.text3, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {assignTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={() => setAssignTarget(null)}>
          <div style={{ width: '100%', maxWidth: 300, background: '#18181F', border: `1px solid ${C.borderHi}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85)', fontFamily: 'Inter, sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.text1, margin: '0 0 3px' }}>Move to Category</p>
              <p style={{ fontSize: 12, fontWeight: 300, color: C.text3, margin: 0 }}>
                {Array.isArray(assignTarget) ? `${assignTarget.length} file${assignTarget.length !== 1 ? 's' : ''}` : '1 file'} selected
              </p>
            </div>
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              <button onClick={() => assignFileToCategory(assignTarget, null)}
                style={{ width: '100%', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: C.text2, fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = C.raised}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill={C.text3}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                Uncategorized
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => assignFileToCategory(assignTarget, cat.id)}
                  style={{ width: '100%', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: C.text2, fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = C.raised}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill={C.secondary}><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 13.5 15h-3A1.5 1.5 0 0 1 9 13.5v-3z"/></svg>
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
