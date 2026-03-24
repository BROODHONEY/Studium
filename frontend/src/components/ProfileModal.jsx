import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs dark:text-gray-500 text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm dark:text-white text-gray-900">
        {value || <span className="dark:text-gray-600 text-gray-400 italic">Not set</span>}
      </p>
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
        setForm({
          name:       res.data.name       || '',
          department: res.data.department || '',
          year:       res.data.year       || '',
        });
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
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const roleColor = profile?.role === 'teacher'
    ? 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20'
    : 'bg-brand-500/10 text-brand-400 border-brand-500/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="card w-full max-w-sm mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-brand-900/40 border-gray-200">
          <h2 className="text-sm font-semibold dark:text-white text-gray-900">
            {isOwnProfile ? 'My Profile' : 'Profile'}
          </h2>
          <button onClick={onClose}
            className="dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 transition text-lg leading-none">×</button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : editing ? (
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div>
              <label className="form-label">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="form-input"
                placeholder="Your name"
                required
              />
            </div>
            {profile?.role === 'student' && (
              <>
                <div>
                  <label className="form-label">Department</label>
                  <input
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="form-input"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <select
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="form-input">
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="flex-1 btn-primary py-2">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-xl transition">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-brand-600/20 border border-brand-500/30
                flex items-center justify-center text-brand-300 text-lg font-semibold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="dark:text-white text-gray-900 font-semibold">{profile?.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${roleColor}`}>
                  {profile?.role}
                </span>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3 dark:bg-surface-3/50 bg-gray-50 rounded-xl p-4">
              {profile?.role === 'student' && (
                <Field label="Roll No / ID" value={profile?.roll_no} />
              )}
              <Field label="Department" value={profile?.department} />
              {profile?.role === 'student' && (
                <Field label="Year" value={profile?.year} />
              )}
              <Field label="Email" value={profile?.email} />
            </div>

            {isOwnProfile && (
              <button onClick={() => setEditing(true)}
                className="mt-4 w-full dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-300 text-gray-700 text-sm font-medium py-2 rounded-xl transition">
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
