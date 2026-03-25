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

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider dark:text-gray-400 text-gray-500">{title}</h3>
      {children}
    </div>
  );
}

export default function SettingsPanel({ onClose }) {
  const { user, logout, login, token } = useAuth();
  const { dark, toggle } = useTheme();
  const { addToast } = useToast();

  const [form, setForm]     = useState({ name: user?.name || '', department: user?.department || '', year: user?.year || '' });
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setEdited(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await profileAPI.update(form);
      login(token, { ...user, ...res.data });
      setEdited(false);
      addToast({ type: 'success', message: 'Profile saved.' });
    } catch {
      addToast({ type: 'error', message: 'Failed to save profile.' });
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="flex-1 overflow-y-auto dark:bg-surface bg-gray-50">
      <div className="max-w-lg mx-auto px-5 py-8 space-y-5">

        {/* Avatar + name header */}
        <div className="flex items-center gap-4 pb-2">
          <div className="w-14 h-14 rounded-full bg-brand-600/20 border border-brand-500/30
            flex items-center justify-center text-brand-300 text-lg font-semibold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="dark:text-white text-gray-900 font-semibold">{user?.name}</p>
            <span className="text-xs dark:text-gray-500 text-gray-500 capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm dark:text-white text-gray-900">Dark mode</p>
              <p className="text-xs dark:text-gray-500 text-gray-400 mt-0.5">Switch between light and dark theme</p>
            </div>
            <button onClick={toggle}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${dark ? 'bg-brand-600' : 'bg-gray-300 dark:bg-surface-4'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-5' : ''}`}/>
            </button>
          </div>
        </Section>

        {/* Edit profile */}
        <Section title="Profile">
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="form-label">Full name</label>
              <input name="name" className="form-input" value={form.name}
                onChange={handleChange} placeholder="Your name" required />
            </div>

            {user?.role === 'student' && (
              <>
                <div>
                  <label className="form-label">Department</label>
                  <select name="department" className="form-input" value={form.department} onChange={handleChange}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <select name="year" className="form-input" value={form.year} onChange={handleChange}>
                    <option value="">Select year</option>
                    {[1,2,3,4].map(y => (
                      <option key={y} value={y}>{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button type="submit" disabled={saving || !edited}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Section>

        {/* Account */}
        <Section title="Account">
          <div className="space-y-1">
            {user?.email && (
              <div className="flex items-center justify-between py-1">
                <span className="text-xs dark:text-gray-500 text-gray-500">Email</span>
                <span className="text-sm dark:text-gray-300 text-gray-700">{user.email}</span>
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center justify-between py-1">
                <span className="text-xs dark:text-gray-500 text-gray-500">Phone</span>
                <span className="text-sm dark:text-gray-300 text-gray-700">{user.phone}</span>
              </div>
            )}
          </div>
          <button onClick={logout}
            className="w-full py-2.5 rounded-xl text-sm font-medium border transition
              border-red-500/30 text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10">
            Sign out
          </button>
        </Section>

      </div>
    </div>
  );
}
