import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { duesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';
import { toISTDateInput, toISTTimeInput } from '../utils/time';

const daysUntil = (dateStr) => {
  const diffMs = new Date(dateStr).getTime() - Date.now();
  if (diffMs < 0) return -1;
  if (diffMs < 24 * 60 * 60 * 1000) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const dueBadge = (days) => {
  if (days < 0)   return { label: 'Overdue',      cls: 'text-red-400 border-red-500/20 bg-red-500/8' };
  if (days === 0) return { label: 'Due today',     cls: 'text-amber-400 border-amber-500/20 bg-amber-500/8' };
  if (days <= 3)  return { label: `${days}d left`, cls: 'text-amber-400 border-amber-500/20 bg-amber-500/8' };
  return               { label: `${days}d left`,   cls: 'text-white/30 border-white/10 bg-white/5' };
};

function DueForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]       = useState({ title: '', description: '', due_date: '', due_time: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description || '',
        due_date: toISTDateInput(editing.due_date),
        due_time: (() => { const t = toISTTimeInput(editing.due_date); return t === '00:00' ? '' : t; })(),
      });
      setOpen(true);
    } else {
      setForm({ title: '', description: '', due_date: '', due_time: '' });
      setOpen(false);
    }
  }, [editing]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const timeStr = form.due_time || '23:59';
      const isoDatetime = new Date(`${form.due_date}T${timeStr}`).toISOString();
      const payload = { title: form.title, description: form.description, due_date: isoDatetime };
      const res = editing
        ? await duesAPI.update(groupId, editing.id, payload)
        : await duesAPI.create(groupId, payload);
      onCreated(res.data);
      setForm({ title: '', description: '', due_date: '', due_time: '' });
      setOpen(false);
      if (onCancel) onCancel();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancel = () => {
    setOpen(false);
    setForm({ title: '', description: '', due_date: '', due_time: '' });
    if (onCancel) onCancel();
  };

  if (!open && !editing) return (
    <button onClick={() => setOpen(true)}
      style={{ width: '100%', padding: '10px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 300, background: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
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

export default function DuesPanel({ group }) {
  const { user }     = useAuth();
  const { socket }   = useSocket();
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isTeacher = myRole === 'admin' || myRole === 'teacher';

  const [dues, setDues]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingDue, setEditingDue]           = useState(null);
  const [deleteConfirm, setDeleteConfirm]     = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!group || !socket) return;
    setLoading(true);
    duesAPI.list(group.id)
      .then(res => setDues(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    socket.emit('join_group', group.id);

    const onNewDue    = (d) => setDues(prev => prev.find(x => x.id === d.id) ? prev : [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    const onUpdateDue = (d) => setDues(prev => prev.map(x => x.id === d.id ? d : x).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));

    socket.on('new_due',    onNewDue);
    socket.on('update_due', onUpdateDue);

    return () => {
      socket.off('new_due',    onNewDue);
      socket.off('update_due', onUpdateDue);
    };
  }, [group?.id, socket]);

  const handleDueUpdate = (updated) => {
    setDues(prev => prev.map(d => d.id === updated.id ? updated : d).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    setEditingDue(null);
    addToast({ type: 'success', message: 'Due date updated.' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteConfirm(null); setConfirmingDelete(true);
    try {
      await duesAPI.delete(group.id, deleteConfirm);
      setDues(prev => prev.filter(d => d.id !== deleteConfirm));
      addToast({ type: 'success', message: 'Due date deleted.' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Could not delete' });
    } finally { setConfirmingDelete(false); }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'transparent' }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <ConfirmDialog
          open={!!deleteConfirm} danger
          title="Delete this due date?"
          description="This will remove it for everyone."
          confirmText="Delete"
          onCancel={() => { if (!confirmingDelete) setDeleteConfirm(null); }}
          onConfirm={handleConfirmDelete}
          disabled={confirmingDelete}
        />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold dark:text-white text-gray-900 uppercase tracking-wider">Upcoming dues</h2>
          <span className="text-xs dark:text-gray-600 text-gray-400">{dues.length} total</span>
        </div>

        <div className="space-y-3">
          {isTeacher && (
            <DueForm groupId={group.id}
              onCreated={editingDue
                ? handleDueUpdate
                : (d => setDues(prev => [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))))}
              editing={editingDue} onCancel={() => setEditingDue(null)}/>
          )}

          {loading
            ? [1, 2, 3].map(i => <div key={i} className="h-16 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>)
            : dues.length === 0
              ? (
                <div className="py-16 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                  <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" className="mx-auto mb-3 dark:text-gray-700 text-gray-300">
                    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                  </svg>
                  <p className="dark:text-gray-600 text-gray-400 text-sm">No upcoming dues</p>
                </div>
              )
              : dues.map(d => {
                  const days  = daysUntil(d.due_date);
                  const badge = dueBadge(days);
                  const dt    = new Date(d.due_date);
                  const istTime = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
                  const hasTime = istTime !== '00:00';
                  return (
                    <div key={d.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 10, border: '1px solid #1c1c1c', background: '#080808', transition: 'border-color 0.15s', cursor: 'default' }}
                      className="group"
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#1c1c1c'}>
                      {/* Date block */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-lg font-semibold dark:text-white text-gray-900 leading-none">
                          {dt.toLocaleString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' })}
                        </p>
                        <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5 uppercase">
                          {dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Asia/Kolkata' })}
                        </p>
                        {hasTime && (
                          <p className="text-xs dark:text-gray-600 text-gray-400 mt-0.5">
                            {dt.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                          </p>
                        )}
                      </div>

                      <div style={{ width: 1, height: 32, background: '#1c1c1c', flexShrink: 0 }}/>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-white text-gray-900 truncate">{d.title}</p>
                        {d.description && <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5 truncate">{d.description}</p>}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${badge.cls}`}>{badge.label}</span>
                        {(isTeacher || d.users?.id === user?.id) && (
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => setEditingDue(d)}
                              className="dark:text-gray-600 text-gray-400 hover:text-brand-400 text-xs transition px-1 py-0.5">Edit</button>
                            <button onClick={() => setDeleteConfirm(d.id)}
                              className="dark:text-gray-600 text-gray-400 hover:text-red-400 text-xs transition px-1 py-0.5">Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
          }
        </div>
      </div>
    </div>
  );
}
