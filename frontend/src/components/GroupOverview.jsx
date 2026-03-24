import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { announcementsAPI, duesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';

const formatDate = (d) =>
  new Date(d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const daysUntil = (dateStr) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dateStr);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

const dueBadge = (days) => {
  if (days < 0)  return { label: 'Overdue',          cls: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (days === 0) return { label: 'Due today',        cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  if (days <= 3) return { label: `${days}d left`,    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  return              { label: `${days}d left`,       cls: 'bg-gray-800 text-gray-400 border-gray-700' };
};

// ── Announcement form ──────────────────────────────────
function AnnouncementForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]       = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({ title: editing.title, content: editing.content });
      setOpen(true);
    } else {
      setForm({ title: '', content: '' });
      setOpen(false);
    }
  }, [editing]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = editing
        ? await announcementsAPI.update(groupId, editing.id, form)
        : await announcementsAPI.create(groupId, form);
      // For edits, update state immediately (no socket event for updates from self)
      // For creates, the socket 'new_announcement' event handles adding to the list
      if (editing) {
        onCreated(res.data);
      }
      setForm({ title: '', content: '' });
      setOpen(false);
      if (onCancel) onCancel();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setForm({ title: '', content: '' });
    if (onCancel) onCancel();
  };

  if (!open && !editing) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 border border-dashed border-gray-700 rounded-xl
        text-gray-500 hover:text-gray-300 hover:border-gray-500 text-sm transition">
      + New announcement
    </button>
  );

  return (
    <form onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <input
        className="form-input" placeholder="Announcement title" required
        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/>
      <textarea
        className="form-input resize-none" rows={3}
        placeholder="Write your announcement..."
        required value={form.content}
        onChange={e => setForm(p => ({ ...p, content: e.target.value }))}/>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
            text-white text-sm font-medium rounded-lg transition">
          {loading ? (editing ? 'Updating...' : 'Posting...') : (editing ? 'Update' : 'Post')}
        </button>
        <button type="button" onClick={handleCancel}
          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700
            text-gray-400 text-sm rounded-lg transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Due form ───────────────────────────────────────────
function DueForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]       = useState({ title: '', description: '', due_date: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description || '',
        due_date: editing.due_date
      });
      setOpen(true);
    } else {
      setForm({ title: '', description: '', due_date: '' });
      setOpen(false);
    }
  }, [editing]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = editing
        ? await duesAPI.update(groupId, editing.id, form)
        : await duesAPI.create(groupId, form);
      // For edits, update immediately; for creates, socket 'new_due' handles it
      if (editing) {
        onCreated(res.data);
      }
      setForm({ title: '', description: '', due_date: '' });
      setOpen(false);
      if (onCancel) onCancel();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setForm({ title: '', description: '', due_date: '' });
    if (onCancel) onCancel();
  };

  if (!open && !editing) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 border border-dashed border-gray-700 rounded-xl
        text-gray-500 hover:text-gray-300 hover:border-gray-500 text-sm transition">
      + Add due date
    </button>
  );

  return (
    <form onSubmit={handleSubmit}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <input
        className="form-input" placeholder="e.g. Assignment 3 submission" required
        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}/>
      <input
        className="form-input" placeholder="Description (optional)"
        value={form.description}
        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}/>
      <div>
        <label className="form-label">Due date</label>
        <input type="date" className="form-input" required
          value={form.due_date}
          onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}/>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
            text-white text-sm font-medium rounded-lg transition">
          {loading ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update' : 'Add')}
        </button>
        <button type="button" onClick={handleCancel}
          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700
            text-gray-400 text-sm rounded-lg transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────
export default function GroupOverview({ group }) {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isTeacher = myRole === 'admin' || myRole === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [dues, setDues]                   = useState([]);
  const [loadingA, setLoadingA]           = useState(true);
  const [loadingD, setLoadingD]           = useState(true);

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, id }
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingDue, setEditingDue] = useState(null);

  useEffect(() => {
    if (!group) return;

    setLoadingA(true);
    setLoadingD(true);

    announcementsAPI.list(group.id)
      .then(res => setAnnouncements(res.data))
      .catch(console.error)
      .finally(() => setLoadingA(false));

    duesAPI.list(group.id)
      .then(res => setDues(res.data))
      .catch(console.error)
      .finally(() => setLoadingD(false));

    if (socket) {
      socket.on('new_announcement', (a) => {
        setAnnouncements(prev => {
          if (prev.find(x => x.id === a.id)) return prev;
          return [a, ...prev];
        });
      });
      socket.on('update_announcement', (a) => {
        setAnnouncements(prev => prev.map(x => x.id === a.id ? a : x));
      });
      socket.on('new_due', (d) => {
        setDues(prev => {
          if (prev.find(x => x.id === d.id)) return prev;
          return [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        });
      });
      socket.on('update_due', (d) => {
        setDues(prev => prev.map(x => x.id === d.id ? d : x).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
      });
    }

    return () => {
      socket?.off('new_announcement');
      socket?.off('update_announcement');
      socket?.off('new_due');
      socket?.off('update_due');
    };
  }, [group?.id, socket]);

  const deleteAnnouncement = (id) => {
    setDeleteConfirm({ type: 'announcement', id });
  };

  const deleteDue = (id) => {
    setDeleteConfirm({ type: 'due', id });
  };

  const editAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
  };

  const editDue = (due) => {
    setEditingDue(due);
  };

  const handleAnnouncementUpdate = (updatedAnnouncement) => {
    setAnnouncements(prev => prev.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a));
    setEditingAnnouncement(null);
    addToast({ type: 'success', message: 'Announcement updated.' });
  };

  const handleDueUpdate = (updatedDue) => {
    setDues(prev => prev.map(d => d.id === updatedDue.id ? updatedDue : d).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    setEditingDue(null);
    addToast({ type: 'success', message: 'Due date updated.' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm || !group) return;
    const { type, id } = deleteConfirm;

    setDeleteConfirm(null);
    setConfirmingDelete(true);
    setDeleteError('');

    try {
      if (type === 'announcement') {
        await announcementsAPI.delete(group.id, id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        addToast({ type: 'success', message: 'Announcement deleted.' });
        return;
      }

      if (type === 'due') {
        await duesAPI.delete(group.id, id);
        setDues(prev => prev.filter(d => d.id !== id));
        addToast({ type: 'success', message: 'Due date deleted.' });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: err.response?.data?.error || 'Could not delete item' });
    } finally {
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">
        <ConfirmDialog
          open={!!deleteConfirm}
          danger={true}
          title={
            deleteConfirm?.type === 'announcement'
              ? 'Delete this announcement?'
              : 'Delete this due date?'
          }
          description="This action will remove it for everyone."
          confirmText="Delete"
          onCancel={() => {
            if (confirmingDelete) return;
            setDeleteConfirm(null);
          }}
          onConfirm={handleConfirmDelete}
          disabled={confirmingDelete}
        />

        {deleteError ? (
          <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            {deleteError}
          </div>
        ) : null}

        {/* Group header */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-xl font-semibold text-white">{group.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{group.subject}</p>
          {group.description && (
            <p className="text-gray-600 text-sm mt-2">{group.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className={`text-xs px-2.5 py-1 rounded-full border capitalize
              ${myRole === 'admin'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                : myRole === 'teacher'
                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              {myRole}
            </span>
            {isTeacher && (
              <span className="text-xs text-gray-600">
                Invite code:{' '}
                <span className="font-mono text-indigo-400">{group.invite_code}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Announcements ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Announcements
            </h2>
            <span className="text-xs text-gray-600">{announcements.length} total</span>
          </div>

          <div className="space-y-3">
            {isTeacher && (
              <AnnouncementForm
                groupId={group.id}
                onCreated={editingAnnouncement ? handleAnnouncementUpdate : (a => setAnnouncements(prev => [a, ...prev]))}
                editing={editingAnnouncement}
                onCancel={() => setEditingAnnouncement(null)}
              />
            )}

            {loadingA ? (
              [1,2].map(i => (
                <div key={i} className="h-24 bg-gray-900 rounded-xl animate-pulse"/>
              ))
            ) : announcements.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-gray-800 rounded-xl">
                <p className="text-gray-600 text-sm">No announcements yet</p>
              </div>
            ) : (
              announcements.map(a => (
                <div key={a.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4
                    hover:border-gray-700 transition group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.users?.name} · {formatDate(a.created_at)}
                      </p>
                    </div>
                    {(isTeacher || a.users?.id === user?.id) && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => editAnnouncement(a)}
                          className="text-gray-700 hover:text-blue-400 text-xs transition">
                          Edit
                        </button>
                        <button onClick={() => deleteAnnouncement(a.id)}
                          className="text-gray-700 hover:text-red-400 text-xs transition">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">
                    {a.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Upcoming dues ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              Upcoming dues
            </h2>
            <span className="text-xs text-gray-600">{dues.length} total</span>
          </div>

          <div className="space-y-3">
            {isTeacher && (
              <DueForm
                groupId={group.id}
                onCreated={editingDue ? handleDueUpdate : (d =>
                  setDues(prev =>
                    [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                  )
                )}
                editing={editingDue}
                onCancel={() => setEditingDue(null)}
              />
            )}

            {loadingD ? (
              [1,2].map(i => (
                <div key={i} className="h-16 bg-gray-900 rounded-xl animate-pulse"/>
              ))
            ) : dues.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-gray-800 rounded-xl">
                <p className="text-gray-600 text-sm">No upcoming dues</p>
              </div>
            ) : (
              dues.map(d => {
                const days  = daysUntil(d.due_date);
                const badge = dueBadge(days);
                return (
                  <div key={d.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3
                      hover:border-gray-700 transition group flex items-center gap-4">
                    {/* Date block */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <p className="text-lg font-semibold text-white leading-none">
                        {new Date(d.due_date).getDate()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 uppercase">
                        {new Date(d.due_date).toLocaleDateString([], { month: 'short' })}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-gray-800 flex-shrink-0"/>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{d.title}</p>
                      {d.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{d.description}</p>
                      )}
                    </div>

                    {/* Badge + actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {(isTeacher || d.users?.id === user?.id) && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => editDue(d)}
                            className="text-gray-700 hover:text-blue-400 text-xs transition">
                            Edit
                          </button>
                          <button onClick={() => deleteDue(d.id)}
                            className="text-gray-700 hover:text-red-400 text-xs transition">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}