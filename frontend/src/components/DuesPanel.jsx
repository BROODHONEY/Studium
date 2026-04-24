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
  if (days < 0)   return { label: 'Overdue',      cls: 'text-[#E07B20] border-[rgba(189,95,0,0.30)] bg-[rgba(189,95,0,0.12)]' };
  if (days === 0) return { label: 'Due today',     cls: 'text-[#E07B20] border-[rgba(189,95,0,0.30)] bg-[rgba(189,95,0,0.12)]' };
  if (days <= 3)  return { label: `${days}d left`, cls: 'text-[#9092C0] border-[rgba(112,114,162,0.25)] bg-[rgba(112,114,162,0.10)]' };
  return               { label: `${days}d left`,   cls: 'text-[#55556E] border-[rgba(85,85,110,0.20)] bg-[rgba(85,85,110,0.08)]' };
};

const DS = {
  lbl: {
    fontSize: 10, fontWeight: 700, color: '#55556E',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    display: 'block', marginBottom: 6,
  },
  inp: {
    width: '100%', background: '#1C1C26',
    border: '1px solid #2A2A36', borderRadius: 10,
    padding: '12px 16px', fontSize: 14, color: '#EEEEF8',
    outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  primaryBtn: {
    width: '100%', padding: '14px',
    background: '#6366F1',
    border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 13, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    cursor: 'pointer', transition: 'opacity 0.15s',
    fontFamily: 'Inter, sans-serif',
  },
  cancelBtn: {
    width: '100%', padding: '12px',
    background: 'none', border: 'none',
    color: '#55556E', fontSize: 13, fontWeight: 400,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'color 0.15s',
  },
};

function DueForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]       = useState({ title: '', description: '', due_date: '', due_time: '', category: 'assignment' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description || '',
        due_date: toISTDateInput(editing.due_date),
        due_time: (() => { const t = toISTTimeInput(editing.due_date); return t === '00:00' ? '' : t; })(),
        category: editing.category || 'assignment',
      });
      setOpen(true);
    } else {
      setForm({ title: '', description: '', due_date: '', due_time: '', category: 'assignment' });
      if (!editing) setOpen(false);
    }
  }, [editing]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const timeStr = form.due_time || '23:59';
      const isoDatetime = new Date(`${form.due_date}T${timeStr}`).toISOString();
      const payload = { title: form.title, description: form.description, due_date: isoDatetime, category: form.category };
      const res = editing
        ? await duesAPI.update(groupId, editing.id, payload)
        : await duesAPI.create(groupId, payload);
      onCreated(res.data);
      setForm({ title: '', description: '', due_date: '', due_time: '', category: 'assignment' });
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

  const isOpen = open || !!editing;

  if (!isOpen) return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'rgba(99,102,241,0.06)', color: 'var(--text-2)', fontSize: 12, fontWeight: 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.14)'; e.currentTarget.style.color = '#EEEEF5'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
        </svg>
        Add due date
      </button>
    </div>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: 16 }}
      onClick={handleCancel}
    >
      <div
        style={{ width: '100%', maxWidth: 440, background: '#1A1A1F', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.9)', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '28px 28px 24px' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#EEEEF5', margin: '0 0 8px' }}>
            {editing ? 'Edit Due Date' : 'Add Due Date'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#9898B0', margin: '0 0 24px', lineHeight: 1.5 }}>
            Set a deadline visible to all group members.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={DS.lbl}>Title</label>
              <input style={DS.inp} placeholder="e.g. Assignment 3 submission" required
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2A2A38'} />
            </div>

            <div>
              <label style={DS.lbl}>
                Description <span style={{ color: '#55556E', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input style={DS.inp} placeholder="Add more context  · ··"
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2A2A38'} />
            </div>
            <div>
              <label style={DS.lbl}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { key: 'assignment',  label: 'Assignment',     color: '#C0C1FF' },
                  { key: 'quiz',        label: 'Quiz',           color: '#FFB38E' },
                  { key: 'observation', label: 'Observation',    color: '#22C55E' },
                  { key: 'form',        label: 'Form / Details', color: '#9E9E9E' },
                  { key: 'other',       label: 'Other',          color: '#555566' },
                ].map(cat => {
                  const active = form.category === cat.key;
                  return (
                    <button key={cat.key} type="button"
                      onClick={() => setForm(p => ({ ...p, category: cat.key }))}
                      style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s', background: active ? `${cat.color}20` : '#252525', color: active ? cat.color : '#555566', border: `1px solid ${active ? `${cat.color}50` : '#2A2A38'}` }}>
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={DS.lbl}>Due Date</label>
                <input type="date" style={DS.inp} required
                  value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2A38'} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={DS.lbl}>
                  Time <span style={{ color: '#55556E', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <input type="time" style={DS.inp}
                  value={form.due_time} onChange={e => setForm(p => ({ ...p, due_time: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#2A2A38'} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <button type="submit" disabled={loading}
                style={{ ...DS.primaryBtn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? (editing ? 'Updating  · ··' : 'Adding  · ··') : (editing ? 'Update' : 'Add Due Date')}
              </button>
              <button type="button" onClick={handleCancel} style={DS.cancelBtn}
                onMouseEnter={e => e.currentTarget.style.color = '#9898B0'}
                onMouseLeave={e => e.currentTarget.style.color = '#55556E'}>
                Cancel
              </button>
            </div>

            <div style={{ borderLeft: '3px solid #2A2A38', background: '#1C1C26', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="#55556A" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 300, color: '#55556E', lineHeight: 1.5 }}>
                Due dates are visible to all group members.
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
// category picker injected via strReplace below

export default function DuesPanel({ group }) {
  const { user }     = useAuth();
  const { socket }   = useSocket();
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isTeacher = myRole === 'admin' || myRole === 'teacher';

  const [dues, setDues]                         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [editingDue, setEditingDue]             = useState(null);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [closeConfirm, setCloseConfirm]         = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [openMenuId, setOpenMenuId]             = useState(null);

  useEffect(() => {
    if (!group) return;
    setLoading(true);
    duesAPI.list(group.id)
      .then(res => setDues(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group?.id]);

  useEffect(() => {
    if (!group || !socket) return;
    socket.emit('join_group', group.id);
    const onNewDue    = (d) => setDues(prev => prev.find(x => x.id === d.id) ? prev : [...prev, d].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    const onUpdateDue = (d) => setDues(prev => prev.map(x => x.id === d.id ? d : x).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
    socket.on('new_due',    onNewDue);
    socket.on('update_due', onUpdateDue);
    return () => { socket.off('new_due', onNewDue); socket.off('update_due', onUpdateDue); };
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

  const handleCloseDue = async (id) => {
    try {
      await duesAPI.close(group.id, id);
      setDues(prev => prev.filter(d => d.id !== id));
      setCloseConfirm(null);
      addToast({ type: 'success', message: 'Due date closed.' });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Could not close' });
    }
  };
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'transparent', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <ConfirmDialog
          open={!!deleteConfirm} danger
          title="Delete this due date?"
          description="This will remove it for everyone in the group."
          confirmText="Delete"
          onCancel={() => { if (!confirmingDelete) setDeleteConfirm(null); }}
          onConfirm={handleConfirmDelete}
          disabled={confirmingDelete}
        />
        <ConfirmDialog
          open={!!closeConfirm}
          title="Close this due date?"
          description="It will be removed from Due Dates for everyone but not deleted."
          confirmText="Close Due"
          onCancel={() => setCloseConfirm(null)}
          onConfirm={() => handleCloseDue(closeConfirm)}
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
            ? [1,2,3].map(i => <div key={i} className="h-16 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>)
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
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-page)', transition: 'border-color 0.15s', position: 'relative' }}
                      className="group">
                      <div className="flex-shrink-0 w-10 text-center">
                        <p className="text-base font-semibold dark:text-white text-gray-900 leading-none">
                          {dt.toLocaleString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' })}
                        </p>
                        <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5 uppercase" style={{ fontSize: 10 }}>
                          {dt.toLocaleDateString('en-GB', { month: 'short', timeZone: 'Asia/Kolkata' })}
                        </p>
                        {hasTime && (
                          <p className="dark:text-gray-600 text-gray-400 mt-0.5" style={{ fontSize: 10 }}>
                            {dt.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}
                          </p>
                        )}
                      </div>
                      <div style={{ width: 1, height: 28, background: 'var(--border-color)', flexShrink: 0 }}/>
                      <div className="flex-1 min-w-0">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <p className="font-medium dark:text-white text-gray-900 truncate" style={{ fontSize: 12 }}>{d.title}</p>
                          {d.category && d.category !== 'other' && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                              textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
                              ...(d.category === 'quiz'
                                ? { background: 'rgba(255,179,142,0.14)', color: '#FFB38E', border: '1px solid rgba(255,179,142,0.30)' }
                                : d.category === 'assignment'
                                  ? { background: 'rgba(192,193,255,0.12)', color: '#C0C1FF', border: '1px solid rgba(192,193,255,0.25)' }
                                  : d.category === 'exam'
                                    ? { background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }
                                    : { background: 'rgba(158,158,158,0.12)', color: '#9E9E9E', border: '1px solid rgba(158,158,158,0.25)' }
                              )
                            }}>
                              {d.category}
                            </span>
                          )}
                        </div>
                        {d.description && <p className="dark:text-gray-500 text-gray-500 mt-0.5 truncate" style={{ fontSize: 11 }}>{d.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full border ${badge.cls}`} style={{ fontSize: 11 }}>{badge.label}</span>
                        {(isTeacher || d.users?.id === user?.id) && (
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === d.id ? null : d.id); }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
                            </button>
                            {openMenuId === d.id && (
                              <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpenMenuId(null)} />
                                <div style={{ position: 'absolute', right: 0, top: 30, zIndex: 999, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', minWidth: 110, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
                                  <button onClick={() => { setEditingDue(d); setOpenMenuId(null); }}
                                    style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 12, fontWeight: 300, fontFamily: 'Inter, sans-serif', textAlign: 'left', display: 'block' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>Edit</button>
                                  <div style={{ height: 1, background: 'var(--border-color)' }} />
                                  <button onClick={() => { setCloseConfirm(d.id); setOpenMenuId(null); }}
                                    style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 12, fontWeight: 300, fontFamily: 'Inter, sans-serif', textAlign: 'left', display: 'block' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>Close</button>
                                  <button onClick={() => { setDeleteConfirm(d.id); setOpenMenuId(null); }}
                                    style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.7)', fontSize: 12, fontWeight: 300, fontFamily: 'Inter, sans-serif', textAlign: 'left', display: 'block' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>Delete</button>
                                </div>
                              </>
                            )}
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
