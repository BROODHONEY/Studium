import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { announcementsAPI, duesAPI } from '../services/api';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatDateTime, toISTDateInput, toISTTimeInput } from '../utils/time';
import FilePickerPopover from './ui/FilePickerPopover';
import MessageContent from './ui/MessageContent';

// -- Announcement tag config ----------------------------
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
  general:    { label: 'General',    border: 'border-l-[#9E9E9E]',  badge: 'bg-[rgba(158,158,158,0.12)] text-[#BDBDBD] border-[rgba(158,158,158,0.25)]' },
  urgent:     { label: 'Urgent',     border: 'border-l-[#FFB38E]',  badge: 'bg-[rgba(255,179,142,0.14)] text-[#FFB38E] border-[rgba(255,179,142,0.30)]' },
  exam:       { label: 'Exam',       border: 'border-l-[#C0C1FF]',  badge: 'bg-[rgba(192,193,255,0.12)] text-[#C0C1FF] border-[rgba(192,193,255,0.25)]' },
  assignment: { label: 'Assignment', border: 'border-l-[#FFB38E]',  badge: 'bg-[rgba(255,179,142,0.10)] text-[#FFC9A8] border-[rgba(255,179,142,0.22)]' },
  event:      { label: 'Event',      border: 'border-l-[#22C55E]',  badge: 'bg-[rgba(34,197,94,0.10)] text-[#22C55E] border-[rgba(34,197,94,0.22)]' },
};

const formatDate = (d) => formatDateTime(d);

