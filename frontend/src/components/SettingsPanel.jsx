import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

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
const card = {
  background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, padding: '20px 20px',
};
const sectionTitle = {
  fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)',
  textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px',
};
const row = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
};
const divider = { height: 1, background: '#1c1c1c', margin: '16px 0' };

function InfoRow({ label, value }) {
  return (
    <div style={row}>
      <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>{value || '—'}</span>
    </div>
  );
}

function Toggle({ on, onToggle, label, sub }) {
  return (
    <div style={row}>
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

export default function SettingsPanel() {
  const { user, logout, login, token } = useAuth();
  const { dark, toggle: toggleTheme }  = useTheme();
  const { addToast } = useToast();

  // Profile form
  const [profile, setProfile] = useState({ name: user?.name || '', department: user?.department || '', year: user?.year || '' });
  const [profileEdited, setProfileEdited] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]     = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError]   = useState('');

  // Notification prefs (localStorage only)
  const [notifSound, setNotifSound]   = useState(() => localStorage.getItem('notif_sound') !== 'off');
  const [notifBadge, setNotifBadge]   = useState(() => localStorage.getItem('notif_badge') !== 'off');
  const [notifDesktop, setNotifDesktop] = useState(() => localStorage.getItem('notif_desktop') === 'on');

  // Confirm sign out
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleProfileChange = (e) => { setProfile(p => ({ ...p, [e.target.name]: e.target.value })); setProfileEdited(true); };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return;
    setSavingProfile(true);
    try {
      const res = await profileAPI.update(profile);
      login(token, { ...user, ...res.data });
      setProfileEdited(false);
      addToast({ type: 'success', message: 'Profile updated.' });
    } catch { addToast({ type: 'error', message: 'Failed to save profile.' }); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await profileAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      addToast({ type: 'success', message: 'Password changed.' });
    } catch (err) {
      setPwError(err.response?.data?.error || 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  const toggleNotif = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, val ? 'on' : 'off');
  };

  const requestDesktopNotif = async (val) => {
    if (val && Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { addToast({ type: 'error', message: 'Desktop notifications blocked.' }); return; }
    }
    toggleNotif('notif_desktop', val, setNotifDesktop);
  };

  const PwInput = ({ field, placeholder }) => (
    <div style={{ position: 'relative' }}>
      <input
        type={showPw[field] ? 'text' : 'password'}
        value={pwForm[field]}
        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder}
        style={{ ...inp, paddingRight: 40 }}
        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
        onBlur={e => e.target.style.borderColor = '#1c1c1c'}
      />
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
    <div style={{ flex: 1, overflowY: 'auto', background: 'transparent', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>

        {/* ── Profile header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid #1c1c1c' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarBg(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
            {ini(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.88)', margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '3px 0 0', textTransform: 'capitalize' }}>{user?.role}</p>
          </div>
        </div>

        {/* ── Profile ── */}
        <div style={card}>
          <p style={sectionTitle}>Profile</p>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Full name</label>
              <input name="name" value={profile.name} onChange={handleProfileChange} placeholder="Your name" required
                style={inp}
                onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
            </div>
            {user?.role === 'student' && (
              <>
                <div>
                  <label style={lbl}>Department</label>
                  <select name="department" value={profile.department} onChange={handleProfileChange}
                    style={{ ...inp, appearance: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                    onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Year</label>
                  <select name="year" value={profile.year} onChange={handleProfileChange}
                    style={{ ...inp, appearance: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
                    onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}
            <button type="submit" disabled={savingProfile || !profileEdited}
              style={{ padding: '10px', borderRadius: 10, background: profileEdited && !savingProfile ? '#7c3aed' : '#111111', border: '1px solid', borderColor: profileEdited && !savingProfile ? '#7c3aed' : '#1c1c1c', color: profileEdited && !savingProfile ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 500, cursor: profileEdited && !savingProfile ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* ── Account info ── */}
        <div style={card}>
          <p style={sectionTitle}>Account</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InfoRow label="Email" value={user?.email} />
            {user?.phone && <InfoRow label="Phone" value={user?.phone} />}
            {user?.roll_no && <InfoRow label="Roll No" value={user?.roll_no} />}
            {user?.department && <InfoRow label="Department" value={user?.department} />}
          </div>
        </div>

        {/* ── Change password ── */}
        <div style={card}>
          <p style={sectionTitle}>Change Password</p>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>Current password</label>
              <PwInput field="current" placeholder="Enter current password" />
            </div>
            <div>
              <label style={lbl}>New password</label>
              <PwInput field="next" placeholder="At least 6 characters" />
            </div>
            <div>
              <label style={lbl}>Confirm new password</label>
              <PwInput field="confirm" placeholder="Repeat new password" />
            </div>
            {pwError && (
              <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(239,68,68,0.8)', margin: 0 }}>{pwError}</p>
            )}
            <button type="submit" disabled={savingPw || !pwForm.current || !pwForm.next || !pwForm.confirm}
              style={{ padding: '10px', borderRadius: 10, background: pwForm.current && pwForm.next && pwForm.confirm ? '#7c3aed' : '#111111', border: '1px solid', borderColor: pwForm.current && pwForm.next && pwForm.confirm ? '#7c3aed' : '#1c1c1c', color: pwForm.current && pwForm.next && pwForm.confirm ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 500, cursor: pwForm.current && pwForm.next && pwForm.confirm ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
              {savingPw ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        {/* ── Appearance ── */}
        <div style={card}>
          <p style={sectionTitle}>Appearance</p>
          <Toggle
            on={dark}
            onToggle={toggleTheme}
            label="Dark mode"
            sub="Switch between dark and light theme"
          />
        </div>

        {/* ── Notifications ── */}
        <div style={card}>
          <p style={sectionTitle}>Notifications</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Toggle on={notifSound} onToggle={() => toggleNotif('notif_sound', !notifSound, setNotifSound)}
              label="Message sounds" sub="Play a sound for new messages" />
            <div style={divider}/>
            <Toggle on={notifBadge} onToggle={() => toggleNotif('notif_badge', !notifBadge, setNotifBadge)}
              label="Unread badges" sub="Show unread count indicators" />
            <div style={divider}/>
            <Toggle on={notifDesktop} onToggle={() => requestDesktopNotif(!notifDesktop)}
              label="Desktop notifications" sub="Browser push notifications for new messages" />
          </div>
        </div>

        {/* ── Sign out ── */}
        <div style={card}>
          <p style={sectionTitle}>Session</p>
          {confirmLogout ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Sign out of your account?</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={logout}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.9)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                  Yes, sign out
                </button>
                <button onClick={() => setConfirmLogout(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#111111', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 300, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmLogout(true)}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.6)', fontSize: 13, fontWeight: 400, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'rgba(239,68,68,0.9)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)'; }}>
              Sign out
            </button>
          )}
        </div>

        {/* ── App info ── */}
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.12)', margin: 0 }}>Studi+ · © 2026</p>
        </div>

      </div>
    </div>
  );
}
