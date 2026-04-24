import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../services/api';

export default function GroupModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [createForm, setCreateForm] = useState({ name: '', subject: '', description: '', isPrivate: true });
  const [joinCode, setJoinCode] = useState('');

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

  const labelStyle = {
    display: 'block',
    fontSize: 10,
    fontWeight: 700,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    marginBottom: 10
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: '#0d0d10',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(165,166,246,0.75)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.01em',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: '0 16px' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      
      {/* gradient glow */}
      <div style={{ position: 'absolute', width: 700, height: 400, background: 'radial-gradient(ellipse at center, rgba(165,166,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, width: '100%', maxWidth: 920, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', fontFamily: 'Inter, sans-serif', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: isTeacher ? '1fr 1fr' : '1fr', overflow: 'hidden' }}>
        
        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', transition: 'all 0.2s', zIndex: 10 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#666'; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Left: Create Group (only for teachers) */}
        {isTeacher && (
          <div style={{ padding: '48px 40px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Create Group</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 32px', lineHeight: 1.65 }}>
              Set up a new study group for your class. Students can join using the invite code you'll receive.
            </p>

            {error && (
              <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#ef4444', fontSize: 12, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Quantum Mechanics"
                  value={createForm.name}
                  required
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Physics"
                  value={createForm.subject}
                  required
                  onChange={e => setCreateForm(p => ({ ...p, subject: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Description <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <textarea
                  placeholder="Add details about the group..."
                  value={createForm.description}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ ...buttonStyle, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => !loading && (e.currentTarget.style.background = 'rgba(165,166,246,0.9)')}
                onMouseLeave={e => !loading && (e.currentTarget.style.background = 'rgba(165,166,246,0.75)')}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        )}

        {/* Right: Join Group */}
        <div style={{ padding: '48px 40px', background: isTeacher ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Join Group</h2>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 32px', lineHeight: 1.65 }}>
            Enter the invite code shared by your teacher to join an existing study group.
          </p>

          {error && !isTeacher && (
            <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#ef4444', fontSize: 12, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Invite Code</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {[0,1,2,3,4,5].map(i => (
                  <input
                    key={i}
                    type="text"
                    maxLength="1"
                    value={joinCode[i] || ''}
                    onChange={e => {
                      const val = e.target.value.toUpperCase();
                      if (/^[A-Z0-9]?$/.test(val)) {
                        const newCode = joinCode.split('');
                        newCode[i] = val;
                        setJoinCode(newCode.join(''));
                        if (val && i < 5) e.target.nextElementSibling?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !joinCode[i] && i > 0) {
                        e.target.previousElementSibling?.focus();
                      }
                    }}
                    style={{
                      ...inputStyle,
                      textAlign: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      fontFamily: 'monospace',
                      padding: '16px 8px'
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || joinCode.length < 6}
              style={{ ...buttonStyle, opacity: (loading || joinCode.length < 6) ? 0.4 : 1, cursor: (loading || joinCode.length < 6) ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => !loading && joinCode.length >= 6 && (e.currentTarget.style.background = 'rgba(165,166,246,0.9)')}
              onMouseLeave={e => !loading && joinCode.length >= 6 && (e.currentTarget.style.background = 'rgba(165,166,246,0.75)')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M3 12h12"/>
              </svg>
              {loading ? 'Joining...' : 'Connect to Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
