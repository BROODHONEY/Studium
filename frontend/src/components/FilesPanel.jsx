import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { filesAPI } from '../services/api';

const FILE_ICONS = {
  'application/pdf': '📄',
  'application/vnd.ms-powerpoint': '📊',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📋',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📋',
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

export default function FilesPanel({ group }) {
  const { user }  = useAuth();
  const isTeacher = group?.my_role === 'teacher';
  const fileInputRef = useRef(null);

  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    setError('');
    filesAPI.list(group.id)
      .then(res => setFiles(res.data))
      .catch(() => setError('Could not load files'))
      .finally(() => setLoading(false));
  }, [group?.id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setUploadProgress(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await filesAPI.upload(group.id, formData);
      setFiles(prev => [res.data, ...prev]);
      setUploadProgress('');
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploadProgress('');
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    try {
      await filesAPI.delete(group.id, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch {
      setError('Could not delete file');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950">

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-sm font-medium text-white">Study materials</h3>
          <p className="text-xs text-gray-500 mt-0.5">{files.length} file{files.length !== 1 ? 's' : ''}</p>
        </div>
        {isTeacher && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition">
              {uploading ? 'Uploading...' : '+ Upload file'}
            </button>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploadProgress && (
        <div className="mx-5 mt-3 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs">
          {uploadProgress}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mt-3 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse"/>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3" style={{fontSize:40}}>📂</div>
            <p className="text-gray-500 text-sm">No files uploaded yet</p>
            {isTeacher && (
              <p className="text-gray-700 text-xs mt-1">
                Click "Upload file" to share study materials
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.id}
                className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition group">

                {/* Icon */}
                <div className="text-2xl flex-shrink-0" style={{fontSize:28}}>
                  {FILE_ICONS[file.file_type] || '📎'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{file.filename}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatSize(file.size_bytes)}
                    {file.users?.name && ` · uploaded by ${file.users.name}`}
                    {` · ${formatDate(file.created_at)}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={file.file_url} target="_blank" rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20">
                    Download
                  </a>
                  {(isTeacher || file.users?.id === user?.id) && (
                    <button onClick={() => handleDelete(file.id)}
                      className="text-xs text-gray-600 hover:text-red-400 transition px-2 py-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100">
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}