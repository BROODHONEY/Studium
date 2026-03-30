import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

// ── Shared styles ──────────────────────────────────────
const DEPARTMENTS = [
  'B. Tech Artificial Intelligence and Machine Learning',
  'B. Tech Artificial Intelligence and Data Science',
  'B. Tech Computer Science',
];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const AVATAR_COLORS = ['#4f46e5','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const inp = {
  width: '100%', background: '#111111', border: '1px solid #1c1c1c', borderRadius: 10,
  padding: '10px 14px', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.8)',
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.15s',
};
const lbl = {
  fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.3)',
  textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6,
};
const card = { background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, padding: '20px' };
const sectionTitle = { fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' };
const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
const divider = { height: 1, background: '#1c1c1c', margin: '16px 0' };

function InfoRow({ label, value }) {
  return (
    <div style={rowStyle}>
      <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>{value || '—'}</span>
    </div>
  );
}

function Toggle({ on, onToggle, label, sub }) {
  return (
    <div style={rowStyle}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <button onClick={onToggle}
        style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: on ? '#7c3aed' : '#2a2a2a', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }}/>
      </button>
    </div>
  );
}

// ── Section: Account ──────────────────────────────────
function AccountSection({ user, login, token, addToast }) {
  const [profile, setProfile] = useState({ name: user?.name || '', department: user?.department || '', year: user?.year || '' });
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => { setProfile(p => ({ ...p, [e.target.name]: e.target.value })); setEdited(true); };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return;
    setSaving(true);
    try {
      const res = await profileAPI.update(profile);
      login(token, { ...user, ...res.data });
      setEdited(false);
      addToast({ type: 'success', message: 'Profile updated.' });
    } catch { addToast({ type: 'error', message: 'Failed to save.' }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        <p style={sectionTitle}>Profile</p>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Full name</label>
            <input name="name" value={profile.name} onChange={handleChange} placeholder="Your name" required style={inp}
              onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
              onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
          </div>
          {user?.role === 'student' && (
            <>
              <div>
                <label style={lbl}>Department</label>
                <select name="department" value={profile.department} onChange={handleChange} style={{ ...inp, appearance: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                  onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Year</label>
                <select name="year" value={profile.year} onChange={handleChange} style={{ ...inp, appearance: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                  onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
          <button type="submit" disabled={saving || !edited}
            style={{ padding: '10px', borderRadius: 10, background: edited && !saving ? '#7c3aed' : '#111111', border: '1px solid', borderColor: edited && !saving ? '#7c3aed' : '#1c1c1c', color: edited && !saving ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 500, cursor: edited && !saving ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
      <div style={card}>
        <p style={sectionTitle}>Account info</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <InfoRow label="Email" value={user?.email} />
          {user?.phone && <InfoRow label="Phone" value={user?.phone} />}
          {user?.roll_no && <InfoRow label="Roll No" value={user?.roll_no} />}
          {user?.department && <InfoRow label="Department" value={user?.department} />}
        </div>
      </div>
    </div>
  );
}

// ── Section: Security ─────────────────────────────────
function SecuritySection({ addToast }) {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (pwForm.next.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await profileAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      addToast({ type: 'success', message: 'Password changed.' });
    } catch (err) { setError(err.response?.data?.error || 'Failed to change password.'); }
    finally { setSaving(false); }
  };

  const PwInput = ({ field, placeholder }) => (
    <div style={{ position: 'relative' }}>
      <input type={showPw[field] ? 'text' : 'password'} value={pwForm[field]}
        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder} style={{ ...inp, paddingRight: 40 }}
        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
        onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
      <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', lineHeight: 0 }}>
        {showPw[field]
          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    </div>
  );

  return (
    <div style={card}>
      <p style={sectionTitle}>Change Password</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div><label style={lbl}>Current password</label><PwInput field="current" placeholder="Enter current password"/></div>
        <div><label style={lbl}>New password</label><PwInput field="next" placeholder="At least 6 characters"/></div>
        <div><label style={lbl}>Confirm new password</label><PwInput field="confirm" placeholder="Repeat new password"/></div>
        {error && <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={saving || !pwForm.current || !pwForm.next || !pwForm.confirm}
          style={{ padding: '10px', borderRadius: 10, background: pwForm.current && pwForm.next && pwForm.confirm ? '#7c3aed' : '#111111', border: '1px solid', borderColor: pwForm.current && pwForm.next && pwForm.confirm ? '#7c3aed' : '#1c1c1c', color: pwForm.current && pwForm.next && pwForm.confirm ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

// ── Section: Personalise ──────────────────────────────
function PersonaliseSection() {
  const { dark, toggle } = useTheme();
  const [notifSound, setNotifSound]     = useState(() => localStorage.getItem('notif_sound') !== 'off');
  const [notifBadge, setNotifBadge]     = useState(() => localStorage.getItem('notif_badge') !== 'off');
  const [notifDesktop, setNotifDesktop] = useState(() => localStorage.getItem('notif_desktop') === 'on');
  const { addToast } = useToast();

  const toggleNotif = (key, val, setter) => { setter(val); localStorage.setItem(key, val ? 'on' : 'off'); };
  const requestDesktop = async (val) => {
    if (val && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') { addToast({ type: 'error', message: 'Desktop notifications blocked.' }); return; }
    }
    toggleNotif('notif_desktop', val, setNotifDesktop);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        <p style={sectionTitle}>Appearance</p>
        <Toggle on={dark} onToggle={toggle} label="Dark mode" sub="Switch between dark and light theme"/>
      </div>
      <div style={card}>
        <p style={sectionTitle}>Notifications</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Toggle on={notifSound} onToggle={() => toggleNotif('notif_sound', !notifSound, setNotifSound)} label="Message sounds" sub="Play a sound for new messages"/>
          <div style={divider}/>
          <Toggle on={notifBadge} onToggle={() => toggleNotif('notif_badge', !notifBadge, setNotifBadge)} label="Unread badges" sub="Show unread count indicators"/>
          <div style={divider}/>
          <Toggle on={notifDesktop} onToggle={() => requestDesktop(!notifDesktop)} label="Desktop notifications" sub="Browser push notifications"/>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar nav ───────────────────────────────────────
export function SettingsSidebar({ activeSection, onSection, onViewProfile }) {
  const { user } = useAuth();
  const NAV = [
    { key: 'account',     label: 'Account',     icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 8a7 7 0 0 1 14 0' },
    { key: 'security',    label: 'Security',     icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { key: 'personalise', label: 'Personalise',  icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      {/* Profile header */}
      <button onClick={() => onViewProfile?.(user?.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarBg(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
          {ini(user?.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
          <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', textTransform: 'capitalize' }}>{user?.role}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
          <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const isActive = activeSection === item.key;
          return (
            <button key={item.key} onClick={() => onSection(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', position: 'relative',
                background: isActive ? 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(76,29,149,0.12))' : 'none',
                color: isActive ? 'rgba(196,181,253,0.95)' : 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none'; }}>
              {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: '0 2px 2px 0', background: '#7c3aed' }}/>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.icon}/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: isActive ? 500 : 300 }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sign out at bottom */}
      <div style={{ padding: '10px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <SignOutButton />
      </div>
    </div>
  );
}

function SignOutButton() {
  const { logout } = useAuth();
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={logout} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.9)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Sign out</button>
      <button onClick={() => setConfirm(false)} style={{ flex: 1, padding: '9px', borderRadius: 10, background: '#111111', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 300, cursor: 'pointer' }}>Cancel</button>
    </div>
  );
  return (
    <button onClick={() => setConfirm(true)}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'none', color: 'rgba(239,68,68,0.6)', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'rgba(239,68,68,0.9)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
      </svg>
      <span style={{ fontSize: 14, fontWeight: 300 }}>Sign out</span>
    </button>
  );
}

// ── Main panel content ────────────────────────────────
export default function SettingsPanel({ activeSection }) {
  const { user, login, token } = useAuth();
  const { addToast } = useToast();

  const empty = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.35) 0%, rgba(76,29,149,0.15) 35%, transparent 65%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(124,58,237,0.4)', margin: '0 auto 12px', display: 'block' }}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 300, margin: 0 }}>Select a setting from the sidebar</p>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', background: 'transparent', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>
      {!activeSection && empty}
      {activeSection && (
        <div style={{ maxWidth: 560, margin: '0 auto', width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: '0 0 4px', textTransform: 'capitalize' }}>{activeSection}</h2>
          {activeSection === 'account'     && <AccountSection user={user} login={login} token={token} addToast={addToast}/>}
          {activeSection === 'security'    && <SecuritySection addToast={addToast}/>}
          {activeSection === 'personalise' && <PersonaliseSection/>}
        </div>
      )}
    </div>
  );
}
