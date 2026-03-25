import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { announcementsAPI, duesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';

// ── Announcement tag config ────────────────────────────
const TagIcon = ({ type }) => {
  const icons = {
    general:    <path d="M13.5 3a.5.5 0 0 1 .5.5V11H2V3.5a.5.5 0 0 1 .5-.5h11zm-11-1A1.5 1.5 0 0 0 1 3.5V12h14V3.5A1.5 1.5 0 0 0 13.5 2h-11zm-2 13a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5zM3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z"/>,
    urgent:     <><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></>,
    exam:       <><path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6v7zm6.5-3.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1zm-2-1a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm2-1h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1zm-2 3a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm2 0h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1z"/></>,
    assignment: <><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/><path d="M4.5 8a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 2a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0-4a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3z"/></>,
    event:      <><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/><path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></>,
  };
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
      {icons[type] || icons.general}
    </svg>
  );
};

export const ANNOUNCEMENT_TAGS = {
  general:    { label: 'General',    border: 'border-l-gray-400',   badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  urgent:     { label: 'Urgent',     border: 'border-l-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  exam:       { label: 'Exam',       border: 'border-l-purple-500', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  assignment: { label: 'Assignment', border: 'border-l-amber-500',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  event:      { label: 'Event',      border: 'border-l-teal-500',   badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
};

const formatDate = (d) => {
  const dt = new Date(d);
  const hasTime = dt.getUTCHours() !== 0 || dt.getUTCMinutes() !== 0;
  if (hasTime) {
    return dt.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      + ' · ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return dt.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const daysUntil = (dateStr) => {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (diffMs < 0) return -1;
  if (diffMs < 24 * 60 * 60 * 1000) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const dueBadge = (days) => {
  if (days < 0)   return { label: 'Overdue',      cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (days === 0) return { label: 'Due today',     cls: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20' };
  if (days <= 3)  return { label: `${days}d left`, cls: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20' };
  return               { label: `${days}d left`,   cls: 'dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-surface-4 border-gray-200' };
};

function AnnouncementForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]         = useState({ title: '', content: '', tag: 'general' });
  const [scheduled, setScheduled] = useState(false);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ title: editing.title, content: editing.content, tag: editing.tag || 'general' });
      if (editing.scheduled_at && !editing.published) {
        const d = new Date(editing.scheduled_at);
        setScheduled(true);
        setSchedDate(d.toLocaleDateString('en-CA'));
        setSchedTime(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
      } else {
        setScheduled(false); setSchedDate(''); setSchedTime('');
      }
      setOpen(true);
    } else {
      setForm({ title: '', content: '', tag: 'general' });
      setScheduled(false); setSchedDate(''); setSchedTime('');
      setOpen(false);
    }
  }, [editing]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (scheduled && schedDate) {
        payload.scheduled_at = new Date(`${schedDate}T${schedTime || '09:00'}`).toISOString();
      }
      const res = editing
        ? await announcementsAPI.update(groupId, editing.id, payload)
        : await announcementsAPI.create(groupId, payload);
      onCreated(res.data);
      setForm({ title: '', content: '', tag: 'general' });
      setScheduled(false); setSchedDate(''); setSchedTime('');
      setOpen(false);
      if (onCancel) onCancel();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancel = () => {
    setOpen(false);
    setForm({ title: '', content: '', tag: 'general' });
    setScheduled(false); setSchedDate(''); setSchedTime('');
    if (onCancel) onCancel();
  };

  // Min datetime = now + 1 min
  const minDate = new Date(Date.now() + 60_000).toLocaleDateString('en-CA');

  if (!open && !editing) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 border border-dashed dark:border-brand-900/50 border-gray-300 rounded-xl dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 dark:hover:border-brand-700/50 hover:border-gray-400 text-sm transition">
      + New announcement
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      {/* Tag picker */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ANNOUNCEMENT_TAGS).map(([key, t]) => (
          <button key={key} type="button"
            onClick={() => setForm(p => ({ ...p, tag: key }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition
              ${form.tag === key ? t.badge + ' font-medium' : 'dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-200 dark:text-gray-400 text-gray-500 dark:hover:bg-surface-4 hover:bg-gray-200'}`}>
            <TagIcon type={key} />{t.label}
          </button>
        ))}
      </div>

      <input className="form-input" placeholder="Announcement title" required
        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/>
      <textarea className="form-input resize-none" rows={3} placeholder="Write your announcement..."
        required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}/>

      {/* Schedule toggle */}
      <div className="flex items-center gap-2.5 pt-1">
        <button type="button" onClick={() => setScheduled(v => !v)}
          className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${scheduled ? 'bg-brand-600' : 'dark:bg-surface-4 bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${scheduled ? 'translate-x-4' : ''}`}/>
        </button>
        <span className="text-xs dark:text-gray-400 text-gray-500">Schedule for later</span>
      </div>

      {scheduled && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" required min={minDate}
              value={schedDate} onChange={e => setSchedDate(e.target.value)}/>
          </div>
          <div className="flex-1">
            <label className="form-label">Time</label>
            <input type="time" className="form-input"
              value={schedTime} onChange={e => setSchedTime(e.target.value)}/>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
          {loading
            ? (editing ? 'Saving...' : 'Saving...')
            : scheduled
              ? (editing ? 'Reschedule' : 'Schedule')
              : (editing ? 'Update' : 'Post now')}
        </button>
        <button type="button" onClick={handleCancel}
          className="flex-1 py-2 dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-400 text-gray-600 text-sm rounded-xl transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

function DueForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]       = useState({ title: '', description: '', due_date: '', due_time: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (editing) {
      const dt = new Date(editing.due_date);
      const localDate = dt.toLocaleDateString('en-CA');
      const localTime = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      setForm({ title: editing.title, description: editing.description || '', due_date: localDate, due_time: localTime === '00:00' ? '' : localTime });
      setOpen(true);
    } else { setForm({ title: '', description: '', due_date: '', due_time: '' }); setOpen(false); }
  }, [editing]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const timeStr = form.due_time || '23:59';
      const isoDatetime = new Date(`${form.due_date}T${timeStr}`).toISOString();
      const payload = { title: form.title, description: form.description, due_date: isoDatetime };
      const res = editing ? await duesAPI.update(groupId, editing.id, payload) : await duesAPI.create(groupId, payload);
      if (editing) onCreated(res.data);
      setForm({ title: '', description: '', due_date: '', due_time: '' });
      setOpen(false);
      if (onCancel) onCancel();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancel = () => { setOpen(false); setForm({ title: '', description: '', due_date: '', due_time: '' }); if (onCancel) onCancel(); };

  if (!open && !editing) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 border border-dashed dark:border-brand-900/50 border-gray-300 rounded-xl dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 dark:hover:border-brand-700/50 hover:border-gray-400 text-sm transition">
      + Add due date
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <input className="form-input" placeholder="e.g. Assignment 3 submission" required
        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/>
      <input className="form-input" placeholder="Description (optional)"
        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="form-label">Due date</label>
          <input type="date" className="form-input" required value={form.due_date}
            onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}/>
        </div>
        <div className="flex-1">
          <label className="form-label">Time <span className="dark:text-gray-600 text-gray-400">(optional)</span></label>
          <input type="time" className="form-input" value={form.due_time}
            onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))}/>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
          {loading ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update' : 'Add')}
        </button>
        <button type="button" onClick={handleCancel}
          className="flex-1 py-2 dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-400 text-gray-600 text-sm rounded-xl transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function GroupOverview({ group }) {
  const { user }     = useAuth();
  const { socket }   = useSocket();
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isTeacher = myRole === 'admin' || myRole === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [scheduled, setScheduled]         = useState([]);
  const [dues, setDues]                   = useState([]);
  const [loadingA, setLoadingA]           = useState(true);
  const [loadingD, setLoadingD]           = useState(true);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingDue, setEditingDue]               = useState(null);

  useEffect(() => {
    if (!group || !socket) return;
    setLoadingA(true); setLoadingD(true);
    announcementsAPI.list(group.id).then(res => setAnnouncements(res.data)).catch(console.error).finally(() => setLoadingA(false));
    if (isTeacher) announcementsAPI.scheduled(group.id).then(res => setScheduled(res.data)).catch(console.error);
    duesAPI.list(group.id).then(res => setDues(res.data)).catch(console.error).finally(() => setLoadingD(false));

    // Ensure we're in the socket room (ChatPanel may not be mounted)
    socket.emit('join_group', group.id);

    const onNewAnnouncement   = (a) => setAnnouncements(prev => prev.find(x => x.id === a.id) ? prev : [a, ...prev]);
    const onUpdateAnnouncement = (a) => setAnnouncements(prev => prev.map(x => x.id === a.id ? a : x));
    const onReaction = ({ announcementId, reactions }) =>
      setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, announcement_reactions: reactions } : a));
    const onNewDue    = (d) => setDues(prev => prev.find(x => x.id === d.id) ? prev : [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    const onUpdateDue = (d) => setDues(prev => prev.map(x => x.id === d.id ? d : x).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));

    socket.on('new_announcement',    onNewAnnouncement);
    socket.on('update_announcement', onUpdateAnnouncement);
    socket.on('announcement_reaction', onReaction);
    socket.on('new_due',    onNewDue);
    socket.on('update_due', onUpdateDue);

    return () => {
      socket.off('new_announcement',    onNewAnnouncement);
      socket.off('update_announcement', onUpdateAnnouncement);
      socket.off('announcement_reaction', onReaction);
      socket.off('new_due',    onNewDue);
      socket.off('update_due', onUpdateDue);
    };
  }, [group?.id, socket]);

  const handleAnnouncementUpdate = (updated) => {
    if (updated.published) {
      setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
      setScheduled(prev => prev.filter(a => a.id !== updated.id));
    } else {
      setScheduled(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
    setEditingAnnouncement(null);
    addToast({ type: 'success', message: 'Announcement updated.' });
  };

  const handleDueUpdate = (updated) => {
    setDues(prev => prev.map(d => d.id === updated.id ? updated : d).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    setEditingDue(null);
    addToast({ type: 'success', message: 'Due date updated.' });
  };

  const handleReact = async (announcementId, emoji) => {
    try {
      await announcementsAPI.react(group.id, announcementId, emoji);
      // socket event updates state
    } catch (err) { console.error(err); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm || !group) return;
    const { type, id } = deleteConfirm;
    setDeleteConfirm(null); setConfirmingDelete(true);
    try {
      if (type === 'announcement') {
        await announcementsAPI.delete(group.id, id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        setScheduled(prev => prev.filter(a => a.id !== id));
        addToast({ type: 'success', message: 'Announcement deleted.' });
      } else {
        await duesAPI.delete(group.id, id);
        setDues(prev => prev.filter(d => d.id !== id));
        addToast({ type: 'success', message: 'Due date deleted.' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Could not delete item' });
    } finally { setConfirmingDelete(false); }
  };

  const roleColor = myRole === 'admin'
    ? 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20'
    : myRole === 'teacher'
      ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20'
      : 'dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-surface-4 border-gray-200';

  return (
    <div className="flex-1 overflow-y-auto dark:bg-surface bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        <ConfirmDialog
          open={!!deleteConfirm} danger={true}
          title={deleteConfirm?.type === 'announcement' ? 'Delete this announcement?' : 'Delete this due date?'}
          description="This action will remove it for everyone."
          confirmText="Delete"
          onCancel={() => { if (!confirmingDelete) setDeleteConfirm(null); }}
          onConfirm={handleConfirmDelete} disabled={confirmingDelete}
        />

        {/* Group header */}
        <div className="border-b dark:border-brand-900/40 border-gray-200 pb-6">
          <h1 className="text-xl font-semibold dark:text-white text-gray-900">{group.name}</h1>
          <p className="dark:text-gray-500 text-gray-500 text-sm mt-1">{group.subject}</p>
          {group.description && <p className="dark:text-gray-600 text-gray-400 text-sm mt-2">{group.description}</p>}
          <div className="flex items-center gap-3 mt-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${roleColor}`}>{myRole}</span>
            {isTeacher && (
              <span className="text-xs dark:text-gray-600 text-gray-400">
                Invite code: <span className="font-mono text-brand-500">{group.invite_code}</span>
              </span>
            )}
          </div>
        </div>

        {/* Announcements */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold dark:text-white text-gray-900 uppercase tracking-wider">Announcements</h2>
            <span className="text-xs dark:text-gray-600 text-gray-400">{announcements.length} total</span>
          </div>
          <div className="space-y-3">
            {isTeacher && (
              <AnnouncementForm groupId={group.id}
                onCreated={editingAnnouncement
                  ? handleAnnouncementUpdate
                  : (a => {
                      if (a.published) setAnnouncements(prev => [a, ...prev]);
                      else setScheduled(prev => [...prev, a].sort((x, y) => new Date(x.scheduled_at) - new Date(y.scheduled_at)));
                    })
                }
                editing={editingAnnouncement} onCancel={() => setEditingAnnouncement(null)}/>
            )}
            {loadingA ? [1,2].map(i => <div key={i} className="h-24 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>) :
              announcements.length === 0 ? (
                <div className="py-10 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                  <p className="dark:text-gray-600 text-gray-400 text-sm">No announcements yet</p>
                </div>
              ) : announcements.map(a => (
                <div key={a.id} className={`card-hover p-4 group border-l-4 ${(ANNOUNCEMENT_TAGS[a.tag] || ANNOUNCEMENT_TAGS.general).border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {(() => { const t = ANNOUNCEMENT_TAGS[a.tag] || ANNOUNCEMENT_TAGS.general; return (
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${t.badge}`}>
                            <TagIcon type={a.tag || 'general'} />{t.label}
                          </span>
                        ); })()}
                      </div>
                      <p className="text-sm font-medium dark:text-white text-gray-900">{a.title}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{a.users?.name} · {formatDate(a.created_at)}</p>
                    </div>
                    {(isTeacher || a.users?.id === user?.id) && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => setEditingAnnouncement(a)} className="dark:text-gray-600 text-gray-400 hover:text-brand-400 text-xs transition">Edit</button>
                        <button onClick={() => setDeleteConfirm({ type: 'announcement', id: a.id })} className="dark:text-gray-600 text-gray-400 hover:text-red-400 text-xs transition">Delete</button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm dark:text-gray-300 text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">{a.content}</p>

                  {/* Reactions */}
                  {(() => {
                    const reactionMap = {};
                    (a.announcement_reactions || []).forEach(r => {
                      if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
                      reactionMap[r.emoji].push(r.user_id);
                    });
                    const EMOJIS = ['👍', '❤️', '😮', '🙏', '🔥'];
                    return (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {/* Existing reactions */}
                        {Object.entries(reactionMap).map(([emoji, userIds]) => (
                          <button key={emoji} onClick={() => handleReact(a.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition
                              ${userIds.includes(user?.id)
                                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                                : 'dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-200 dark:text-gray-400 text-gray-600 dark:hover:border-surface-4 hover:border-gray-300'}`}>
                            <span>{emoji}</span><span>{userIds.length}</span>
                          </button>
                        ))}
                        {/* Add reaction picker — visible on hover */}
                        <div className="relative group/react opacity-0 group-hover:opacity-100 transition">
                          <button className="flex items-center justify-center w-6 h-6 rounded-full dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-200 border dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 transition text-xs">
                            +
                          </button>
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover/react:flex
                            dark:bg-gray-900 bg-white border dark:border-gray-700 border-gray-200
                            rounded-xl shadow-xl px-2 py-1.5 gap-1 z-10">
                            {EMOJIS.map(e => (
                              <button key={e} onClick={() => handleReact(a.id, e)}
                                className="text-base hover:scale-125 transition-transform leading-none p-0.5">
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))
            }
          </div>
        </section>

        {/* Scheduled announcements — teachers only */}
        {isTeacher && scheduled.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold dark:text-white text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="text-brand-400">
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                </svg>
                Scheduled
              </h2>
              <span className="text-xs dark:text-gray-600 text-gray-400">{scheduled.length} pending</span>
            </div>
            <div className="space-y-3">
              {scheduled.map(a => {
                const tag = ANNOUNCEMENT_TAGS[a.tag] || ANNOUNCEMENT_TAGS.general;
                const sendAt = new Date(a.scheduled_at);
                return (
                  <div key={a.id} className={`card p-4 group border-l-4 ${tag.border} opacity-80`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${tag.badge}`}>
                            <TagIcon type={a.tag || 'general'} />{tag.label}
                          </span>
                          <span className="text-xs dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-surface-4 border-gray-200 border px-2 py-0.5 rounded-full flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                            </svg>
                            {sendAt.toLocaleDateString([], { day: 'numeric', month: 'short' })} at {sendAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium dark:text-white text-gray-900">{a.title}</p>
                        <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{a.users?.name}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => setEditingAnnouncement(a)} className="dark:text-gray-600 text-gray-400 hover:text-brand-400 text-xs transition">Edit</button>
                        <button onClick={() => setDeleteConfirm({ type: 'announcement', id: a.id })} className="dark:text-gray-600 text-gray-400 hover:text-red-400 text-xs transition">Delete</button>
                      </div>
                    </div>
                    <p className="text-sm dark:text-gray-400 text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap line-clamp-2">{a.content}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming dues */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold dark:text-white text-gray-900 uppercase tracking-wider">Upcoming dues</h2>
            <span className="text-xs dark:text-gray-600 text-gray-400">{dues.length} total</span>
          </div>
          <div className="space-y-3">
            {isTeacher && (
              <DueForm groupId={group.id}
                onCreated={editingDue ? handleDueUpdate : (d => setDues(prev => [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))))}
                editing={editingDue} onCancel={() => setEditingDue(null)}/>
            )}
            {loadingD ? [1,2].map(i => <div key={i} className="h-16 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>) :
              dues.length === 0 ? (
                <div className="py-10 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                  <p className="dark:text-gray-600 text-gray-400 text-sm">No upcoming dues</p>
                </div>
              ) : dues.map(d => {
                const days = daysUntil(d.due_date);
                const badge = dueBadge(days);
                return (
                  <div key={d.id} className="card-hover px-4 py-3 group flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-lg font-semibold dark:text-white text-gray-900 leading-none">{new Date(d.due_date).getDate()}</p>
                      <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5 uppercase">{new Date(d.due_date).toLocaleDateString([], { month: 'short' })}</p>
                      {(() => { const dt = new Date(d.due_date); const hasTime = dt.getUTCHours() !== 0 || dt.getUTCMinutes() !== 0; return hasTime ? <p className="text-xs dark:text-gray-600 text-gray-400 mt-0.5">{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> : null; })()}
                    </div>
                    <div className="w-px h-8 dark:bg-surface-4 bg-gray-200 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white text-gray-900 truncate">{d.title}</p>
                      {d.description && <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5 truncate">{d.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
                      {(isTeacher || d.users?.id === user?.id) && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setEditingDue(d)} className="dark:text-gray-600 text-gray-400 hover:text-brand-400 text-xs transition">Edit</button>
                          <button onClick={() => setDeleteConfirm({ type: 'due', id: d.id })} className="dark:text-gray-600 text-gray-400 hover:text-red-400 text-xs transition">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </section>
      </div>
    </div>
  );
}
