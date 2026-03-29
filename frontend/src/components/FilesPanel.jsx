import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { filesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatDate as formatDateIST } from '../utils/time';

const FILE_ICONS = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
  'image/jpeg': 'img',
  'image/png': 'img',
};

function FileTypeIcon({ type }) {
  const kind = FILE_ICONS[type] || 'file';
  const paths = {
    pdf:  <><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/><path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029z"/></>,
    ppt:  <><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/><path d="M7 7.078V9H5.5a.5.5 0 0 0 0 1H7v1.5a.5.5 0 0 0 1 0V10h1.5a.5.5 0 0 0 0-1H8V7.078a3 3 0 1 0-1 0z"/></>,
    doc:  <><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/><path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 8h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/></>,
    img:  <><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/></>,
    file: <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>,
  };
  const colors = { pdf: '#ef4444', ppt: '#f97316', doc: '#3b82f6', img: '#10b981', file: 'rgba(255,255,255,0.3)' };
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill={colors[kind]} style={{ flexShrink: 0 }}>
      {paths[kind]}
    </svg>
  );
}

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const formatDate = (ts) => formatDateIST(ts);

// ── Category persistence ───────────────────────────────
const catKey = (groupId) => `file_categories_${groupId}`;
const loadCats = (groupId) => { try { return JSON.parse(localStorage.getItem(catKey(groupId))) || []; } catch { return []; } };
const saveCats = (groupId, cats) => localStorage.setItem(catKey(groupId), JSON.stringify(cats));

