import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)', padding: 16,
  },
  modal: {
    width: '100%', maxWidth: 440,
    background: '#16161E', borderRadius: 20,
    boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
    fontFamily: 'Inter, sans-serif', overflow: 'hidden',
  },
  lbl: {
    fontSize: 10, fontWeight: 700, color: '#55556E',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    display: 'block', marginBottom: 6,
  },
  inp: {
    width: '100%', background: '#1C1C26',
    border: '1px solid #2A2A36', borderRadius: 10,
    padding: '12px 16px', fontSize: 14, fontWeight: 400,
    color: '#EEEEF8', outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  primaryBtn: {
    width: '100%', padding: '14px',
    background: '#6366F1',
    border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    cursor: 'pointer', transition: 'opacity 0.15s',
    fontFamily: 'Inter, sans-serif',
  },
  cancelBtn: {
    width: '100%', padding: '12px',
    background: 'none', border: 'none',
    color: '#55556E', fontSize: 13, fontWeight: 400,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'color 0.15s',
  },
  infoFooter: {
    borderLeft: '3px solid #2A2A36',
    background: '#1C1C26',
    borderRadius: 8,
    padding: '10px 14px',
    display: 'flex', alignItems: 'flex-start', gap: 8,
  },
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

  const tabs = isTeacher ? ['join', 'create'] : ['join'];

  return (
    <div style={S.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2A2A36' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => { setMode(t); setError(''); }}
              style={{
                flex: 1, padding: '16px 0',
                background: 'none', border: 'none',
                borderBottom: mode === t ? '2px solid #5B5FEF' : '2px solid transparent',
                marginBottom: -1,
                color: mode === t ? '#EEEEF8' : '#55556E',
                fontSize: 13,
                fontWeight: mode === t ? 700 : 400,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                transition: 'color 0.15s',
              }}>
              {t === 'join' ? 'Join Group' : 'Create Group'}
            </button>
          ))}
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          {mode === 'join' ? (
            <>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#EEEEF8', margin: '0 0 8px' }}>Collaborative Access</p>
              <p style={{ fontSize: 13, fontWeight: 300, color: '#9090B0', margin: '0 0 24px', lineHeight: 1.5 }}>
                Enter a unique invitation code to join an existing group.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#EEEEF8', margin: '0 0 8px' }}>Create a Group</p>
              <p style={{ fontSize: 13, fontWeight: 300, color: '#9090B0', margin: '0 0 24px', lineHeight: 1.5 }}>
                Set up a new collaborative space for your class.
              </p>
            </>
          )}

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'rgba(239,68,68,0.85)', fontSize: 12, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {mode === 'join' ? (
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={S.lbl}>Invitation Code</label>
                <input
                  style={{ ...S.inp, textAlign: 'center', letterSpacing: '0.25em', textTransform: 'uppercase', fontSize: 20, fontFamily: 'monospace' }}
                  placeholder="ST-XXXX-XXXX" value={joinCode} required
                  onChange={e => setJoinCode(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2A3A'}
                />
                <p style={{ fontSize: 12, fontWeight: 300, color: '#55556E', marginTop: 8, fontStyle: 'italic' }}>
                  Example: STUDY-GROUP-2024
                </p>
              </div>

              <button type="submit" disabled={loading}
                style={{ ...S.primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Validating…' : 'Validate & Join'}
              </button>
              <button type="button" onClick={onClose} style={S.cancelBtn}
                onMouseEnter={e => e.currentTarget.style.color = '#9090B0'}
                onMouseLeave={e => e.currentTarget.style.color = '#55556E'}>
                Cancel
              </button>

              <div style={{ ...S.infoFooter, marginTop: 8 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="#55556A" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 300, color: '#55556E', lineHeight: 1.5 }}>
                  Joining a group gives you instant access to shared files and real-time collaboration.
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.lbl}>Group Name</label>
                <input style={S.inp} placeholder="OS Section A" value={createForm.name} required
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2A3A'} />
              </div>
              <div>
                <label style={S.lbl}>Subject</label>
                <input style={S.inp} placeholder="Operating Systems" value={createForm.subject} required
                  onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2A3A'} />
              </div>
              <div>
                <label style={S.lbl}>
                  Description <span style={{ color: '#55556E', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input style={S.inp} placeholder="Morning batch, Room 301" value={createForm.description}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2A3A'} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                <button type="submit" disabled={loading}
                  style={{ ...S.primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Creating…' : 'Create Group'}
                </button>
                <button type="button" onClick={onClose} style={S.cancelBtn}
                  onMouseEnter={e => e.currentTarget.style.color = '#9090B0'}
                  onMouseLeave={e => e.currentTarget.style.color = '#55556E'}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
