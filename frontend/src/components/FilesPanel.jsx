import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { filesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatDate as formatDateIST } from '../utils/time';

const FILE_ICONS = {
  'application/pdf': '📄',
  'application/vnd.ms-powerpoint': '📊',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (ts) => formatDateIST(ts);

function ConfirmUploadModal({ file, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="card w-full max-w-sm p-6">
        <h3 className="text-sm font-semibold dark:text-white text-gray-900 mb-4">Upload this file?</h3>
        <div className="dark:bg-surface-3 bg-gray-100 rounded-xl p-4 mb-5 flex items-center gap-3">
          <span style={{ fontSize: 28 }}>{FILE_ICONS[file.type] || '📎'}</span>
          <div className="min-w-0">
            <p className="text-sm dark:text-white text-gray-900 font-medium truncate">{file.name}</p>
            <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{formatSize(file.size)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm dark:text-gray-400 text-gray-600 dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, selecting, selected, onToggle }) {
  return (
    <div
      onClick={() => selecting && onToggle(file.id)}
      className={`card-hover flex items-center gap-4 px-4 py-3 transition
        ${selecting ? 'cursor-pointer' : ''}
        ${selected ? 'dark:bg-brand-900/30 bg-brand-50 dark:border-brand-700/40 border-brand-200 border' : ''}`}>

      {/* Checkbox (select mode) */}
      {selecting && (
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition
          ${selected ? 'bg-brand-600 border-brand-600' : 'dark:border-gray-600 border-gray-300'}`}>
          {selected && (
            <svg width="10" height="10" viewBox="0 0 16 16" fill="white">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
          )}
        </div>
      )}

      <div style={{ fontSize: 26 }} className="flex-shrink-0">{FILE_ICONS[file.file_type] || '📎'}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm dark:text-white text-gray-900 font-medium truncate">{file.filename}</p>
        <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">
          {formatSize(file.size_bytes)}
          {file.users?.name && ` · ${file.users.name}`}
          {` · ${formatDate(file.created_at)}`}
        </p>
      </div>

      {!selecting && (
        <a href={file.file_url} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-xs text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 transition flex-shrink-0">
          Download
        </a>
      )}
    </div>
  );
}

export default function FilesPanel({ group }) {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isAdmin   = myRole === 'admin';
  const isTeacher = myRole === 'teacher';
  const isStudent = myRole === 'student';
  const canUploadAll   = isAdmin || isTeacher;
  const canDelete      = isAdmin || isTeacher; // students can NEVER delete

  const teacherInputRef = useRef(null);
  const studentInputRef = useRef(null);

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

  useEffect(() => {
    if (!group) return;
    setLoading(true); setError('');
    filesAPI.list(group.id)
      .then(res => setFiles(res.data))
      .catch(() => setError('Could not load files'))
      .finally(() => setLoading(false));
  }, [group?.id]);

  // Exit select mode when switching groups
  useEffect(() => { setSelecting(false); setSelected(new Set()); }, [group?.id]);

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
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (fileList) => {
    const allIds = fileList.map(f => f.id);
    const allSelected = allIds.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(allIds));
  };

  const handleBulkDelete = async () => {
    setConfirmBulkDelete(false);
    setDeleting(true);
    const ids = [...selected];
    let failed = 0;
    for (const id of ids) {
      try { await filesAPI.delete(group.id, id); }
      catch { failed++; }
    }
    setFiles(prev => prev.filter(f => !selected.has(f.id)));
    setSelected(new Set());
    setSelecting(false);
    setDeleting(false);
    if (failed > 0) addToast({ type: 'error', message: `${failed} file(s) could not be deleted` });
    else addToast({ type: 'success', message: `${ids.length} file(s) deleted` });
  };

  const teacherFiles = files.filter(f => f.uploaded_by_role !== 'student');
  const studentFiles = files.filter(f => f.uploaded_by_role === 'student');

  const SectionHeader = ({ title, subtitle, fileList, uploadRef, showUpload, uploadLabel }) => (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-sm font-medium dark:text-white text-gray-900">{title}</h3>
        <p className="text-xs dark:text-gray-600 text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {/* Select / Cancel */}
        {canDelete && fileList.length > 0 && (
          <button
            onClick={() => {
              if (selecting) { setSelecting(false); setSelected(new Set()); }
              else setSelecting(true);
            }}
            className={`text-xs font-medium px-3 py-1.5 rounded-xl transition
              ${selecting
                ? 'dark:bg-surface-3 bg-gray-200 dark:text-gray-300 text-gray-700'
                : 'dark:text-gray-400 text-gray-500 dark:hover:text-gray-200 hover:text-gray-700'}`}>
            {selecting ? 'Cancel' : 'Select'}
          </button>
        )}
        {/* Select all */}
        {selecting && fileList.length > 0 && (
          <button onClick={() => toggleSelectAll(fileList)}
            className="text-xs dark:text-gray-400 text-gray-500 dark:hover:text-gray-200 hover:text-gray-700 transition">
            {fileList.every(f => selected.has(f.id)) ? 'Deselect all' : 'All'}
          </button>
        )}
        {/* Delete selected */}
        {selecting && selected.size > 0 && (
          <button onClick={() => setConfirmBulkDelete(true)} disabled={deleting}
            className="text-xs font-medium px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50">
            Delete {selected.size}
          </button>
        )}
        {/* Upload */}
        {showUpload && !selecting && (
          <>
            <input ref={uploadRef} type="file" className="hidden" onChange={handleFilePick}
              accept={canUploadAll ? '.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png' : '.pdf,.jpg,.jpeg,.png'}/>
            <button onClick={() => uploadRef.current?.click()} disabled={uploading}
              className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-xl transition">
              {uploading ? 'Uploading...' : uploadLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 dark:bg-surface bg-gray-50 overflow-y-auto">
      <div className="p-5 space-y-8">

        {error && (
          <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>
        )}

        {/* Study materials */}
        <section>
          <SectionHeader
            title="Study materials" subtitle="Uploaded by teachers"
            fileList={teacherFiles}
            uploadRef={teacherInputRef}
            showUpload={canUploadAll}
            uploadLabel="+ Upload"
          />
          {loading
            ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            : teacherFiles.length === 0
              ? <div className="py-8 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                  <p className="dark:text-gray-600 text-gray-400 text-sm">No study materials yet</p>
                </div>
              : <div className="space-y-2">
                  {teacherFiles.map(file => (
                    <FileRow key={file.id} file={file}
                      selecting={selecting}
                      selected={selected.has(file.id)}
                      onToggle={toggleSelect}
                    />
                  ))}
                </div>
          }
        </section>

        {/* Student media */}
        {(isStudent || canUploadAll) && (
          <section>
            <SectionHeader
              title="Student media" subtitle="Images and PDFs from students"
              fileList={studentFiles}
              uploadRef={studentInputRef}
              showUpload={isStudent || canUploadAll}
              uploadLabel={isStudent ? '+ Upload media' : '+ Upload'}
            />
            {loading
              ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
              : studentFiles.length === 0
                ? <div className="py-8 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                    <p className="dark:text-gray-600 text-gray-400 text-sm">No student uploads yet</p>
                  </div>
                : <div className="space-y-2">
                    {studentFiles.map(file => (
                      <FileRow key={file.id} file={file}
                        selecting={selecting && canDelete}
                        selected={selected.has(file.id)}
                        onToggle={toggleSelect}
                      />
                    ))}
                  </div>
            }
          </section>
        )}
      </div>

      {pendingFile && (
        <ConfirmUploadModal file={pendingFile} onConfirm={handleConfirmUpload} onCancel={() => setPendingFile(null)}/>
      )}

      <ConfirmDialog
        open={confirmBulkDelete} danger
        title={`Delete ${selected.size} file${selected.size !== 1 ? 's' : ''}?`}
        description="This will permanently remove the selected files for everyone."
        confirmText="Delete"
        onCancel={() => setConfirmBulkDelete(false)}
        onConfirm={handleBulkDelete}
        disabled={deleting}
      />
    </div>
  );
}
