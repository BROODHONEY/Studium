import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../services/api';

// -- Obsidian Flux tokens --------------------------------
const T = {
  bg:         '#181818',
  surface:    '#1E1E1E',
  card:       '#252525',
  border:     '#333333',
  primary:    '#C0C1FF',
  primaryHi:  '#D4D5FF',
  primaryLo:  'rgba(192,193,255,0.12)',
  secondary:  '#FFB38E',
  secondaryLo:'rgba(255,179,142,0.12)',
  tertiary:   '#9E9E9E',
  text1:      '#F0F0F0',
  text2:      '#9E9E9E',
  text3:      '#555555',
  danger:     '#EF4444',
  dangerLo:   'rgba(239,68,68,0.10)',
  green:      '#22C55E',
  greenLo:    'rgba(34,197,94,0.12)',
};

const AVATAR_COLORS = ['#4f46e5','#0d9488','#6366F1','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const inp = {
  width: '100%', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
  padding: '10px 14px', fontSize: 13, fontWeight: 300, color: T.text1,
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.15s',
};
const lbl = { fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 };
const card = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px' };
const sectionTitle = { fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' };
const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 };
const divider = { height: 1, background: T.border, margin: '16px 0' };

function Toggle({ on, onToggle, label, sub }) {
  return (
    <div style={rowStyle}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 400, color: T.text1, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, fontWeight: 300, color: T.text3, margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <button onClick={onToggle}
        style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, background: on ? T.primary : T.border, border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: on ? '#131313' : '#fff', transition: 'left 0.2s' }}/>
      </button>
    </div>
  );
}

// -- Shared file attachment uploader used inside modals --
function AttachmentUploader({ attachments, onChange, accentColor }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const isImage = (type) => type?.startsWith('image/');

  const handleFileAdd = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await profileAPI.uploadAttachment(fd);
      onChange([...attachments, { name: res.data.name, url: res.data.url, type: res.data.type }]);
    } catch (err) {
      setUploadError(err?.response?.data?.error || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = (ai) => onChange(attachments.filter((_, i) => i !== ai));

  return (
    <div>
      <label style={lbl}>Attachment</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {attachments.map((att, ai) => (
          <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 6px', borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, fontSize: 11, color: T.text2, maxWidth: 200 }}>
            {isImage(att.type)
              ? <img src={att.url} alt={att.name} style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
              : <svg width="12" height="12" viewBox="0 0 16 16" fill={accentColor} style={{ flexShrink: 0 }}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
            }
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{att.name.length > 18 ? att.name.slice(0, 16) + 'â¦' : att.name}</span>
            <button onClick={() => remove(ai)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, lineHeight: 0, padding: 0, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = T.danger}
              onMouseLeave={e => e.currentTarget.style.color = T.text3}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
            </button>
          </div>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: `1px dashed ${T.border}`, color: uploading ? accentColor : T.text3, fontSize: 11, cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', background: 'none' }}
          onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; } }}
          onMouseLeave={e => { if (!uploading) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; } }}>
          <input type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleFileAdd} disabled={uploading} />
          {uploading
            ? <><div style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid ${accentColor}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }}/>&nbsp;Uploadingâ¦</>
            : <><svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>&nbsp;Attach file</>
          }
        </label>
      </div>
      {uploadError && <p style={{ fontSize: 11, color: T.danger, margin: '4px 0 0' }}>{uploadError}</p>}
    </div>
  );
}