function ConfirmUploadModal({ file, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="card w-full max-w-sm p-6">
        <h3 className="text-sm font-semibold dark:text-white text-gray-900 mb-4">Upload this file?</h3>
        <div className="dark:bg-surface-3 bg-gray-100 rounded-xl p-4 mb-5 flex items-center gap-3">
          <FileTypeIcon type={file.type} />
          <div className="min-w-0">
            <p className="text-sm dark:text-white text-gray-900 font-medium truncate">{file.name}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{formatSize(file.size)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm dark:text-gray-400 text-gray-600 dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition">Upload</button>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, selecting, selected, onToggle, canDelete, onDelete, canAssign, onAssign, rowRef }) {
  return (
    <div ref={rowRef} onClick={() => selecting && onToggle(file.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid #1c1c1c', background: '#080808', transition: 'border-color 0.15s', cursor: selecting ? 'pointer' : 'default' }}
      className="group"
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
      onMouseLeave={e => e.currentTarget.style.borderColor = selected ? 'rgba(124,58,237,0.4)' : '#1c1c1c'}
      {...(selected ? { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.06)', cursor: 'pointer' } } : {})}>
      {selecting && (
        <div style={{ width: 18, height: 18, borderRadius: 5, border: selected ? '2px solid #7c3aed' : '2px solid rgba(255,255,255,0.2)', background: selected ? '#7c3aed' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
          {selected && <svg width="10" height="10" viewBox="0 0 16 16" fill="white"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>}
        </div>
      )}
      <FileTypeIcon type={file.file_type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{file.filename}</p>
        <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
          {formatSize(file.size_bytes)}{file.users?.name && ` · ${file.users.name}`}{` · ${formatDate(file.created_at)}`}
        </p>
      </div>
      {!selecting && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} className="opacity-0 group-hover:opacity-100 transition">
          {canAssign && (
            <button onClick={e => { e.stopPropagation(); onAssign(file.id); }}
              style={{ padding: '4px 8px', borderRadius: 6, background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 300, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              Move
            </button>
          )}
          {canDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(file.id); }}
              style={{ padding: '4px 8px', borderRadius: 6, background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 300, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.8)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              Delete
            </button>
          )}
          <a href={file.file_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', color: 'rgba(167,139,250,0.9)', fontSize: 11, fontWeight: 400, textDecoration: 'none' }}>
            Download
          </a>
        </div>
      )}
    </div>
  );
}

export default function FilesPanel({ group, highlightFileId, onHighlightClear }) {
  const { user }     = useAuth();
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
  const fileRowRefs     = useRef({});  // fileId -> DOM element

  // Scroll to and highlight the referenced file
  useEffect(() => {
    if (!highlightFileId) return;
    const attempt = (tries) => {
      const el = fileRowRefs.current[highlightFileId];
      if (!el) { if (tries > 0) setTimeout(() => attempt(tries - 1), 200); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('file-highlight');
      const t = setTimeout(() => { el.classList.remove('file-highlight'); onHighlightClear?.(); }, 2000);
      return () => clearTimeout(t);
    };
    attempt(5);
  }, [highlightFileId]);

  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  // Select mode
  const [selecting, setSelecting]   = useState(false);
  const [selected, setSelected]     = useState(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmSingleDelete, setConfirmSingleDelete] = useState(null); // fileId

  // Categories (localStorage per group)
  const [categories, setCategories]   = useState([]);
  const [catModal, setCatModal]       = useState(false);
  const [catName, setCatName]         = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [catCollapsed, setCatCollapsed] = useState({});

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

  const persistCats = (next) => { setCategories(next); saveCats(group.id, next); };

  const createCategory = () => {
    const name = catName.trim();
    if (!name) return;
    persistCats([...categories, { id: Date.now().toString(), name, fileIds: [] }]);
    setCatName(''); setCatModal(false);
  };

  const deleteCategory = (catId) => {
    persistCats(categories.filter(c => c.id !== catId));
  };

  const assignFileToCategory = (fileId, catId) => {
    const next = categories.map(c => ({ ...c, fileIds: c.fileIds.filter(id => id !== fileId) }));
    if (catId) {
      const i = next.findIndex(c => c.id === catId);
      if (i >= 0) next[i] = { ...next[i], fileIds: [...next[i].fileIds, fileId] };
    }
    persistCats(next);
    setAssignTarget(null);
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true); setError('');
    const formData = new FormData();
    formData.append('file', pendingFile);
    try {
      const res = await filesAPI.upload(group.id, formData);
      setFiles(prev => [res.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); setPendingFile(null); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = (fileList) => {
    const allIds = fileList.map(f => f.id);
    setSelected(allIds.every(id => selected.has(id)) ? new Set() : new Set(allIds));
  };

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false); setDeleting(true);
    const ids = [...selected];
    let failed = 0;
    for (const id of ids) { try { await filesAPI.delete(group.id, id); } catch { failed++; } }
    setFiles(prev => prev.filter(f => !selected.has(f.id)));
    persistCats(categories.map(c => ({ ...c, fileIds: c.fileIds.filter(id => !selected.has(id)) })));
    setSelected(new Set()); setSelecting(false); setDeleting(false);
    if (failed > 0) addToast({ type: 'error', message: `${failed} file(s) could not be deleted` });
    else addToast({ type: 'success', message: `${ids.length} file(s) deleted` });
  };

  const handleSingleDelete = async () => {
    if (!confirmSingleDelete) return;
    const id = confirmSingleDelete;
    setConfirmSingleDelete(null);
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
  const allUncategorized = [...teacherFiles, ...studentFiles];

  const SectionHeader = ({ title, subtitle, fileList, uploadRef }) => (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {uploadRef && (canUploadAll || isStudent) && (
          <button onClick={() => uploadRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 300, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            Upload
          </button>
        )}
        {canDelete && fileList.length > 0 && (
          <button onClick={() => { if (selecting) { setSelecting(false); setSelected(new Set()); } else setSelecting(true); }}
            style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: selecting ? 'rgba(255,255,255,0.06)' : 'none', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 300, cursor: 'pointer' }}>
            {selecting ? 'Cancel' : 'Select'}
          </button>
        )}
        {selecting && selected.size > 0 && (
          <button onClick={() => setConfirmBulkDelete(true)} disabled={deleting}
            style={{ padding: '5px 10px', borderRadius: 7, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.8)', fontSize: 11, fontWeight: 400, cursor: 'pointer' }}>
            Delete {selected.size}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'transparent', overflowY: 'auto' }}
      onClick={() => {}}>
      <div className="p-5 space-y-6">
        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'rgba(239,68,68,0.8)', fontSize: 12, fontWeight: 300 }}>{error}</div>}

        {/* ── Categories ── */}
        {categories.map(cat => {
          const catFiles = cat.fileIds.map(id => fileMap[id]).filter(Boolean);
          const isCollapsed = catCollapsed[cat.id];
          return (
            <section key={cat.id}>
              <div className="flex items-center gap-2 mb-3 group/cat">
                <button onClick={() => setCatCollapsed(p => ({ ...p, [cat.id]: !p[cat.id] }))}
                  className="flex items-center gap-2 flex-1 min-w-0">
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"
                    className={`flex-shrink-0 dark:text-gray-500 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                    <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-widest dark:text-gray-300 text-gray-600">{cat.name}</span>
                  <span className="text-xs dark:text-gray-600 text-gray-400 tabular-nums">{catFiles.length}</span>
                </button>
                {canDelete && (
                  <button onClick={() => deleteCategory(cat.id)}
                    className="opacity-0 group-hover/cat:opacity-100 transition p-1 dark:text-gray-600 text-gray-400 hover:text-red-400"
                    title="Delete category">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                    </svg>
                  </button>
                )}
              </div>
              {!isCollapsed && (
                catFiles.length === 0
                  ? <div className="py-6 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                      <p className="dark:text-gray-600 text-gray-400 text-xs">No files — assign files using the grid icon on each file</p>
                    </div>
                  : <div className="space-y-2">
                      {catFiles.map(file => (
                        <FileRow key={file.id} file={file}
                          selecting={selecting && canDelete}
                          selected={selected.has(file.id)}
                          onToggle={toggleSelect}
                          canDelete={canDelete}
                          onDelete={setConfirmSingleDelete}
                          canAssign={canDelete}
                          onAssign={setAssignTarget}
                          rowRef={el => { if (el) fileRowRefs.current[file.id] = el; else delete fileRowRefs.current[file.id]; }}
                        />
                      ))}
                    </div>
              )}
            </section>
          );
        })}

        {/* ── New category button (teachers only) ── */}

        {/* ── Study materials (uncategorized) ── */}
        <section>
          <SectionHeader title="Study materials" subtitle="Uploaded by teachers" fileList={teacherFiles} uploadRef={canUploadAll ? teacherInputRef : null}/>
          {loading
            ? <div className="space-y-2">{[1,2].map(i => <div key={i} style={{ height: 56, borderRadius: 8, background: '#0d0d0d', animation: 'pulse 1.5s infinite' }}/>)}</div>
            : teacherFiles.length === 0
              ? <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 300 }}>No study materials yet</p>
                </div>
              : <div className="space-y-2">
                  {teacherFiles.map(file => (
                    <FileRow key={file.id} file={file}
                      selecting={selecting} selected={selected.has(file.id)} onToggle={toggleSelect}
                      canDelete={canDelete} onDelete={setConfirmSingleDelete}
                      canAssign={canDelete} onAssign={setAssignTarget}
                      rowRef={el => { if (el) fileRowRefs.current[file.id] = el; else delete fileRowRefs.current[file.id]; }}/>
                  ))}
                </div>
          }
        </section>

        {/* ── Student media (uncategorized) ── */}
        {(isStudent || canUploadAll) && (
          <section>
            <SectionHeader title="Student media" subtitle="Images and PDFs from students" fileList={studentFiles} uploadRef={isStudent ? studentInputRef : null}/>
            {loading
              ? <div className="space-y-2">{[1,2].map(i => <div key={i} style={{ height: 56, borderRadius: 8, background: '#0d0d0d' }}/>)}</div>
              : studentFiles.length === 0
                ? <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 300 }}>No student uploads yet</p>
                  </div>
                : <div className="space-y-2">
                    {studentFiles.map(file => (
                      <FileRow key={file.id} file={file}
                        selecting={selecting && canDelete} selected={selected.has(file.id)} onToggle={toggleSelect}
                        canDelete={canDelete} onDelete={setConfirmSingleDelete}
                        canAssign={canDelete} onAssign={setAssignTarget}
                        rowRef={el => { if (el) fileRowRefs.current[file.id] = el; else delete fileRowRefs.current[file.id]; }}/>
                    ))}
                  </div>
            }
          </section>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={teacherInputRef} type="file" className="hidden" onChange={handleFilePick}
        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"/>
      <input ref={studentInputRef} type="file" className="hidden" onChange={handleFilePick}
        accept=".pdf,.jpg,.jpeg,.png"/>

      {pendingFile && <ConfirmUploadModal file={pendingFile} onConfirm={handleConfirmUpload} onCancel={() => setPendingFile(null)}/>}

      <ConfirmDialog open={confirmBulkDelete} danger
        title={`Delete ${selected.size} file${selected.size !== 1 ? 's' : ''}?`}
        description="This will permanently remove the selected files for everyone."
        confirmText="Delete" onCancel={() => setConfirmBulkDelete(false)} onConfirm={handleBulkDelete} disabled={deleting}/>

      <ConfirmDialog open={!!confirmSingleDelete} danger
        title="Delete this file?"
        description="This will permanently remove the file for everyone."
        confirmText="Delete" onCancel={() => setConfirmSingleDelete(null)} onConfirm={handleSingleDelete}/>

      {/* New category modal */}
      {catModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => { setCatModal(false); setCatName(''); }}>
          <div className="w-full max-w-sm dark:bg-surface-1 bg-white rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div>
              <h3 className="text-sm font-semibold dark:text-white text-gray-900">New category</h3>
              <p className="text-xs dark:text-gray-500 text-gray-400 mt-1">A labeled section to group files together.</p>
            </div>
            <input ref={catNameInput} value={catName} onChange={e => setCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createCategory(); if (e.key === 'Escape') { setCatModal(false); setCatName(''); } }}
              placeholder="e.g. Week 1, Assignments, Slides…" className="w-full form-input"/>
            <div className="flex gap-2">
              <button onClick={createCategory} disabled={!catName.trim()}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition">Create</button>
              <button onClick={() => { setCatModal(false); setCatName(''); }}
                className="flex-1 py-2.5 dark:bg-surface-3 bg-gray-100 dark:text-gray-300 text-gray-700 text-sm rounded-xl transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign file to category modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
          onClick={() => setAssignTarget(null)}>
          <div className="w-full max-w-xs dark:bg-surface-1 bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold uppercase tracking-wider dark:text-gray-400 text-gray-500 px-4 pt-4 pb-2">Assign to category</p>
            <div className="divide-y dark:divide-gray-800 divide-gray-100">
              <button onClick={() => assignFileToCategory(assignTarget, null)}
                className="w-full text-left px-4 py-3 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-500 text-gray-400">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                </svg>
                No category
              </button>
              {categories.map(cat => {
                const isAssigned = cat.fileIds.includes(assignTarget);
                return (
                  <button key={cat.id} onClick={() => assignFileToCategory(assignTarget, cat.id)}
                    className={`w-full text-left px-4 py-3 text-sm dark:text-gray-300 text-gray-700 dark:hover:bg-gray-800 hover:bg-gray-50 transition flex items-center gap-2 ${isAssigned ? 'dark:bg-brand-900/20 bg-brand-50' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="dark:text-gray-400 text-gray-500">
                      <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                    </svg>
                    {cat.name}
                    {isAssigned && <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="ml-auto dark:text-brand-400 text-brand-500"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>}
                  </button>
                );
              })}
              {categories.length === 0 && <p className="px-4 py-3 text-sm dark:text-gray-500 text-gray-400 italic">No categories yet — create one first</p>}
            </div>
            <div className="p-3 border-t dark:border-gray-800 border-gray-100">
              <button onClick={() => setAssignTarget(null)}
                className="w-full py-2 rounded-xl dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-600 text-sm transition dark:hover:bg-surface-4 hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

