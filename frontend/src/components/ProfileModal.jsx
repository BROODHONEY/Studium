import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const COLORS = ['#4f46e5','#0d9488','#6366F1','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const roleStyles = {
  teacher: { bg: 'rgba(250,204,21,0.1)', color: '#facc15', border: 'rgba(250,204,21,0.2)' },
  admin:   { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  student: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
};

const PS = {
  lbl: {
    fontSize: 10, fontWeight: 700, color: '#55556A',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    display: 'block', marginBottom: 6,
  },
  inp: {
    width: '100%', background: '#111116',
    border: '1px solid #2A2A38', borderRadius: 10,
    padding: '12px 16px', fontSize: 14, color: '#EEEEF5',
    outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  primaryBtn: {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #5B5FEF, #4338CA)',
    border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    cursor: 'pointer', transition: 'opacity 0.15s',
    fontFamily: 'Inter, sans-serif',
  },
  cancelBtn: {
    width: '100%', padding: '12px',
    background: 'none', border: 'none',
    color: '#55556A', fontSize: 13, fontWeight: 400,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'color 0.15s',
  },
};

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#55556A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 300, color: value ? '#EEEEF5' : '#55556A', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Not set'}
      </span>
    </div>
  );
}

export default function ProfileModal({ userId, onClose }) {
  const { user: me, login, token } = useAuth();
  const { addToast } = useToast();

  const isOwnProfile = userId === me?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name: '', department: '', year: '' });

  useEffect(() => {
    setLoading(true);
    profileAPI.get(userId)
      .then(res => {
        setProfile(res.data);
        setForm({ name: res.data.name || '', department: res.data.department || '', year: res.data.year || '' });
      })
      .catch(() => addToast({ type: 'error', message: 'Failed to load profile.' }))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await profileAPI.update(form);
      setProfile(res.data);
      login(token, { ...me, ...res.data });
      setEditing(false);
      addToast({ type: 'success', message: 'Profile updated.' });
    } catch {
      addToast({ type: 'error', message: 'Failed to save profile.' });
    } finally { setSaving(false); }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const rs = roleStyles[profile?.role] || roleStyles.student;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 420, background: '#1A1A1F', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.9)', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: 64, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #5B5FEF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
          </div>
        ) : editing ? (
          <>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #2A2A38', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#EEEEF5' }}>Edit Profile</span>
              <button onClick={() => setEditing(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556A', lineHeight: 0, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#9898B0'}
                onMouseLeave={e => e.currentTarget.style.color = '#55556A'}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={PS.lbl}>Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={PS.inp} placeholder="Your name" required
                  onFocus={e => e.target.style.borderColor = '#5B5FEF'}
                  onBlur={e => e.target.style.borderColor = '#2A2A38'} />
              </div>
              {profile?.role === 'student' && (
                <>
                  <div>
                    <label style={PS.lbl}>Department</label>
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      style={PS.inp} placeholder="e.g. Computer Science"
                      onFocus={e => e.target.style.borderColor = '#5B5FEF'}
                      onBlur={e => e.target.style.borderColor = '#2A2A38'} />
                  </div>
                  <div>
                    <label style={PS.lbl}>Year</label>
                    <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                      style={{ ...PS.inp, appearance: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#5B5FEF'}
                      onBlur={e => e.target.style.borderColor = '#2A2A38'}>
                      <option value="">Select year</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
                <button type="submit" disabled={saving}
                  style={{ ...PS.primaryBtn, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)} style={PS.cancelBtn}
                  onMouseEnter={e => e.currentTarget.style.color = '#9898B0'}
                  onMouseLeave={e => e.currentTarget.style.color = '#55556A'}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={{ position: 'relative', height: 100, background: `linear-gradient(135deg, ${avatarBg(profile?.name)}44, #0D0D10)` }}>
              <button onClick={onClose}
                style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid #2A2A38', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#55556A' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9898B0'}
                onMouseLeave={e => e.currentTarget.style.color = '#55556A'}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
                </svg>
              </button>
              <div style={{ position: 'absolute', bottom: -36, left: 24, width: 72, height: 72, borderRadius: '50%', background: avatarBg(profile?.name), border: '3px solid #1A1A1F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600, color: '#fff' }}>
                {initials}
              </div>
            </div>

            <div style={{ padding: '48px 24px 20px', borderBottom: '1px solid #2A2A38' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '0 0 8px' }}>{profile?.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, textTransform: 'capitalize', letterSpacing: '0.04em' }}>
                  {profile?.role}
                </span>
                {profile?.roll_no && (
                  <span style={{ fontSize: 12, fontWeight: 300, color: '#55556A' }}>{profile.roll_no}</span>
                )}
              </div>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {profile?.role === 'student' && <InfoRow label="Year" value={profile?.year} />}
              <InfoRow label="Department" value={profile?.department} />
              <InfoRow label="Email" value={profile?.email} />
            </div>

            {isOwnProfile && (
              <div style={{ padding: '0 24px 24px' }}>
                <button onClick={() => setEditing(true)} style={PS.primaryBtn}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  Edit Profile
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
