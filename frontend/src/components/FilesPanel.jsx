import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { filesAPI } from '../services/api';

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

const formatDate = (ts) =>
  new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

// Upload confirm modal
function ConfirmUploadModal({ file, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="text-sm font-semibold text-white mb-4">Upload this file?</h3>
        <div className="bg-gray-800 rounded-xl p-4 mb-5 flex items-center gap-3">
          <span style={{fontSize:28}}>{FILE_ICONS[file.type] || '📎'}</span>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatSize(file.size)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, canDelete, onDelete }) {
  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition group">
      <div style={{fontSize:26}} className="flex-shrink-0">{FILE_ICONS[file.file_type] || '📎'}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{file.filename}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatSize(file.size_bytes)}
          {file.users?.name && ` · ${file.users.name}`}
          {` · ${formatDate(file.created_at)}`}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a href={file.file_url} target="_blank" rel="noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition">
          Download
        </a>
        {canDelete && (
          <button onClick={() => onDelete(file.id)}
            className="text-xs text-gray-600 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function FilesPanel({ group }) {
  const { user }  = useAuth();
  const myRole    = group?.my_role;
  const isAdmin   = myRole === 'admin';
  const isTeacher = myRole === 'teacher';
  const isStudent = myRole === 'student';
  const canUploadAll    = isAdmin || isTeacher;
  const canUploadMedia  = isStudent;

  const teacherInputRef = useRef(null);
  const studentInputRef = useRef(null);

  const [files, setFiles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [error, setError]           = useState('');
  const [pendingFile, setPendingFile] = useState(null); // file awaiting confirm

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    setError('');
    filesAPI.list(group.id)
      .then(res => setFiles(res.data))
      .catch(() => setError('Could not load files'))
      .finally(() => setLoading(false));
  }, [group?.id]);

  // When user picks a file, show confirm modal instead of uploading immediately
  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    // Reset input so same file can be picked again
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', pendingFile);
    try {
      const res = await filesAPI.upload(group.id, formData);
      setFiles(prev => [res.data, ...prev]);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await filesAPI.delete(group.id, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch {
      setError('Could not delete file');
    }
  };

  // Split files into teacher/admin uploads vs student uploads
  const teacherFiles = files.filter(f => f.uploaded_by_role !== 'student');
  const studentFiles = files.filter(f => f.uploaded_by_role === 'student');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950 overflow-y-auto">
      <div className="p-5 space-y-8">

        {error && (
          <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* ── Study materials (teacher/admin uploads) ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-white">Study materials</h3>
              <p className="text-xs text-gray-600 mt-0.5">Uploaded by teachers</p>
            </div>
            {canUploadAll && (
              <>
                <input ref={teacherInputRef} type="file" className="hidden"
                  onChange={handleFilePick}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"/>
                <button onClick={() => teacherInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
                  {uploading ? 'Uploading...' : '+ Upload'}
                </button>
              </>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse"/>)}
            </div>
          ) : teacherFiles.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-600 text-sm">No study materials yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teacherFiles.map(file => (
                <FileRow key={file.id} file={file}
                  canDelete={isAdmin || file.users?.id === user?.id}
                  onDelete={handleDelete}/>
              ))}
            </div>
          )}
        </section>

        {/* ── Student media ── */}
        {(isStudent || canUploadAll) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-white">Student media</h3>
                <p className="text-xs text-gray-600 mt-0.5">Images and PDFs from students</p>
              </div>
              {canUploadMedia && (
                <>
                  <input ref={studentInputRef} type="file" className="hidden"
                    onChange={handleFilePick}
                    accept=".pdf,.jpg,.jpeg,.png"/>
                  <button onClick={() => studentInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
                    {uploading ? 'Uploading...' : '+ Upload media'}
                  </button>
                </>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse"/>)}
              </div>
            ) : studentFiles.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-gray-800 rounded-xl">
                <p className="text-gray-600 text-sm">No student uploads yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {studentFiles.map(file => (
                  <FileRow key={file.id} file={file}
                    canDelete={isAdmin || file.users?.id === user?.id}
                    onDelete={handleDelete}/>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Confirm upload modal */}
      {pendingFile && (
        <ConfirmUploadModal
          file={pendingFile}
          onConfirm={handleConfirmUpload}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}