import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-white">{value || <span className="text-gray-600 italic">Not set</span>}</p>
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
      // Keep auth context in sync
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">
            {isOwnProfile ? 'My Profile' : 'Profile'}
          </h2>
          <button onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition text-lg leading-none">×</button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : editing ? (
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                  text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                placeholder="Your name"
                required
              />
            </div>
            {profile?.role === 'student' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Department</label>
                  <input
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                      text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Year</label>
                  <select
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2
                      text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
                  text-white text-sm font-medium py-2 rounded-lg transition">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm
                  font-medium py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-indigo-600/20 border border-indigo-500/30
                flex items-center justify-center text-indigo-300 text-lg font-semibold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-white font-semibold">{profile?.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border
                  ${profile?.role === 'teacher'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                  {profile?.role}
                </span>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3 bg-gray-800/50 rounded-xl p-4">
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
                className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-gray-300
                  text-sm font-medium py-2 rounded-lg transition">
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
