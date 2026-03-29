import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

const DEPARTMENTS = [
  'B. Tech Artificial Intelligence and Machine Learning',
  'B. Tech Artificial Intelligence and Data Science',
  'B. Tech Computer Science',
];

const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const baseInp = {
  width: '100%', background: '#111111', border: '1px solid #1c1c1c', borderRadius: 10,
  padding: '10px 14px', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.8)',
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const lbl = {
  fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.25)',
  textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6,
};

export default function SettingsPanel() {
  const { user, logout, login, token } = useAuth();
  const { addToast } = useToast();

  const [form, setForm]     = useState({ name: user?.name || '', department: user?.department || '', year: user?.year || '' });
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  const handleChange = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setEdited(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await profileAPI.update(form);
      login(token, { ...user, ...res.data });
      setEdited(false);
      addToast({ type: 'success', message: 'Profile saved.' });
    } catch { addToast({ type: 'error', message: 'Failed to save profile.' }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'transparent', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid #1c1c1c' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1a1a1a', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 400, color: 'rgba(124,58,237,0.8)', flexShrink: 0 }}>
            {ini(user?.name)}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '3px 0 0', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>

        {/* Profile form */}
        <div style={{ background: '#080808', border: '1px solid #1c1c1c', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Profile</p>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Full name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required
                style={baseInp}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
            </div>
            {user?.role === 'student' && (
              <>
                <div>
                  <label style={lbl}>Department</label>
                  <select name="department" value={form.department} onChange={handleChange}
                    style={{ ...baseInp, appearance: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                    onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Year</label>
                  <select name="year" value={form.year} onChange={handleChange}
                    style={{ ...baseInp, appearance: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                    onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
                    <option value="">Select year</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>)}
                  </select>
                </div>
              </>
            )}
            <button type="submit" disabled={saving || !edited}
              style={{ padding: '10px', borderRadius: 10, background: edited && !saving ? '#ffffff' : '#111111', border: '1px solid', borderColor: edited && !saving ? '#ffffff' : '#1c1c1c', color: edited && !saving ? '#000000' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 500, cursor: edited && !saving ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Account */}
        <div style={{ background: '#080808', border: '1px solid #1c1c1c', borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {user?.email && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.25)' }}>Email</span>
                <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.55)' }}>{user.email}</span>
              </div>
            )}
            {user?.phone && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.25)' }}>Phone</span>
                <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.55)' }}>{user.phone}</span>
              </div>
            )}
          </div>
          <button onClick={logout}
            style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'none', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.7)', fontSize: 13, fontWeight: 400, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}>
            Sign out
          </button>
        </div>

      </div>
    </div>
  );
}
