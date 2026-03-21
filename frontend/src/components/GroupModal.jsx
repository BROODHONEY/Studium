import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';

export default function GroupModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [mode, setMode]     = useState(isTeacher ? 'create' : 'join');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const [createForm, setCreateForm] = useState({ name: '', subject: '', description: '' });
  const [joinCode, setJoinCode]     = useState('');

  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await groupsAPI.create(createForm);
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await groupsAPI.join(joinCode.trim().toUpperCase());
      onSuccess(res.data.group);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {isTeacher && (
            <button onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition
                ${mode === 'create' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              Create group
            </button>
          )}
          <button onClick={() => setMode('join')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition
              ${mode === 'join' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Join group
          </button>
        </div>

        {error && (
          <div className="error-box mb-4">{error}</div>
        )}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="form-label">Group name</label>
              <input className="form-input" placeholder="OS Section A"
                value={createForm.name} required
                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}/>
            </div>
            <div>
              <label className="form-label">Subject</label>
              <input className="form-input" placeholder="Operating Systems"
                value={createForm.subject} required
                onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))}/>
            </div>
            <div>
              <label className="form-label">Description <span className="text-gray-600">(optional)</span></label>
              <input className="form-input" placeholder="Morning batch, Room 301"
                value={createForm.description}
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}/>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create group'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="form-label">Invite code</label>
              <input className="form-input text-center tracking-widest uppercase text-lg"
                placeholder="XK92PL"
                value={joinCode} required maxLength={6}
                onChange={e => setJoinCode(e.target.value)}/>
              <p className="text-xs text-gray-600 mt-1.5">Ask your teacher for the 6-character code</p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Joining...' : 'Join group'}
            </button>
          </form>
        )}

        <button onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-400 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}