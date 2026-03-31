import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { announcementsAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatDateTime, toISTDateInput, toISTTimeInput } from '../utils/time';
import FilePickerPopover from './ui/FilePickerPopover';
import MessageContent from './ui/MessageContent';

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

const formatDate = (d) => formatDateTime(d);

function AnnouncementForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]         = useState({ title: '', content: '', tag: 'general' });
  const [scheduled, setScheduled] = useState(false);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const contentRef = useRef(null);
  const fileButtonRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setForm({ title: editing.title, content: editing.content, tag: editing.tag || 'general' });
      if (editing.scheduled_at && !editing.published) {
        setScheduled(true);
        setSchedDate(toISTDateInput(editing.scheduled_at));
        setSchedTime(toISTTimeInput(editing.scheduled_at));
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
  const minDate = toISTDateInput(Date.now() + 60_000);

  if (!open && !editing) return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
        </svg>
        New announcement
      </button>
    </div>
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
      <div className="relative">
        <textarea ref={contentRef} className="form-input resize-none" rows={3} placeholder="Write your announcement..."
          required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}/>
        <button ref={fileButtonRef} type="button" title="Attach file reference"
          onClick={() => setShowFilePicker(v => !v)}
          className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition
            ${showFilePicker ? 'bg-brand-600 text-white' : 'dark:text-gray-500 text-gray-400 dark:hover:bg-surface-3 hover:bg-gray-200'}`}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
          </svg>
        </button>
        {showFilePicker && (
          <FilePickerPopover
            groupId={groupId}
            triggerRef={fileButtonRef}
            onPick={ref => {
              const el = contentRef.current;
              if (!el) { setForm(p => ({ ...p, content: p.content + ref })); }
              else {
                const start = el.selectionStart;
                const next = el.value.slice(0, start) + ref + el.value.slice(start);
                setForm(p => ({ ...p, content: next }));
              }
            }}
            onClose={() => setShowFilePicker(false)}
          />
        )}
      </div>

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

export default function GroupOverview({ group, onFileRef }) {
  const { user }     = useAuth();
  const { socket }   = useSocket();
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isTeacher = myRole === 'admin' || myRole === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [scheduled, setScheduled]         = useState([]);
  const [loadingA, setLoadingA]           = useState(true);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    if (!group || !socket) return;
    setLoadingA(true);
    announcementsAPI.list(group.id).then(res => setAnnouncements(res.data)).catch(console.error).finally(() => setLoadingA(false));
    if (isTeacher) announcementsAPI.scheduled(group.id).then(res => setScheduled(res.data)).catch(console.error);

    // Ensure we're in the socket room (ChatPanel may not be mounted)
    socket.emit('join_group', group.id);

    const onNewAnnouncement   = (a) => setAnnouncements(prev => prev.find(x => x.id === a.id) ? prev : [a, ...prev]);
    const onUpdateAnnouncement = (a) => setAnnouncements(prev => prev.map(x => x.id === a.id ? a : x));
    const onReaction = ({ announcementId, reactions }) =>
      setAnnouncements(prev => prev.map(a => a.id === announcementId ? { ...a, announcement_reactions: reactions } : a));
    const onNewDue    = (d) => d; // handled by DuesPanel
    const onUpdateDue = (d) => d;

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
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.error || 'Could not delete item' });
    } finally { setConfirmingDelete(false); }
  };

  const roleColor = myRole === 'admin'  // kept for potential future use
    ? 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20'
    : myRole === 'teacher'
      ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20'
      : 'dark:bg-surface-3 bg-gray-100 dark:text-gray-400 text-gray-500 dark:border-surface-4 border-gray-200';
  void roleColor;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'transparent', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
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
        <div style={{ borderBottom: '1px solid #1c1c1c', paddingBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 400, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{group.name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 300, marginTop: 4 }}>{group.subject}</p>
          {group.description && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 300, marginTop: 6 }}>{group.description}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 400, padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{myRole}</span>
            {isTeacher && (
              <span style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>
                Invite code: <span style={{ fontFamily: 'monospace', color: 'rgba(124,58,237,0.8)' }}>{group.invite_code}</span>
              </span>
            )}
          </div>
        </div>

        {/* Announcements */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Announcements</h2>
            <span style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>{announcements.length} total</span>
          </div>
          <div className="space-y-3">
            {isTeacher && (
              <AnnouncementForm groupId={group.id}
                onCreated={editingAnnouncement
                  ? handleAnnouncementUpdate
                  : (a => {
                      // For scheduled announcements the socket won't fire, so add directly.
                      // For published ones the socket event handles it — no need to add here.
                      if (!a.published) setScheduled(prev => [...prev, a].sort((x, y) => new Date(x.scheduled_at) - new Date(y.scheduled_at)));
                    })
                }
                editing={editingAnnouncement} onCancel={() => setEditingAnnouncement(null)}/>
            )}
            {loadingA ? [1,2].map(i => <div key={i} className="h-24 dark:bg-surface-2 bg-gray-100 rounded-xl animate-pulse"/>) :
              announcements.length === 0 ? (
                <div className="py-10 text-center border border-dashed dark:border-brand-900/40 border-gray-200 rounded-xl">
                  <p className="dark:text-gray-600 text-gray-400 text-sm">No announcements yet</p>
                </div>
              ) : announcements.map(a => {
                const tag = ANNOUNCEMENT_TAGS[a.tag] || ANNOUNCEMENT_TAGS.general;
                const reactionMap = {};
                (a.announcement_reactions || []).forEach(r => {
                  if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
                  reactionMap[r.emoji].push(r.user_id);
                });
                return (
                  <div key={a.id}
                    style={{ padding: '16px', borderRadius: 10, borderLeft: `2px solid ${tag.accentColor || '#2a2a2a'}`, border: '1px solid #1c1c1c', background: '#080808' }}
                    className="group">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 400, padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                          <TagIcon type={a.tag || 'general'} />{tag.label}
                        </span>
                        <p style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{a.title}</p>
                        <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{a.users?.name} · {formatDate(a.created_at)}</p>
                      </div>
                      {(isTeacher || a.users?.id === user?.id) && (
                        <div style={{ display: 'flex', gap: 8 }} className="opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => setEditingAnnouncement(a)}
                            style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 300, background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>Edit</button>
                          <button onClick={() => setDeleteConfirm({ type: 'announcement', id: a.id })}
                            style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 300, background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.8)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>Delete</button>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.6)', marginTop: 12, lineHeight: 1.6 }}>
                      <MessageContent content={a.content} isOwn={false} onFileRef={onFileRef} />
                    </div>
                    {Object.keys(reactionMap).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {Object.entries(reactionMap).map(([emoji, userIds]) => (
                          <button key={emoji} onClick={() => handleReact(a.id, emoji)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 300, border: userIds.includes(user?.id) ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.08)', background: userIds.includes(user?.id) ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', color: userIds.includes(user?.id) ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                            <span>{emoji}</span><span>{userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
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
                            {sendAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })} at {sendAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                          </span>
                        </div>
                        <p className="text-sm font-medium dark:text-white text-gray-900">{a.title}</p>
                        <p className="text-xs dark:text-gray-500 text-gray-500 mt-0.5">{a.users?.name}</p>
                      </div>
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => setEditingAnnouncement(a)} className="dark:text-gray-600 text-gray-400 hover:text-brand-400 text-xs transition px-1 py-0.5">Edit</button>
                        <button onClick={() => setDeleteConfirm({ type: 'announcement', id: a.id })} className="dark:text-gray-600 text-gray-400 hover:text-red-400 text-xs transition px-1 py-0.5">Delete</button>
                      </div>
                    </div>
                    <div className="text-sm dark:text-gray-400 text-gray-600 mt-3 leading-relaxed line-clamp-2">
                      <MessageContent content={a.content} isOwn={false} onFileRef={onFileRef} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
