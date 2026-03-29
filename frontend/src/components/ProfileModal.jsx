import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const COLORS = ['#4f46e5','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const roleStyles = {
  teacher: { bg: 'rgba(250,204,21,0.1)', color: '#facc15', border: 'rgba(250,204,21,0.2)' },
  admin:   { bg: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: 'rgba(124,58,237,0.25)' },
  student: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: 'rgba(56,189,248,0.2)' },
};

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 300, color: value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)', fontStyle: value ? 'normal' : 'italic' }}>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 420, margin: '0 16px', borderRadius: 20, background: '#0d0d0d', border: '1px solid #1c1c1c', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}
        onClick={e => e.stopPropagation()}>

        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
          </div>
        ) : editing ? (
          <>
            {/* Edit header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>Edit Profile</span>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', lineHeight: 0, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="form-input" placeholder="Your name" required />
              </div>
              {profile?.role === 'student' && (
                <>
                  <div>
                    <label className="form-label">Department</label>
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      className="form-input" placeholder="e.g. Computer Science" />
                  </div>
                  <div>
                    <label className="form-label">Year</label>
                    <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="form-input">
                      <option value="">Select year</option>
                      {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, background: '#111111', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 300, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Banner + avatar */}
            <div style={{ position: 'relative', height: 100, background: `linear-gradient(135deg, ${avatarBg(profile?.name)}33, #0d0d0d)` }}>
              {/* Close button */}
              <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
              </button>
              {/* Avatar — overlaps banner */}
              <div style={{ position: 'absolute', bottom: -36, left: 24, width: 72, height: 72, borderRadius: '50%', background: avatarBg(profile?.name), border: '3px solid #0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
            </div>

            {/* Name + role */}
            <div style={{ padding: '48px 24px 20px', borderBottom: '1px solid #1c1c1c' }}>
              <p style={{ fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: 0 }}>{profile?.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 400, padding: '3px 10px', borderRadius: 20, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, textTransform: 'capitalize' }}>
                  {profile?.role}
                </span>
                {profile?.roll_no && (
                  <span style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.3)' }}>{profile.roll_no}</span>
                )}
              </div>
            </div>

            {/* Info fields */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {profile?.role === 'student' && <InfoRow label="Year" value={profile?.year} />}
              <InfoRow label="Department" value={profile?.department} />
              <InfoRow label="Email" value={profile?.email} />
            </div>

            {/* Edit button */}
            {isOwnProfile && (
              <div style={{ padding: '0 24px 24px' }}>
                <button onClick={() => setEditing(true)}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#111111', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 400, cursor: 'pointer', transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
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
