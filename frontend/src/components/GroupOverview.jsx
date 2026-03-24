import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { announcementsAPI, duesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';

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
  const [form, setForm]       = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (editing) { setForm({ title: editing.title, content: editing.content }); setOpen(true); }
    else { setForm({ title: '', content: '' }); setOpen(false); }
  }, [editing]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = editing
        ? await announcementsAPI.update(groupId, editing.id, form)
        : await announcementsAPI.create(groupId, form);
      if (editing) onCreated(res.data);
      setForm({ title: '', content: '' });
      setOpen(false);
      if (onCancel) onCancel();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancel = () => { setOpen(false); setForm({ title: '', content: '' }); if (onCancel) onCancel(); };

  if (!open && !editing) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 border border-dashed dark:border-brand-900/50 border-gray-300 rounded-xl dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 dark:hover:border-brand-700/50 hover:border-gray-400 text-sm transition">
      + New announcement
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <input className="form-input" placeholder="Announcement title" required
        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/>
      <textarea className="form-input resize-none" rows={3} placeholder="Write your announcement..."
        required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}/>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
          {loading ? (editing ? 'Updating...' : 'Posting...') : (editing ? 'Update' : 'Post')}
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
  const [dues, setDues]                   = useState([]);
  const [loadingA, setLoadingA]           = useState(true);
  const [loadingD, setLoadingD]           = useState(true);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingDue, setEditingDue]               = useState(null);

  useEffect(() => {
    if (!group) return;
    setLoadingA(true); setLoadingD(true);
    announcementsAPI.list(group.id).then(res => setAnnouncements(res.data)).catch(console.error).finally(() => setLoadingA(false));
    duesAPI.list(group.id).then(res => setDues(res.data)).catch(console.error).finally(() => setLoadingD(false));

    if (socket) {
      socket.on('new_announcement', (a) => setAnnouncements(prev => prev.find(x => x.id === a.id) ? prev : [a, ...prev]));
      socket.on('update_announcement', (a) => setAnnouncements(prev => prev.map(x => x.id === a.id ? a : x)));
      socket.on('new_due', (d) => setDues(prev => prev.find(x => x.id === d.id) ? prev : [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))));
      socket.on('update_due', (d) => setDues(prev => prev.map(x => x.id === d.id ? d : x).sort((a, b) => new Date(a.due_date) - new Date(b.due_date))));
    }
    return () => { socket?.off('new_announcement'); socket?.off('update_announcement'); socket?.off('new_due'); socket?.off('update_due'); };
  }, [group?.id, socket]);

  const handleAnnouncementUpdate = (updated) => {
    setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
    setEditingAnnouncement(null);
    addToast({ type: 'success', message: 'Announcement updated.' });
  };

  const handleDueUpdate = (updated) => {
    setDues(prev => prev.map(d => d.id === updated.id ? updated : d).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    setEditingDue(null);
    addToast({ type: 'success', message: 'Due date updated.' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm || !group) return;
    const { type, id } = deleteConfirm;
    setDeleteConfirm(null); setConfirmingDelete(true);
    try {
      if (type === 'announcement') {
        await announcementsAPI.delete(group.id, id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
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
                onCreated={editingAnnouncement ? handleAnnouncementUpdate : (a => setAnnouncements(prev => [a, ...prev]))}
                editing={editingAnnouncement} onCancel={() => setEditingAnnouncement(null)}/>
            )}
            {loadingA ? [1,2].map(i => <div key={i} className="h-24 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>) :
              announcements.length === 0 ? (
                <div className="py-10 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                  <p className="dark:text-gray-600 text-gray-400 text-sm">No announcements yet</p>
                </div>
              ) : announcements.map(a => (
                <div key={a.id} className="card-hover p-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
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
                </div>
              ))
            }
          </div>
        </section>

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