// -- Base modal shell ------------------------------------
function EntryModal({ title, accentColor, onClose, onSave, canSave, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', fontFamily: 'Inter, sans-serif' }}
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text1, margin: 0, fontFamily: "'Manrope','Inter',sans-serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, lineHeight: 0, padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text1}
            onMouseLeave={e => e.currentTarget.style.color = T.text3}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="anim-stagger">
            {children}
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 20px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={onSave} disabled={!canSave}
            style={{ flex: 1, padding: '11px', borderRadius: 10, background: canSave ? accentColor : T.card, border: 'none', color: canSave ? '#131313' : T.text3, fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            Save
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'none', border: `1px solid ${T.border}`, color: T.text2, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// -- Achievement modal -----------------------------------
function AchievementModal({ initial, onClose, onSave }) {
  const empty = { title: '', description: '', date: '', attachments: [] };
  const [d, setD] = useState(initial ? { ...empty, ...initial } : empty);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  return (
    <EntryModal title={initial ? 'Edit Achievement' : 'Add Achievement'} accentColor={T.primary} onClose={onClose} onSave={() => onSave(d)} canSave={!!d.title.trim()}>
      <div><label style={lbl}>Title *</label>
        <input value={d.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Dean's List, Hackathon Winner" style={inp}
          onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <div><label style={lbl}>Description</label>
        <textarea value={d.description} onChange={e => set('description', e.target.value)} placeholder="Describe the achievementâ¦" rows={3}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <div><label style={lbl}>Date</label>
        <input type="date" value={d.date} onChange={e => set('date', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}
          onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <AttachmentUploader attachments={d.attachments} onChange={v => set('attachments', v)} accentColor={T.primary} />
    </EntryModal>
  );
}

// -- Certificate modal -----------------------------------
function CertificateModal({ initial, onClose, onSave }) {
  const empty = { title: '', issuedBy: '', date: '', outcomes: '', attachments: [] };
  const [d, setD] = useState(initial ? { ...empty, ...initial } : empty);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const canSave = !!d.title.trim() && !!d.issuedBy.trim() && !!d.date;
  return (
    <EntryModal title={initial ? 'Edit Certificate' : 'Add Certificate'} accentColor={T.green} onClose={onClose} onSave={() => onSave(d)} canSave={canSave}>
      <div><label style={lbl}>Certificate Name *</label>
        <input value={d.title} onChange={e => set('title', e.target.value)} placeholder="e.g. AWS Certified Solutions Architect" style={inp}
          onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <div><label style={lbl}>Issued By *</label>
        <input value={d.issuedBy} onChange={e => set('issuedBy', e.target.value)} placeholder="e.g. Amazon Web Services" style={inp}
          onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <div><label style={lbl}>Date of Obtaining *</label>
        <input type="date" value={d.date} onChange={e => set('date', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}
          onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <div><label style={lbl}>Course Learning Outcomes <span style={{ color: T.text3, fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <textarea value={d.outcomes} onChange={e => set('outcomes', e.target.value)} placeholder="What did you learn from this course?" rows={3}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={e => e.target.style.borderColor = T.green} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <AttachmentUploader attachments={d.attachments} onChange={v => set('attachments', v)} accentColor={T.green} />
    </EntryModal>
  );
}

// -- Internship modal ------------------------------------
function InternshipModal({ initial, onClose, onSave }) {
  const empty = { title: '', where: '', fromDate: '', toDate: '', description: '', attachments: [] };
  const [d, setD] = useState(initial ? { ...empty, ...initial } : empty);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const canSave = !!d.title.trim() && !!d.where.trim() && !!d.fromDate;
  return (
    <EntryModal title={initial ? 'Edit Internship' : 'Add Internship'} accentColor={T.secondary} onClose={onClose} onSave={() => onSave(d)} canSave={canSave}>
      <div><label style={lbl}>Title *</label>
        <input value={d.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Software Engineering Intern" style={inp}
          onFocus={e => e.target.style.borderColor = T.secondary} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <div><label style={lbl}>Where *</label>
        <input value={d.where} onChange={e => set('where', e.target.value)} placeholder="e.g. Google, Bangalore" style={inp}
          onFocus={e => e.target.style.borderColor = T.secondary} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lbl}>From *</label>
          <input type="date" value={d.fromDate} onChange={e => set('fromDate', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}
            onFocus={e => e.target.style.borderColor = T.secondary} onBlur={e => e.target.style.borderColor = T.border} /></div>
        <div><label style={lbl}>To</label>
          <input type="date" value={d.toDate} onChange={e => set('toDate', e.target.value)} style={{ ...inp, colorScheme: 'dark' }}
            onFocus={e => e.target.style.borderColor = T.secondary} onBlur={e => e.target.style.borderColor = T.border} /></div>
      </div>
      <div><label style={lbl}>Description</label>
        <textarea value={d.description} onChange={e => set('description', e.target.value)} placeholder="What did you work on?" rows={3}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={e => e.target.style.borderColor = T.secondary} onBlur={e => e.target.style.borderColor = T.border} /></div>
      <AttachmentUploader attachments={d.attachments} onChange={v => set('attachments', v)} accentColor={T.secondary} />
    </EntryModal>
  );
}

// -- Generic section list with add/edit/delete -----------
function SectionList({ label, accentColor, accentLo, icon, items, onAdd, onEdit, onDelete }) {
  const [confirmIdx, setConfirmIdx] = useState(null);
  const isImage = (type) => type?.startsWith('image/');
  const fmtDate = (d) => {
    if (!d) return null;
    try {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
      if (iso) return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
      return d;
    } catch { return d; }
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: accentColor, lineHeight: 0 }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
          {items.length > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: accentLo, color: accentColor, border: `1px solid ${accentColor}30` }}>{items.length}</span>}
        </div>
        <button onClick={onAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: 'none', border: `1px solid ${T.border}`, color: T.text3, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}>
          <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
          Add
        </button>
      </div>
      {items.length === 0
        ? <p style={{ fontSize: 12, color: T.text3, fontStyle: 'italic', fontWeight: 300, margin: 0, padding: '4px 0' }}>None added yet</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${confirmIdx === i ? T.danger + '60' : T.border}`, borderRadius: 10, borderLeft: `3px solid ${confirmIdx === i ? T.danger : accentColor}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: 0, lineHeight: 1.3 }}>{item.title}</p>
                    {(item.subtitle || item.issuedBy || item.where) && (
                      <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '3px 0 0', lineHeight: 1.4 }}>{item.subtitle || item.issuedBy || item.where}</p>
                    )}
                    {item.description && (
                      <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '3px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</p>
                    )}
                    {(item.date || item.fromDate) && (
                      <p style={{ fontSize: 10, fontWeight: 500, color: accentColor, margin: '4px 0 0' }}>
                        {item.fromDate ? `${fmtDate(item.fromDate)}${item.toDate ? ' ââ ' + fmtDate(item.toDate) : ' ââ Present'}` : fmtDate(item.date)}
                      </p>
                    )}
                  </div>
                  {confirmIdx !== i && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => onEdit(i)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', color: T.text2, fontSize: 11, fontWeight: 400, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; e.currentTarget.style.background = accentLo; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; e.currentTarget.style.background = 'none'; }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
                        Edit
                      </button>
                      <button onClick={() => setConfirmIdx(i)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'none', cursor: 'pointer', color: T.text2, fontSize: 11, fontWeight: 400, fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.danger + '80'; e.currentTarget.style.color = T.danger; e.currentTarget.style.background = T.dangerLo; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; e.currentTarget.style.background = 'none'; }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                {/* Inline delete confirmation */}
                {confirmIdx === i && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: `1px solid ${T.danger}30`, background: T.dangerLo }}>
                    <p style={{ fontSize: 12, color: T.danger, margin: 0, fontWeight: 400 }}>Remove this entry?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { onDelete(i); setConfirmIdx(null); }}
                        style={{ padding: '5px 14px', borderRadius: 7, background: T.danger, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Remove
                      </button>
                      <button onClick={() => setConfirmIdx(null)}
                        style={{ padding: '5px 14px', borderRadius: 7, background: 'none', border: `1px solid ${T.border}`, color: T.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {item.attachments?.length > 0 && confirmIdx !== i && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 14px 12px 58px' }}>
                    {item.attachments.map((att, ai) => (
                      isImage(att.type)
                        ? <a key={ai} href={att.url} target="_blank" rel="noreferrer">
                            <img src={att.url} alt={att.name} style={{ height: 56, width: 80, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, display: 'block' }} />
                          </a>
                        : <a key={ai} href={att.url} target="_blank" rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, textDecoration: 'none', transition: 'border-color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
                            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill={accentColor}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                            <span style={{ fontSize: 11, color: T.text2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                          </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// -- Section: Account ------------------------------------
function AccountSection({ user, login, token, addToast, onDirtyChange }) {
  const isStudent = user?.role === 'student';
  const roleColor = isStudent ? T.primary : T.secondary;
  const roleLo    = isStudent ? T.primaryLo : T.secondaryLo;

  // Only name and CGPA are editable
  const [name, setName]   = useState(user?.name || '');
  const [cgpa, setCgpa]   = useState(user?.cgpa != null ? String(user.cgpa) : '');
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  // Achievements / Internships / Certificates
  const [achievements, setAchievements] = useState(Array.isArray(user?.achievements) ? user.achievements : []);
  const [internships,  setInternships]  = useState(Array.isArray(user?.internships)  ? user.internships  : []);
  const [certificates, setCertificates] = useState(Array.isArray(user?.certificates) ? user.certificates : []);
  const [listEdited, setListEdited] = useState(false);

  // Modal state: { type: 'achievement'|'internship'|'certificate', index: number|null }
  const [modal, setModal] = useState(null);

  const markEdited = () => setEdited(true);
  const markListEdited = () => setListEdited(true);

  const openAdd = (type) => setModal({ type, index: null });
  const openEdit = (type, index) => setModal({ type, index });
  const closeModal = () => setModal(null);

  const handleSaveEntry = (type, data) => {
    if (type === 'achievement') {
      setAchievements(prev => modal.index === null ? [...prev, data] : prev.map((x, i) => i === modal.index ? data : x));
    } else if (type === 'internship') {
      setInternships(prev => modal.index === null ? [...prev, data] : prev.map((x, i) => i === modal.index ? data : x));
    } else {
      setCertificates(prev => modal.index === null ? [...prev, data] : prev.map((x, i) => i === modal.index ? data : x));
    }
    markListEdited();
    closeModal();
  };

  const handleDelete = (type, index) => {
    if (type === 'achievement') setAchievements(prev => prev.filter((_, i) => i !== index));
    else if (type === 'internship') setInternships(prev => prev.filter((_, i) => i !== index));
    else setCertificates(prev => prev.filter((_, i) => i !== index));
    markListEdited();
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        cgpa: cgpa === '' ? null : Number(cgpa),
        achievements,
        internships,
        certificates,
      };
      const res = await profileAPI.update(payload);
      login(token, { ...user, ...res.data });
      setEdited(false);
      setListEdited(false);
      addToast({ type: 'success', message: 'Profile updated.' });
    } catch { addToast({ type: 'error', message: 'Failed to save.' }); }
    finally { setSaving(false); }
  };

  const anyEdited = edited || listEdited;

  // Notify parent of dirty state + block browser refresh/close
  useEffect(() => {
    onDirtyChange?.(anyEdited);
    const handler = (e) => {
      if (!anyEdited) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyEdited]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ââââ Hero ââââ */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 320, height: 200, background: `radial-gradient(ellipse at top right, ${roleColor}10 0%, transparent 65%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 200, height: 140, background: 'radial-gradient(ellipse at bottom left, rgba(255,179,142,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, position: 'relative' }}>
          <div style={{ width: 76, height: 76, borderRadius: 20, background: avatarBg(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0, border: `2px solid ${T.border}` }}>
            {ini(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, background: roleLo, border: `1px solid ${roleColor}40`, fontSize: 9, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              {user?.role || 'Student'}
            </span>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: T.text1, margin: '0 0 4px', fontFamily: "'Manrope','Inter',sans-serif", letterSpacing: '-0.02em', lineHeight: 1.1 }}>{user?.name}</h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: T.text2, margin: 0 }}>{user?.department || 'No department set'}</p>
          </div>
        </div>
      </div>

      {/* ââââ Info strip (students) ââââ */}
      {isStudent && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { label: 'Department',    value: user?.department },
            { label: 'Year / Tenure', value: user?.year },
            { label: 'Roll Number',   value: user?.roll_no },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>{label}</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: T.text1, margin: 0, lineHeight: 1.3 }}>{value || 'ââ'}</p>
            </div>
          ))}
        </div>
      )}

      {/* ââââ Stats row (students) ââââ */}
      {isStudent && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* CGPA display */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -10, right: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(192,193,255,0.05)', pointerEvents: 'none' }} />
            <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>Academic Performance</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: T.primary, fontFamily: "'Manrope','Inter',sans-serif", lineHeight: 1 }}>
                {user?.cgpa != null ? Number(user.cgpa).toFixed(2) : 'ââ'}
              </span>
              {user?.cgpa != null && <span style={{ fontSize: 13, color: T.text3, fontWeight: 300 }}>&nbsp;/ 10.0</span>}
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, color: T.secondary, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M7.247 4.86l-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/></svg>
              CGPA
            </p>
          </div>
          {/* Account info */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '18px 20px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Account Info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>Email</span>
                <span style={{ fontSize: 12, color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{user?.email}</span>
              </div>
              {user?.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.text3 }}>Phone</span>
                  <span style={{ fontSize: 12, color: T.text2 }}>{user.phone}</span>
                </div>
              )}
              {user?.roll_no && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: T.text3 }}>Roll No</span>
                  <span style={{ fontSize: 12, color: T.text2 }}>{user.roll_no}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Non-student account info */}
      {!isStudent && (
        <div style={card}>
          <p style={sectionTitle}>Account Info</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: T.text3 }}>Email</span>
              <span style={{ fontSize: 13, color: T.text2 }}>{user?.email}</span>
            </div>
            {user?.phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: T.text3 }}>Phone</span>
                <span style={{ fontSize: 13, color: T.text2 }}>{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ââââ Edit: name + CGPA only ââââ */}
      <div style={card}>
        <p style={sectionTitle}>Edit Profile</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Display name</label>
            <input value={name} onChange={e => { setName(e.target.value); markEdited(); }}
              placeholder="Your name" style={inp}
              onFocus={e => e.target.style.borderColor = T.primary}
              onBlur={e => e.target.style.borderColor = T.border} />
          </div>
          {isStudent && (
            <div>
              <label style={lbl}>CGPA</label>
              <input type="number" min="0" max="10" step="0.01" value={cgpa}
                onChange={e => { setCgpa(e.target.value); markEdited(); }}
                placeholder="e.g. 8.75" style={inp}
                onFocus={e => e.target.style.borderColor = T.primary}
                onBlur={e => e.target.style.borderColor = T.border} />
              <p style={{ fontSize: 11, color: T.text3, margin: '6px 0 0', fontWeight: 300 }}>Year and department are managed by your institution.</p>
            </div>
          )}
        </div>
      </div>

      {/* ââââ Student lists ââââ */}
      {isStudent && (
        <>
          <div style={card}>
            <SectionList label="Achievements" accentColor={T.primary} accentLo={T.primaryLo}
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935z"/></svg>}
              items={achievements}
              onAdd={() => openAdd('achievement')}
              onEdit={(i) => openEdit('achievement', i)}
              onDelete={(i) => handleDelete('achievement', i)} />
          </div>
          <div style={card}>
            <SectionList label="Internships" accentColor={T.secondary} accentLo={T.secondaryLo}
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5zm1.886 6.914L15 7.151V12.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V7.15l6.614 1.764a1.5 1.5 0 0 0 .772 0zM1.5 4h13a.5.5 0 0 1 .5.5v1.616L8.129 7.948a.5.5 0 0 1-.258 0L1 6.116V4.5a.5.5 0 0 1 .5-.5z"/></svg>}
              items={internships}
              onAdd={() => openAdd('internship')}
              onEdit={(i) => openEdit('internship', i)}
              onDelete={(i) => handleDelete('internship', i)} />
          </div>
          <div style={card}>
            <SectionList label="Certificates" accentColor={T.green} accentLo={T.greenLo}
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/><path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/></svg>}
              items={certificates}
              onAdd={() => openAdd('certificate')}
              onEdit={(i) => openEdit('certificate', i)}
              onDelete={(i) => handleDelete('certificate', i)} />
          </div>
        </>
      )}

      {/* Sticky save */}
      {anyEdited && (
        <button onClick={handleSave} disabled={saving}
          style={{ position: 'sticky', bottom: 16, width: '100%', padding: '13px', borderRadius: 12, background: T.primary, border: 'none', color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1, boxShadow: '0 8px 32px rgba(192,193,255,0.25)', zIndex: 10, transition: 'opacity 0.15s' }}>
          {saving ? 'Savingâ¦' : 'Save changes'}
        </button>
      )}

      {/* Modals */}
      {modal?.type === 'achievement' && (
        <AchievementModal
          initial={modal.index !== null ? achievements[modal.index] : null}
          onClose={closeModal}
          onSave={(data) => handleSaveEntry('achievement', data)} />
      )}
      {modal?.type === 'internship' && (
        <InternshipModal
          initial={modal.index !== null ? internships[modal.index] : null}
          onClose={closeModal}
          onSave={(data) => handleSaveEntry('internship', data)} />
      )}
      {modal?.type === 'certificate' && (
        <CertificateModal
          initial={modal.index !== null ? certificates[modal.index] : null}
          onClose={closeModal}
          onSave={(data) => handleSaveEntry('certificate', data)} />
      )}
    </div>
  );
}

// -- Section: Security -----------------------------------
function SecuritySection({ addToast }) {
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (pwForm.next.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await profileAPI.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      addToast({ type: 'success', message: 'Password changed.' });
    } catch (err) { setError(err.response?.data?.error || 'Failed to change password.'); }
    finally { setSaving(false); }
  };

  const PwInput = ({ field, placeholder }) => (
    <div style={{ position: 'relative' }}>
      <input type={showPw[field] ? 'text' : 'password'} value={pwForm[field]}
        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder} style={{ ...inp, paddingRight: 40 }}
        onFocus={e => e.target.style.borderColor = T.primary}
        onBlur={e => e.target.style.borderColor = T.border} />
      <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.text3, lineHeight: 0 }}>
        {showPw[field]
          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    </div>
  );

  return (
    <div style={card}>
      <p style={sectionTitle}>Change Password</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div><label style={lbl}>Current password</label><PwInput field="current" placeholder="Enter current password"/></div>
        <div><label style={lbl}>New password</label><PwInput field="next" placeholder="At least 6 characters"/></div>
        <div><label style={lbl}>Confirm new password</label><PwInput field="confirm" placeholder="Repeat new password"/></div>
        {error && <p style={{ fontSize: 12, color: T.danger, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={saving || !pwForm.current || !pwForm.next || !pwForm.confirm}
          style={{ padding: '11px', borderRadius: 10, background: pwForm.current && pwForm.next && pwForm.confirm ? T.primary : T.bg, border: `1px solid ${pwForm.current && pwForm.next && pwForm.confirm ? T.primary : T.border}`, color: pwForm.current && pwForm.next && pwForm.confirm ? '#131313' : T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
          {saving ? 'Updatingâ¦' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

// -- Section: Personalise --------------------------------
function PersonaliseSection() {
  const { dark, toggle } = useTheme();
  const [notifSound,   setNotifSound]   = useState(() => localStorage.getItem('notif_sound')   !== 'off');
  const [notifBadge,   setNotifBadge]   = useState(() => localStorage.getItem('notif_badge')   !== 'off');
  const [notifDesktop, setNotifDesktop] = useState(() => localStorage.getItem('notif_desktop') === 'on');
  const { addToast } = useToast();

  const toggleNotif = (key, val, setter) => { setter(val); localStorage.setItem(key, val ? 'on' : 'off'); };
  const requestDesktop = async (val) => {
    if (val && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') { addToast({ type: 'error', message: 'Desktop notifications blocked.' }); return; }
    }
    toggleNotif('notif_desktop', val, setNotifDesktop);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        <p style={sectionTitle}>Appearance</p>
        <Toggle on={dark} onToggle={toggle} label="Dark mode" sub="Switch between dark and light theme"/>
      </div>
      <div style={card}>
        <p style={sectionTitle}>Notifications</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Toggle on={notifSound}   onToggle={() => toggleNotif('notif_sound',   !notifSound,   setNotifSound)}   label="Message sounds"       sub="Play a sound for new messages"/>
          <div style={divider}/>
          <Toggle on={notifBadge}   onToggle={() => toggleNotif('notif_badge',   !notifBadge,   setNotifBadge)}   label="Unread badges"         sub="Show unread count indicators"/>
          <div style={divider}/>
          <Toggle on={notifDesktop} onToggle={() => requestDesktop(!notifDesktop)}                                label="Desktop notifications" sub="Browser push notifications"/>
        </div>
      </div>
    </div>
  );
}

// -- Sidebar nav -----------------------------------------
export function SettingsSidebar({ activeSection, onSection, onViewProfile, onViewFullProfile }) {
  const { user } = useAuth();
  const NAV = [
    { key: 'account',     label: 'Account',    icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm-7 8a7 7 0 0 1 14 0' },
    { key: 'security',    label: 'Security',   icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { key: 'personalise', label: 'Personalise', icon: 'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <button onClick={() => (onViewFullProfile ?? onViewProfile)?.(user?.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', borderBottom: `1px solid ${T.border}` }}
        onMouseEnter={e => e.currentTarget.style.background = T.primaryLo}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarBg(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
          {ini(user?.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: T.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
          <p style={{ fontSize: 11, fontWeight: 300, color: T.text3, margin: '2px 0 0', textTransform: 'capitalize' }}>{user?.role}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ color: T.text3, flexShrink: 0 }}>
          <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>

      <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const isActive = activeSection === item.key;
          return (
            <button key={item.key} onClick={() => onSection(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', position: 'relative', background: isActive ? T.primaryLo : 'none', color: isActive ? T.primary : T.text2 }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(192,193,255,0.06)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none'; }}>
              {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: '0 2px 2px 0', background: T.primary }}/>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={item.icon}/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: isActive ? 500 : 300 }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '10px', borderTop: `1px solid ${T.border}`, paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
        <SignOutButton />
      </div>
    </div>
  );
}

function SignOutButton() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Sidebar button */}
      <button onClick={() => setOpen(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', borderRadius: 12, border: `1px solid ${T.border}`,
          cursor: 'pointer', background: T.card, color: T.text2,
          transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.danger}60`; e.currentTarget.style.color = T.danger; e.currentTarget.style.background = T.dangerLo; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; e.currentTarget.style.background = T.card; }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
        <span style={{ fontSize: 13, fontWeight: 400 }}>Sign out</span>
      </button>

      {/* Confirmation modal */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
        }} className="modal-backdrop" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="modal-content" style={{
            background: '#1A1A1A', border: '1px solid #2A2A2A',
            borderRadius: 24, padding: '40px 32px 32px',
            width: '100%', maxWidth: 360, textAlign: 'center',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}>
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: '#252525', border: '1px solid #333',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', color: T.primary,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </div>

            <h3 style={{ fontSize: 22, fontWeight: 700, color: T.text1, margin: '0 0 12px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
              Signing out?
            </h3>
            <p style={{ fontSize: 13, fontWeight: 300, color: T.text3, margin: '0 0 32px', lineHeight: 1.7 }}>
              Are you sure you want to end your current session? Your data will be preserved.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setOpen(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  background: '#252525', border: '1px solid #333',
                  color: T.text2, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2E2E2E'; e.currentTarget.style.color = T.text1; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#252525'; e.currentTarget.style.color = T.text2; }}>
                Cancel
              </button>
              <button onClick={logout}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12,
                  background: 'rgba(192,193,255,0.15)', border: '1px solid rgba(192,193,255,0.25)',
                  color: T.primary, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,193,255,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,193,255,0.15)'; }}>
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// -- Main panel ------------------------------------------
export default function SettingsPanel({ activeSection, onDirtyChange }) {
  const { user, login, token } = useAuth();
  const { addToast } = useToast();

  const empty = (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${T.primaryLo} 0%, transparent 65%)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: `${T.primary}60`, margin: '0 auto 12px', display: 'block' }}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <p style={{ color: T.text3, fontSize: 13, fontWeight: 300, margin: 0 }}>Select a setting from the sidebar</p>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', background: T.bg, fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: `radial-gradient(ellipse at top right, ${T.primaryLo} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }}/>
      {!activeSection && empty}
      {activeSection && (
        <div style={{ maxWidth: 620, margin: '0 auto', width: '100%', padding: '32px 24px 60px', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', zIndex: 1 }} className="section-enter">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text1, margin: '0 0 22px', textTransform: 'capitalize', fontFamily: "'Manrope','Inter',sans-serif", letterSpacing: '-0.01em' }}>{activeSection}</h2>
          {activeSection === 'account'     && <AccountSection user={user} login={login} token={token} addToast={addToast} onDirtyChange={onDirtyChange}/>}
          {activeSection === 'security'    && <SecuritySection addToast={addToast}/>}
          {activeSection === 'personalise' && <PersonaliseSection/>}        </div>
      )}
    </div>
  );
}