function AnnouncementForm({ groupId, onCreated, editing, onCancel }) {
  const [form, setForm]           = useState({ title: '', content: '', tag: 'general' });
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [scheduled, setScheduled] = useState(false);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const contentRef    = useRef(null);
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
      const fileTokens = attachedFiles.map(f => `{{file:${f.id}:${f.filename}:${f.file_url}}}`).join(' ');
      const fullContent = [form.content, fileTokens].filter(Boolean).join('\n');
      const payload = { ...form, content: fullContent };
      if (scheduled && schedDate) {
        payload.scheduled_at = new Date(`${schedDate}T${schedTime || '09:00'}`).toISOString();
      }
      const res = editing
        ? await announcementsAPI.update(groupId, editing.id, payload)
        : await announcementsAPI.create(groupId, payload);
      onCreated(res.data);
      setForm({ title: '', content: '', tag: 'general' });
      setAttachedFiles([]);
      setScheduled(false); setSchedDate(''); setSchedTime('');
      setOpen(false);
      if (onCancel) onCancel();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCancel = () => {
    setOpen(false);
    setForm({ title: '', content: '', tag: 'general' });
    setAttachedFiles([]);
    setScheduled(false); setSchedDate(''); setSchedTime('');
    if (onCancel) onCancel();
  };

  const minDate = toISTDateInput(Date.now() + 60_000);
  const isOpen  = open || !!editing;

  const lbl = { fontSize: 10, fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 };
  const inp = { width: '100%', background: '#252525', border: '1px solid #2A2A36', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#F0F0F0', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.15s' };

  const TAG_STYLES = {
    general:    { background: 'rgba(158,158,158,0.12)', color: '#BDBDBD', border: '1px solid rgba(158,158,158,0.25)' },
    urgent:     { background: 'rgba(255,179,142,0.14)', color: '#FFB38E', border: '1px solid rgba(255,179,142,0.30)' },
    exam:       { background: 'rgba(192,193,255,0.12)', color: '#C0C1FF', border: '1px solid rgba(192,193,255,0.25)' },
    assignment: { background: 'rgba(255,179,142,0.10)', color: '#FFC9A8', border: '1px solid rgba(255,179,142,0.22)' },
    event:      { background: 'rgba(34,197,94,0.10)',   color: '#22C55E', border: '1px solid rgba(34,197,94,0.22)' },
  };

  if (!isOpen) return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'rgba(91,95,239,0.06)', color: 'var(--text-2)', fontSize: 12, fontWeight: 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,193,255,0.12)'; e.currentTarget.style.color = '#F0F0F0'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(91,95,239,0.06)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
          <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
        </svg>
        New announcement
      </button>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: 16 }}
      onClick={handleCancel}>
      <div style={{ width: '100%', maxWidth: 500, background: '#1E1E1E', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.85)', fontFamily: 'Inter, sans-serif', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '28px 28px 24px' }}>

          <p style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 8px' }}>
            {editing ? 'Edit Announcement' : 'New Announcement'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#9E9E9E', margin: '0 0 24px', lineHeight: 1.5 }}>
            {editing ? 'Update your announcement for the group.' : 'Post an update visible to all group members.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Category tags */}
            <div>
              <label style={lbl}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(ANNOUNCEMENT_TAGS).map(([key, t]) => {
                  const isActive = form.tag === key;
                  return (
                    <button key={key} type="button"
                      onClick={() => setForm(p => ({ ...p, tag: key }))}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif', ...(isActive ? TAG_STYLES[key] : { background: '#252525', color: '#555555', border: '1px solid #2A2A36' }) }}>
                      <TagIcon type={key} />{t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label style={lbl}>Title</label>
              <input style={inp} placeholder="Announcement title" required
                value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                onFocus={e => e.target.style.borderColor = '#C0C1FF'}
                onBlur={e => e.target.style.borderColor = '#333333'} />
            </div>

            {/* Content */}
            <div style={{ position: 'relative' }}>
              <label style={lbl}>Message</label>
              <textarea ref={contentRef}
                style={{ ...inp, resize: 'none', lineHeight: 1.6, minHeight: 100 }}
                rows={4} placeholder="Write your announcement ÂÂ·" required
                value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                onFocus={e => e.target.style.borderColor = '#C0C1FF'}
                onBlur={e => e.target.style.borderColor = '#333333'} />

              {/* Attached files chips */}
              {attachedFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {attachedFiles.map(f => (
                    <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: '#252525', border: '1px solid #333333', fontSize: 11, color: '#9E9E9E', maxWidth: 220 }}>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="#555555" style={{ flexShrink: 0 }}><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/></svg>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.filename.length > 24 ? f.filename.slice(0, 22) + 'â¦' : f.filename}</span>
                      <button type="button" onClick={() => setAttachedFiles(prev => prev.filter(x => x.id !== f.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555555', lineHeight: 1, padding: 0, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#555555'}>Ãââ</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Attach file button */}
              <div style={{ position: 'relative', marginTop: 8 }}>
                <button ref={fileButtonRef} type="button" title="Attach file"
                  onClick={() => setShowFilePicker(v => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 7, border: '1px solid #333333', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s', background: showFilePicker ? 'rgba(192,193,255,0.12)' : 'rgba(255,255,255,0.04)', color: showFilePicker ? '#C0C1FF' : '#555555' }}
                  onMouseEnter={e => { if (!showFilePicker) { e.currentTarget.style.color = '#9E9E9E'; } }}
                  onMouseLeave={e => { if (!showFilePicker) { e.currentTarget.style.color = '#555555'; } }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/></svg>
                  Attach file
                </button>
                {showFilePicker && (
                  <FilePickerPopover groupId={groupId} triggerRef={fileButtonRef}
                    onPick={file => {
                      if (!attachedFiles.find(f => f.id === file.id)) {
                        setAttachedFiles(prev => [...prev, file]);
                      }
                      setShowFilePicker(false);
                    }}
                    onClose={() => setShowFilePicker(false)} />
                )}
              </div>
            </div>

            {/* Schedule toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => setScheduled(v => !v)}
                style={{ position: 'relative', width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', background: scheduled ? '#C0C1FF' : '#333333', padding: 0 }}>
                <span style={{ position: 'absolute', top: 2, left: scheduled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}/>
              </button>
              <span style={{ fontSize: 13, fontWeight: 300, color: '#9E9E9E' }}>Schedule for later</span>
            </div>

            {scheduled && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Date</label>
                  <input type="date" style={inp} required min={minDate}
                    value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#C0C1FF'}
                    onBlur={e => e.target.style.borderColor = '#333333'} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Time</label>
                  <input type="time" style={inp}
                    value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#C0C1FF'}
                    onBlur={e => e.target.style.borderColor = '#333333'} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '14px', background: '#C0C1FF', border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s', fontFamily: 'Inter, sans-serif' }}>
                {loading ? 'Saving ÂÂ·' : scheduled ? (editing ? 'Reschedule' : 'Schedule') : (editing ? 'Update' : 'Post Now')}
              </button>
              <button type="button" onClick={handleCancel}
                style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#555555', fontSize: 13, fontWeight: 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9E9E9E'}
                onMouseLeave={e => e.currentTarget.style.color = '#555555'}>
                Cancel
              </button>
            </div>

            {/* Info footer */}
            <div style={{ borderLeft: '3px solid #2A2A36', background: '#252525', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="#55556E" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 300, color: '#555555', lineHeight: 1.5 }}>
                Announcements are visible to all group members immediately after posting.
              </span>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function GroupOverview({ group, onFileRef, onOpenCalendar }) {
  const { user }     = useAuth();
  const { socket }   = useSocket();
  const { addToast } = useToast();

  const myRole    = group?.my_role;
  const isTeacher = myRole === 'admin' || myRole === 'teacher';

  const [announcements, setAnnouncements] = useState([]);
  const [scheduled, setScheduled]         = useState([]);
  const [loadingA, setLoadingA]           = useState(true);
  const [dues, setDues]                   = useState([]);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openEmojiId, setOpenEmojiId] = useState(null);
  const EMOJI_OPTIONS = ['ðâ', 'â¤ï¸', 'ð', 'ð®', 'ðâ¥', 'ðâ'];

  useEffect(() => {
    if (!group) return;
    setLoadingA(true);
    announcementsAPI.list(group.id).then(res => setAnnouncements(res.data)).catch(console.error).finally(() => setLoadingA(false));
    if (isTeacher) announcementsAPI.scheduled(group.id).then(res => setScheduled(res.data)).catch(console.error);
    duesAPI.list(group.id).then(res => setDues(res.data || [])).catch(console.error);
  }, [group?.id]);

  useEffect(() => {
    if (!group || !socket) return;

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

  // -- Palette --------------------------------------------
  const P = {
    bg:        '#181818',
    surface:   '#1E1E1E',
    card:      '#252525',
    border:    '#333333',
    primary:   '#C0C1FF',   /* lavender */
    primaryHi: '#D4D5FF',
    primaryLo: 'rgba(192,193,255,0.12)',
    secondary: '#FFB38E',   /* peach */
    secondaryHi:'#FFC9A8',
    secondaryLo:'rgba(255,179,142,0.12)',
    tertiary:  '#9E9E9E',   /* grey */
    tertiaryHi:'#BDBDBD',
    tertiaryLo:'rgba(158,158,158,0.12)',
    text1:     '#F0F0F0',
    text2:     '#9E9E9E',
    text3:     '#555555',
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: P.bg, fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {/* Subtle top-right glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 400, background: 'radial-gradient(ellipse at top right, rgba(192,193,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 400, height: 300, background: 'radial-gradient(ellipse at top left, rgba(255,179,142,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 60px', position: 'relative' }}>
        <ConfirmDialog
          open={!!deleteConfirm} danger={true}
          title="Delete this announcement?"
          description="This action will remove it for everyone."
          confirmText="Delete"
          onCancel={() => { if (!confirmingDelete) setDeleteConfirm(null); }}
          onConfirm={handleConfirmDelete} disabled={confirmingDelete}
        />

        {/* ââââ Greeting + group info ââââ */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: P.secondary, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>
            {group.subject}
          </p>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: P.text1, margin: '0 0 4px', lineHeight: 1.12, letterSpacing: '-0.03em', fontFamily: "'Manrope', 'Inter', sans-serif" }}>
            {greeting()}, {user?.name?.split(' ')[0]}.
          </h1>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: P.text3, margin: 0, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            Welcome to {group.name}.
          </h2>

          {/* Meta strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: P.primary, background: P.primaryLo, border: `1px solid rgba(192,193,255,0.25)`, borderRadius: 6, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>
              {myRole}
            </span>
            {isTeacher && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 400, color: P.text3 }}>
                Invite code:
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: P.secondary, letterSpacing: '0.1em' }}>{group.invite_code}</span>
              </span>
            )}
            {group.description && (
              <span style={{ fontSize: 12, fontWeight: 300, color: P.text3 }}>{group.description}</span>
            )}
          </div>
        </div>

        {/* -- Two-column layout -- */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* -- Left column -- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Announcements section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: P.text1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Announcements</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: P.secondary }}>{announcements.length} total</span>
                  {isTeacher && (
                    <AnnouncementForm groupId={group.id}
                      onCreated={editingAnnouncement
                        ? handleAnnouncementUpdate
                        : (a => { if (!a.published) setScheduled(prev => [...prev, a].sort((x, y) => new Date(x.scheduled_at) - new Date(y.scheduled_at))); })
                      }
                      editing={editingAnnouncement} onCancel={() => setEditingAnnouncement(null)}/>
                  )}
                </div>
              </div>

              {loadingA ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2].map(i => <div key={i} style={{ height: 88, borderRadius: 12, background: P.card, animation: 'pulse 1.5s infinite' }}/>)}
                </div>
              ) : announcements.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', border: `1px dashed ${P.border}`, borderRadius: 12 }}>
                  <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor" style={{ color: P.text3, margin: '0 auto 10px', display: 'block' }}>
                    <path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-.214c-2.162-1.241-4.49-1.843-6.912-2.083l.405 2.712A1 1 0 0 1 5.51 15.1h-.548a1 1 0 0 1-.916-.599l-1.85-3.49-.202-.003A2.014 2.014 0 0 1 0 9V7a2.02 2.02 0 0 1 1.992-2.013 74.663 74.663 0 0 0 2.483-.075c3.043-.154 6.148-.849 8.525-2.199V2.5z"/>
                  </svg>
                  <p style={{ fontSize: 13, color: P.text3, fontWeight: 300, margin: 0 }}>No announcements yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {announcements.map(a => {
                    const tag = ANNOUNCEMENT_TAGS[a.tag] || ANNOUNCEMENT_TAGS.general;
                    const reactionMap = {};
                    (a.announcement_reactions || []).forEach(r => {
                      if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
                      reactionMap[r.emoji].push(r.user_id);
                    });
                    const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                    const avatarColors = ['#C0C1FF','#7072AC','#B95F00','#0d9488','#db2777'];
                    const avatarBg = (n) => avatarColors[(n?.charCodeAt(0) || 0) % avatarColors.length];
                    return (
                      <div key={a.id}
                        onClick={() => setSelectedAnnouncement(a)}
                        style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = P.primary; e.currentTarget.style.background = P.surface; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.background = P.card; }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          {/* Avatar */}
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarBg(a.users?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                            {ini(a.users?.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: P.text1 }}>{a.users?.name}</span>
                                <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 5, background: `${P.primary}20`, color: P.primary, border: `1px solid ${P.primary}35`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {tag.label}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: P.text3, flexShrink: 0 }}>{formatDate(a.created_at)}</span>
                                {(isTeacher || a.users?.id === user?.id) && (
                                  <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                                    <button onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
                                      style={{ width: 24, height: 24, borderRadius: 5, background: 'none', border: 'none', cursor: 'pointer', color: P.text3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      onMouseEnter={e => e.currentTarget.style.color = P.text2}
                                      onMouseLeave={e => e.currentTarget.style.color = P.text3}>
                                      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
                                    </button>
                                    {openMenuId === a.id && (
                                      <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpenMenuId(null)} />
                                        <div style={{ position: 'absolute', right: 0, top: 28, zIndex: 999, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, overflow: 'hidden', minWidth: 110, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                                          <button onClick={() => { setEditingAnnouncement(a); setOpenMenuId(null); }}
                                            style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: P.text2, fontSize: 12, fontFamily: 'Inter, sans-serif', textAlign: 'left', display: 'block' }}
                                            onMouseEnter={e => e.currentTarget.style.background = P.card}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>Edit</button>
                                          <div style={{ height: 1, background: P.border }} />
                                          <button onClick={() => { setDeleteConfirm({ type: 'announcement', id: a.id }); setOpenMenuId(null); }}
                                            style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.8)', fontSize: 12, fontFamily: 'Inter, sans-serif', textAlign: 'left', display: 'block' }}
                                            onMouseEnter={e => e.currentTarget.style.background = P.card}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>Delete</button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 400, color: P.text1, margin: '0 0 4px' }}>{a.title}</p>
                            <div style={{ fontSize: 12, fontWeight: 300, color: P.text2, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              <MessageContent content={a.content} isOwn={false} onFileRef={onFileRef} />
                            </div>
                            {/* Reactions row */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                              {Object.entries(reactionMap).map(([emoji, userIds]) => (
                                <button key={emoji} onClick={() => handleReact(a.id, emoji)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 11, border: `1px solid ${userIds.includes(user?.id) ? P.primary + '60' : P.border}`, background: userIds.includes(user?.id) ? `${P.primary}20` : 'transparent', color: userIds.includes(user?.id) ? P.primary : P.text3, cursor: 'pointer', transition: 'all 0.1s' }}>
                                  <span>{emoji}</span><span>{userIds.length}</span>
                                </button>
                              ))}
                              {/* Add reaction button */}
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={() => setOpenEmojiId(openEmojiId === a.id ? null : a.id)}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 22, borderRadius: 20, border: `1px solid ${P.border}`, background: 'transparent', cursor: 'pointer', fontSize: 13, color: P.text3, transition: 'all 0.1s' }}
                                  onMouseEnter={e => { e.currentTarget.style.borderColor = P.primary; e.currentTarget.style.color = P.primary; }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.text3; }}>
                                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/></svg>
                                </button>
                                {openEmojiId === a.id && (
                                  <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setOpenEmojiId(null)} />
                                    <div style={{ position: 'absolute', bottom: 28, left: 0, zIndex: 999, display: 'flex', gap: 4, padding: '6px 8px', background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                      {EMOJI_OPTIONS.map(e => (
                                        <button key={e} onClick={() => { handleReact(a.id, e); setOpenEmojiId(null); }}
                                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 3px', borderRadius: 6, transition: 'background 0.1s' }}
                                          onMouseEnter={el => el.currentTarget.style.background = P.card}
                                          onMouseLeave={el => el.currentTarget.style.background = 'none'}>
                                          {e}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scheduled  · teachers only */}
            {isTeacher && scheduled.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: P.text1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Scheduled</span>
                  <span style={{ fontSize: 11, color: P.secondary }}>{scheduled.length} pending</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scheduled.map(a => {
                    const tag = ANNOUNCEMENT_TAGS[a.tag] || ANNOUNCEMENT_TAGS.general;
                    const sendAt = new Date(a.scheduled_at);
                    return (
                      <div key={a.id} style={{ background: P.card, border: `1px solid ${P.border}`, borderLeft: `3px solid ${P.secondary}`, borderRadius: 10, padding: '14px 16px', opacity: 0.85 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 5, background: `${P.secondary}25`, color: P.secondary, border: `1px solid ${P.secondary}40`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag.label}</span>
                              <span style={{ fontSize: 10, color: P.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
                                {sendAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}  · {sendAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: P.text1, margin: '0 0 2px' }}>{a.title}</p>
                            <p style={{ fontSize: 11, color: P.text3, margin: 0 }}>{a.users?.name}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setEditingAnnouncement(a)}
                              style={{ padding: '4px 10px', borderRadius: 6, background: 'none', border: `1px solid ${P.border}`, color: P.text3, fontSize: 11, cursor: 'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.color = P.text2}
                              onMouseLeave={e => e.currentTarget.style.color = P.text3}>Edit</button>
                            <button onClick={() => setDeleteConfirm({ type: 'announcement', id: a.id })}
                              style={{ padding: '4px 10px', borderRadius: 6, background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.6)', fontSize: 11, cursor: 'pointer' }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* -- Right column -- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Group info card */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: P.text1, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>Group Info</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, color: P.text3, margin: '0 0 2px', fontWeight: 400 }}>Subject</p>
                  <p style={{ fontSize: 13, color: P.text1, margin: 0, fontWeight: 400 }}>{group.subject}</p>
                </div>
                {group.description && (
                  <div>
                    <p style={{ fontSize: 11, color: P.text3, margin: '0 0 2px', fontWeight: 400 }}>Description</p>
                    <p style={{ fontSize: 12, color: P.text2, margin: 0, fontWeight: 300, lineHeight: 1.5 }}>{group.description}</p>
                  </div>
                )}
                {isTeacher && (
                  <div style={{ paddingTop: 10, borderTop: `1px solid ${P.border}` }}>
                    <p style={{ fontSize: 11, color: P.text3, margin: '0 0 6px', fontWeight: 400 }}>Invite Code</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: P.primary, letterSpacing: '0.15em' }}>{group.invite_code}</span>
                      <button onClick={() => navigator.clipboard.writeText(group.invite_code)}
                        style={{ padding: '4px 10px', borderRadius: 6, background: `${P.primary}18`, border: `1px solid ${P.primary}35`, color: P.primary, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            {(() => {
              const todayStart = new Date(); todayStart.setHours(0,0,0,0);
              const sevenDaysLater = new Date(todayStart); sevenDaysLater.setDate(todayStart.getDate() + 7);
              const upcoming = dues
                .filter(d => {
                  if (!d.due_date) return false;
                  const dt = new Date(d.due_date);
                  return dt >= todayStart && dt <= sevenDaysLater;
                })
                .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                .slice(0, 5);
              const BAR_COLORS = [P.secondary, P.primary, P.tertiaryHi, '#22C55E', P.primaryHi];
              const fmtDeadline = (iso) => {
                const d = new Date(iso);
                const today = new Date(); today.setHours(0,0,0,0);
                const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
                const dDay = new Date(d); dDay.setHours(0,0,0,0);
                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                if (dDay.getTime() === today.getTime()) return { label: `Today · ${timeStr}`, date: dateStr, urgent: true };
                if (dDay.getTime() === tomorrow.getTime()) return { label: `Tomorrow · ${timeStr}`, date: dateStr, urgent: false };
                return { label: `${d.toLocaleDateString([], { weekday: 'long' })} · ${timeStr}`, date: dateStr, urgent: false };
              };
              return (
                <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: P.text1, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>Upcoming Deadlines</p>
                  {upcoming.length === 0 ? (
                    <p style={{ fontSize: 12, color: P.text3, fontWeight: 300, fontStyle: 'italic', margin: 0 }}>No dues in the next 7 days</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {upcoming.map((d, i) => {
                        const { label, date, urgent } = fmtDeadline(d.due_date);
                        const color = BAR_COLORS[i % BAR_COLORS.length];
                        return (
                          <div key={d.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                            <div style={{ width: 4, borderRadius: 4, background: color, alignSelf: 'stretch', flexShrink: 0, minHeight: 36 }} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: P.text1, margin: '0 0 2px', lineHeight: 1.3 }}>{d.title}</p>
                              <p style={{ fontSize: 11, fontWeight: 400, color: urgent ? P.secondary : P.text3, margin: 0 }}>{label}</p>
                              <p style={{ fontSize: 10, fontWeight: 300, color: P.text3, margin: '1px 0 0' }}>{date}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, background: 'none', border: 'none', color: P.secondary, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = P.secondaryHi}
                    onMouseLeave={e => e.currentTarget.style.color = P.secondary}
                    onClick={() => onOpenCalendar?.()}>                    Open Calendar
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 1 0v4a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13z"/><path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/></svg>
                  </button>
                </div>
              );
            })()}

            {/* Quick actions */}
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: P.text1, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Quick Access</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Chat', icon: 'M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414a1 1 0 0 0-.707.293L.854 15.146A.5.5 0 0 1 0 14.793V2z', color: P.primary },
                  { label: 'Files', icon: 'M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0zM9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1z', color: P.secondary },
                  { label: 'Dues', icon: 'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z', color: P.tertiary },
                  { label: 'Members', icon: 'M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', color: '#10b981' },
                ].map(item => (
                  <div key={item.label}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: 'transparent', border: `1px solid ${P.border}`, cursor: 'default', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${item.color}50`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 16 16" fill={item.color}><path d={item.icon}/></svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 400, color: P.text2 }}>{item.label}</span>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" style={{ color: P.text3, marginLeft: 'auto' }}>
                      <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement detail popup */}
      {selectedAnnouncement && (() => {
        const a = selectedAnnouncement;
        const tag = ANNOUNCEMENT_TAGS[a.tag] || ANNOUNCEMENT_TAGS.general;
        const reactionMap = {};
        (a.announcement_reactions || []).forEach(r => {
          if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
          reactionMap[r.emoji].push(r.user_id);
        });
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', padding: '0 20px' }}
            onClick={() => setSelectedAnnouncement(null)}>
            <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 16, padding: '22px', width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', maxHeight: '80vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 5, background: `${P.primary}20`, color: P.primary, border: `1px solid ${P.primary}35`, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <TagIcon type={a.tag || 'general'} />{tag.label}
                  </span>
                  <p style={{ fontSize: 16, fontWeight: 600, color: P.text1, margin: 0, lineHeight: 1.4 }}>{a.title}</p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: P.text3, marginTop: 4 }}>{a.users?.name}  · {formatDate(a.created_at)}</p>
                </div>
                <button onClick={() => setSelectedAnnouncement(null)}
                  style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: P.text3, padding: 2, lineHeight: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
                </button>
              </div>
              <div style={{ padding: '14px 16px', background: P.card, borderRadius: 10, border: `1px solid ${P.border}`, fontSize: 13, fontWeight: 300, color: P.text2, lineHeight: 1.7 }}>
                <MessageContent content={a.content} isOwn={false} onFileRef={(id) => { onFileRef(id); setSelectedAnnouncement(null); }} />
              </div>
              {/* Reactions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 }}>
                {Object.entries(reactionMap).map(([emoji, userIds]) => (
                  <button key={emoji} onClick={() => handleReact(a.id, emoji)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, border: `1px solid ${userIds.includes(user?.id) ? P.primary + '60' : P.border}`, background: userIds.includes(user?.id) ? `${P.primary}20` : 'transparent', color: userIds.includes(user?.id) ? P.primary : P.text3, cursor: 'pointer', transition: 'all 0.1s' }}>
                    <span>{emoji}</span><span>{userIds.length}</span>
                  </button>
                ))}
                {/* Add reaction */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenEmojiId(openEmojiId === `modal-${a.id}` ? null : `modal-${a.id}`)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 26, borderRadius: 20, border: `1px solid ${P.border}`, background: 'transparent', cursor: 'pointer', fontSize: 14, color: P.text3, transition: 'all 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = P.primary; e.currentTarget.style.color = P.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.text3; }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/></svg>
                  </button>
                  {openEmojiId === `modal-${a.id}` && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 1001 }} onClick={() => setOpenEmojiId(null)} />
                      <div style={{ position: 'absolute', bottom: 32, left: 0, zIndex: 1002, display: 'flex', gap: 4, padding: '6px 8px', background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                        {EMOJI_OPTIONS.map(e => (
                          <button key={e} onClick={() => { handleReact(a.id, e); setOpenEmojiId(null); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '2px 3px', borderRadius: 6, transition: 'background 0.1s' }}
                            onMouseEnter={el => el.currentTarget.style.background = P.card}
                            onMouseLeave={el => el.currentTarget.style.background = 'none'}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {(isTeacher || a.users?.id === user?.id) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => { setEditingAnnouncement(a); setSelectedAnnouncement(null); }}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, background: `${P.primary}18`, border: `1px solid ${P.primary}35`, color: P.primary, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Edit
                  </button>
                  <button onClick={() => { setDeleteConfirm({ type: 'announcement', id: a.id }); setSelectedAnnouncement(null); }}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.8)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
