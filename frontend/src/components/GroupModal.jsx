import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';

const inp = {
  width: '100%', background: '#111111', border: '1px solid #1c1c1c', borderRadius: 10,
  padding: '10px 14px', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.8)',
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.15s',
};
const lbl = {
  fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6,
};

export default function GroupModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [mode, setMode]       = useState(isTeacher ? 'create' : 'join');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [createForm, setCreateForm] = useState({ name: '', subject: '', description: '' });
  const [joinCode, setJoinCode]     = useState('');

  const handleCreate = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const res = await groupsAPI.create(createForm); onSuccess(res.data); onClose(); }
    catch (err) { setError(err.response?.data?.error || 'Could not create group'); }
    finally { setLoading(false); }
  };

  const handleJoin = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const res = await groupsAPI.join(joinCode.trim().toUpperCase()); onSuccess(res.data.group); onClose(); }
    catch (err) { setError(err.response?.data?.error || 'Could not join group'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Subtle top gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}/>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: 0 }}>
            {mode === 'create' ? 'Create group' : 'Join group'}
          </h2>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', lineHeight: 0, padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
            </svg>
          </button>
        </div>

        {/* Mode tabs — only show if teacher (has both options) */}
        {isTeacher && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
            {['create', 'join'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: mode === m ? 400 : 300, transition: 'all 0.15s',
                  background: mode === m ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(76,29,149,0.2))' : 'transparent',
                  color: mode === m ? 'rgba(196,181,253,0.95)' : 'rgba(255,255,255,0.35)',
                  boxShadow: mode === m ? '0 0 10px rgba(124,58,237,0.12)' : 'none',
                }}>
                {m === 'create' ? 'Create' : 'Join'}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'rgba(239,68,68,0.8)', fontSize: 12, fontWeight: 300, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Create form */}
        {mode === 'create' ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Group name</label>
              <input style={inp} placeholder="OS Section A" value={createForm.name} required
                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
            </div>
            <div>
              <label style={lbl}>Subject</label>
              <input style={inp} placeholder="Operating Systems" value={createForm.subject} required
                onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
            </div>
            <div>
              <label style={lbl}>Description <span style={{ color: 'rgba(255,255,255,0.15)', fontWeight: 300 }}>(optional)</span></label>
              <input style={inp} placeholder="Morning batch, Room 301" value={createForm.description}
                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s', marginTop: 2 }}>
              {loading ? 'Creating…' : 'Create group'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Invite code</label>
              <input
                style={{ ...inp, textAlign: 'center', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: 20, fontWeight: 400, fontFamily: 'monospace' }}
                placeholder="XK92PL" value={joinCode} required maxLength={6}
                onChange={e => setJoinCode(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
              <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Ask your teacher for the 6-character code</p>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s', marginTop: 2 }}>
              {loading ? 'Joining…' : 'Join group'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
