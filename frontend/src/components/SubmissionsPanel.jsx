import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { submissionsAPI, quizzesAPI } from '../services/api';
import QuizBuilder from './QuizBuilder';
import ConfirmDialog from './ui/ConfirmDialog';
import FilePreviewModal from './ui/FilePreviewModal';

// ── Design system from brand palette ──────────────────
const C = {
  bg:       '#131313',
  surface:  '#1A1A1A',
  card:     '#1F1F1F',
  cardHi:   '#252525',
  border:   '#2A2A2A',
  borderHi: '#383838',
  primary:      '#C0C1FF',
  primaryDim:   'rgba(192,193,255,0.15)',
  primaryBorder:'rgba(192,193,255,0.25)',
  secondary:    '#FFB38E',
  secondaryDim: 'rgba(255,179,142,0.15)',
  green:    '#22C55E',
  greenDim: 'rgba(34,197,94,0.14)',
  red:      '#EF4444',
  redDim:   'rgba(239,68,68,0.14)',
  amber:    '#F59E0B',
  amberDim: 'rgba(245,158,11,0.14)',
  t1: '#F0F0F0',
  t2: '#9E9E9E',
  t3: '#555555',
  t4: '#333333',
};

const FF = "'Inter', sans-serif";
const FM = "'Manrope', 'Inter', sans-serif";

const fmt     = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const isPast  = (d) => d && new Date(d) < new Date();

// ── Shared input ───────────────────────────────────────
const inp = {
  width: '100%', background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.t1,
  outline: 'none', fontFamily: FF, boxSizing: 'border-box', transition: 'border-color 0.15s',
};

// ── Icon badge (square rounded icon container) ─────────
function IconBadge({ color, dim, children }) {
  return (
    <div style={{ width: 38, height: 38, borderRadius: 10, background: dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}22` }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>{children}</svg>
    </div>
  );
}

// ── Status pill ────────────────────────────────────────
function Pill({ label, color, dim }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: dim, border: `1px solid ${color}35`, fontSize: 10, fontWeight: 600, color, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

// ── Outlined button ────────────────────────────────────
function OutlineBtn({ onClick, children, color = C.t2, hoverColor = C.primary, style: s = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: `1px solid ${hov ? hoverColor : C.border}`, background: 'none', color: hov ? hoverColor : color, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: FF, transition: 'all 0.15s', ...s }}>
      {children}
    </button>
  );
}

// ── Primary button ─────────────────────────────────────
function PrimaryBtn({ onClick, type = 'button', disabled, children, color = C.primary, textColor = '#131313', style: s = {} }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: color, color: textColor, fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: FF, opacity: disabled ? 0.55 : 1, transition: 'opacity 0.15s', letterSpacing: '0.02em', ...s }}>
      {children}
    </button>
  );
}

// ── Modal shell ────────────────────────────────────────
function Modal({ title, onClose, maxWidth = 500, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.t1, fontFamily: FM }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, lineHeight: 0, padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1} onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</label>
      {children}
    </div>
  );
}

// ── Create Assignment Modal ────────────────────────────
function CreateModal({ groupId, onCreated, onClose }) {
  const [form, setForm] = useState({ title: '', description: '', due_date: '', due_time: '', allow_offline: false });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.due_date) return;
    setLoading(true);
    try {
      const due_date = new Date(`${form.due_date}T${form.due_time || '23:59'}`).toISOString();
      const res = await submissionsAPI.create(groupId, { title: form.title, description: form.description, due_date, allow_offline: form.allow_offline });
      onCreated(res.data);
      addToast({ type: 'success', message: 'Assignment created' });
    } catch { addToast({ type: 'error', message: 'Failed to create assignment' }); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="New Assignment" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Title *">
          <input style={inp} placeholder="e.g. Lab Report #04" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} placeholder="Instructions or details…"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Due Date *">
            <input type="date" style={inp} value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} required
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
          <Field label="Due Time">
            <input type="time" style={inp} value={form.due_time}
              onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
        </div>
        {/* Offline toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.t1, margin: 0 }}>Allow offline submission</p>
            <p style={{ fontSize: 11, color: C.t3, margin: '2px 0 0' }}>Students submit physically; teacher marks them as submitted</p>
          </div>
          <button type="button" onClick={() => setForm(f => ({ ...f, allow_offline: !f.allow_offline }))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.allow_offline ? C.green : C.border, transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: form.allow_offline ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
          <PrimaryBtn type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Assignment'}</PrimaryBtn>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Assignment Modal ──────────────────────────────
function EditAssignmentModal({ item, groupId, onUpdated, onClose }) {
  const toDateInput = (iso) => iso ? iso.slice(0, 10) : '';
  const toTimeInput = (iso) => iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  const [form, setForm] = useState({
    title: item.title,
    description: item.description || '',
    due_date: toDateInput(item.due_date),
    due_time: toTimeInput(item.due_date),
    allow_offline: item.allow_offline || false,
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.due_date) return;
    setLoading(true);
    try {
      const due_date = new Date(`${form.due_date}T${form.due_time || '23:59'}`).toISOString();
      const res = await submissionsAPI.update(groupId, item.id, { title: form.title, description: form.description, due_date, allow_offline: form.allow_offline });
      onUpdated(res.data);
      addToast({ type: 'success', message: 'Assignment updated' });
    } catch { addToast({ type: 'error', message: 'Failed to update' }); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Assignment" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Title *">
          <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inp, resize: 'vertical', minHeight: 72 }} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Due Date *">
            <input type="date" style={inp} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} required
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
          <Field label="Due Time">
            <input type="time" style={inp} value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.t1, margin: 0 }}>Allow offline submission</p>
            <p style={{ fontSize: 11, color: C.t3, margin: '2px 0 0' }}>Students submit physically; teacher marks them as submitted</p>
          </div>
          <button type="button" onClick={() => setForm(f => ({ ...f, allow_offline: !f.allow_offline }))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.allow_offline ? C.green : C.border, transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: form.allow_offline ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
          <PrimaryBtn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</PrimaryBtn>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Quiz Modal (info only, no questions) ──────────
function EditQuizModal({ item, groupId, onUpdated, onClose }) {
  const toDateInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const toTimeInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [form, setForm] = useState({
    title: item.title,
    description: item.description || '',
    duration_mins: item.duration_mins,
    start_date: toDateInput(item.starts_at),
    start_time: toTimeInput(item.starts_at),
    end_date: toDateInput(item.ends_at),
    end_time: toTimeInput(item.ends_at),
    show_score: item.show_score !== false,
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_date || !form.end_date) return;
    const starts_at = new Date(`${form.start_date}T${form.start_time || '00:00'}`).toISOString();
    const ends_at   = new Date(`${form.end_date}T${form.end_time || '23:59'}`).toISOString();
    if (new Date(ends_at) <= new Date(starts_at)) { addToast({ type: 'error', message: 'Closing date/time must be after opening date/time' }); return; }
    setLoading(true);
    try {
      const res = await quizzesAPI.update(groupId, item.id, {
        title: form.title, description: form.description,
        duration_mins: Number(form.duration_mins), starts_at, ends_at,
        show_score: form.show_score,
      });
      onUpdated(res.data);
      addToast({ type: 'success', message: 'Quiz updated' });
    } catch { addToast({ type: 'error', message: 'Failed to update quiz' }); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Quiz" onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit} style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Title *">
          <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <Field label="Duration (minutes) *">
          <input type="number" min="1" max="180" style={{ ...inp, width: 120 }} value={form.duration_mins}
            onChange={e => setForm(f => ({ ...f, duration_mins: e.target.value }))}
            onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.t1, margin: 0 }}>Show score to students</p>
            <p style={{ fontSize: 11, color: C.t3, margin: '2px 0 0' }}>Students will see their score after submitting</p>
          </div>
          <button type="button" onClick={() => setForm(f => ({ ...f, show_score: !f.show_score }))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.show_score ? C.green : C.border, transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: form.show_score ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Opens Date *">
            <input type="date" style={inp} value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
          <Field label="Opens Time">
            <input type="time" style={inp} value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
          <Field label="Closes Date *">
            <input type="date" style={inp} value={form.end_date}
              min={form.start_date || undefined}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
          <Field label="Closes Time">
            <input type="time" style={inp} value={form.end_time}
              min={form.end_date && form.end_date === form.start_date ? (form.start_time || undefined) : undefined}
              onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
          <PrimaryBtn type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</PrimaryBtn>
        </div>
      </form>
    </Modal>
  );
}

// ── Submit Modal (student) ─────────────────────────────
function SubmitModal({ assignment, groupId, onDone, onClose }) {
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const past = isPast(assignment.due_date);
  const isOffline = !!assignment.allow_offline;
  const dueLabel = (() => {
    const d = new Date(assignment.due_date);
    const now = new Date();
    const diffMs = d - now;
    const diffH = Math.floor(diffMs / 3600000);
    if (past) return `Was due ${fmtDate(assignment.due_date)}`;
    if (diffH < 24) return `Due Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    return `Due ${fmt(assignment.due_date)}`;
  })();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|docx|zip)$/i)) {
      addToast({ type: 'error', message: 'Only PDF, DOCX, or ZIP files allowed' }); return;
    }
    if (f.size > 50 * 1024 * 1024) { addToast({ type: 'error', message: 'File must be under 50MB' }); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let fileData = {};
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await submissionsAPI.uploadFile(groupId, assignment.id, formData);
        fileData = uploadRes.data;
      }
      await submissionsAPI.submit(groupId, assignment.id, { note, ...fileData });
      addToast({ type: 'success', message: 'Submitted successfully' });
      onDone();
    } catch (err) {
      addToast({ type: 'error', message: err?.response?.data?.error || 'Submission failed' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: '#1C1C1C', border: `1px solid ${C.border}`, borderRadius: 16, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '24px 28px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.t1, margin: '0 0 5px', fontFamily: FM, letterSpacing: '-0.01em' }}>
              {assignment.my_submissions > 0 ? 'Resubmit' : 'Submit'}: {assignment.title}
            </h2>
            <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>
              {assignment.description && <>{assignment.description} · </>}
              <span style={{ color: past ? C.red : C.amber }}>{dueLabel}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.t3, lineHeight: 0, padding: 4, flexShrink: 0, marginTop: 2 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1} onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {isOffline ? (
            /* Offline assignment — no upload needed */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 20px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" viewBox="0 0 16 16" fill={C.green}><path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm6.5 4.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 10.293V6.5a.5.5 0 0 1 1 0z"/></svg>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.t1, margin: 0, textAlign: 'center' }}>This is an offline assignment</p>
              <p style={{ fontSize: 12, color: C.t3, margin: 0, textAlign: 'center', lineHeight: 1.6 }}>Submit your work physically to the teacher. Once received, the teacher will mark you as submitted here.</p>
            </div>
          ) : (
            <>
              {/* Upload zone */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 10 }}>Upload Documents</label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('submit-file-input').click()}
                  style={{ border: `1.5px dashed ${dragging ? C.primary : file ? C.green : C.border}`, borderRadius: 12, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: dragging ? C.primaryDim : file ? C.greenDim : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: file ? C.greenDim : C.primaryDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {file
                      ? <svg width="22" height="22" viewBox="0 0 16 16" fill={C.green}><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>
                      : <svg width="22" height="22" viewBox="0 0 16 16" fill={C.primary}><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>
                    }
                  </div>
                  {file ? (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.green, margin: 0 }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 500, color: C.t1, margin: 0 }}>Click or drag to upload assignment</p>
                      <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>PDF, DOCX, or ZIP files (max 50MB)</p>
                    </>
                  )}
                </div>
                <input id="submit-file-input" type="file" accept=".pdf,.docx,.zip" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 10 }}>Additional Notes (Optional)</label>
                <textarea
                  style={{ ...inp, resize: 'vertical', minHeight: 100, background: '#161616' }}
                  placeholder="Mention any specific details about your submission..."
                  value={note} onChange={e => setNote(e.target.value)}
                  onFocus={e => e.target.style.borderColor = C.primary}
                  onBlur={e => e.target.style.borderColor = C.border} />
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'none', color: C.t2, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FF }}>
              {isOffline ? 'Close' : 'Cancel'}
            </button>
            {!isOffline && (
              <button type="submit" disabled={loading}
                style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.primary}, #9899e8)`, color: '#131313', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FF, opacity: loading ? 0.7 : 1, letterSpacing: '0.01em' }}>
                {loading ? 'Submitting…' : 'Submit Assignment'}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        {!isOffline && (
        <div style={{ padding: '12px 28px', background: 'rgba(192,193,255,0.04)', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill={C.amber}><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.amber, letterSpacing: '0.08em' }}>Note: The latest submission will override the previous submission.</span>
        </div>
        )}
      </div>
    </div>
  );
}

// ── Report table (shared by assignment + quiz) ─────────
function ReportTable({ headers, rows, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
          {headers.map(h => (
            <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

// ── Assignment Report Modal ────────────────────────────
function ReportModal({ assignment, groupId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [marking, setMarking] = useState(null); // userId being marked
  const { addToast } = useToast();
  const isOffline = !!assignment.allow_offline;

  useEffect(() => {
    submissionsAPI.report(groupId, assignment.id).then(r => setReport(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [groupId, assignment.id]);

  const handleMarkOffline = async (userId, currentlySubmitted) => {
    setMarking(userId);
    const mark = !currentlySubmitted;
    try {
      await submissionsAPI.markOffline(groupId, assignment.id, userId, mark);
      setReport(r => r.map(s => s.id === userId
        ? { ...s, submitted: mark, offline: mark, last_submitted_at: mark ? new Date().toISOString() : null }
        : s
      ));
      addToast({ type: 'success', message: mark ? 'Marked as submitted' : 'Submission removed' });
    } catch { addToast({ type: 'error', message: 'Failed to update' }); }
    finally { setMarking(null); }
  };

  const downloadCSV = () => {
    if (!report) return;
    const rows = [['Name', 'Roll No.', 'Status', 'Attempts', 'Submitted At', 'File', 'Note']];
    report.forEach(r => rows.push([
      r.name, r.roll_no,
      r.submitted ? (r.is_overdue ? 'Overdue' : 'Submitted') : 'Not Submitted',
      r.attempts, fmtDate(r.last_submitted_at), r.file_name || '—', r.note || ''
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${assignment.title.replace(/\s+/g, '_')}_report.csv`;
    a.click();
  };

  const submitted = report?.filter(r => r.submitted).length || 0;
  const total = report?.length || 0;

  return (
    <>
      <Modal title={assignment.title} onClose={onClose} maxWidth={860}>
        <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: C.t3, flex: 1 }}>Due: {fmt(assignment.due_date)}</span>
          {!loading && <Pill label={`${submitted} / ${total} submitted`} color={C.primary} dim={C.primaryDim} />}
          <OutlineBtn onClick={downloadCSV} hoverColor={C.green}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
            Export CSV
          </OutlineBtn>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Name', 'Roll No.', 'Status', 'Attempts', 'Submitted At', ...(isOffline ? [] : ['Submission', 'Note']), ...(isOffline ? ['Action'] : [])].map(h => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report?.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
                    <td style={{ padding: '11px 18px', color: C.t1, fontWeight: 500 }}>{r.name}</td>
                    <td style={{ padding: '11px 18px', color: C.t2 }}>{r.roll_no}</td>
                    <td style={{ padding: '11px 18px' }}>
                      <Pill
                        label={r.submitted ? (r.is_overdue ? 'Overdue' : 'Submitted') : 'Not Submitted'}
                        color={r.submitted ? (r.is_overdue ? C.amber : C.green) : C.red}
                        dim={r.submitted ? (r.is_overdue ? C.amberDim : C.greenDim) : C.redDim}
                      />
                    </td>
                    <td style={{ padding: '11px 18px', color: C.t2, textAlign: 'center' }}>{r.attempts}</td>
                    <td style={{ padding: '11px 18px', color: C.t3, whiteSpace: 'nowrap' }}>{fmtDate(r.last_submitted_at)}</td>
                    {!isOffline && (
                      <>
                        {/* Submission file */}
                        <td style={{ padding: '11px 18px' }}>
                          {r.file_url ? (
                            <button
                              onClick={() => setPreviewFile({ file_url: r.file_url, filename: r.file_name, file_type: r.file_type, size_bytes: r.file_size, users: { name: r.name } })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, border: `1px solid ${C.primaryBorder}`, background: C.primaryDim, color: C.primary, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: FF, transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,193,255,0.22)'}
                              onMouseLeave={e => e.currentTarget.style.background = C.primaryDim}>
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
                              View
                            </button>
                          ) : <span style={{ color: C.t4, fontSize: 11 }}>—</span>}
                        </td>
                        {/* Note */}
                        <td style={{ padding: '11px 18px', color: C.t2, maxWidth: 200 }}>
                          {r.note
                            ? <span style={{ fontSize: 11, color: C.t2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 180 }} title={r.note}>{r.note}</span>
                            : <span style={{ color: C.t4, fontSize: 11 }}>—</span>}
                        </td>
                      </>
                    )}
                    {isOffline && (
                      <td style={{ padding: '11px 18px' }}>
                        {r.submitted ? (
                          <button
                            disabled={marking === r.id}
                            onClick={() => handleMarkOffline(r.id, true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: `1px solid rgba(239,68,68,0.3)`, background: C.redDim, color: C.red, fontSize: 10, fontWeight: 600, cursor: marking === r.id ? 'not-allowed' : 'pointer', fontFamily: FF, opacity: marking === r.id ? 0.6 : 1 }}>
                            {marking === r.id ? 'Updating…' : 'Unmark'}
                          </button>
                        ) : (
                          <button
                            disabled={marking === r.id}
                            onClick={() => handleMarkOffline(r.id, false)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: `1px solid ${C.greenDim}`, background: C.greenDim, color: C.green, fontSize: 10, fontWeight: 600, cursor: marking === r.id ? 'not-allowed' : 'pointer', fontFamily: FF, opacity: marking === r.id ? 0.6 : 1 }}>
                            {marking === r.id ? 'Updating…' : 'Mark Submitted'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} canDelete={false} />
      )}
    </>
  );
}

// ── Quiz Report Modal ──────────────────────────────────
function QuizReportModal({ quiz, groupId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quizzesAPI.report(groupId, quiz.id).then(r => setReport(r.data)).catch(console.error).finally(() => setLoading(false));
  }, [groupId, quiz.id]);

  const downloadCSV = () => {
    if (!report) return;
    const rows = [['Name', 'Roll No.', 'Completed', 'Score', 'Submitted At']];
    report.forEach(r => rows.push([r.name, r.roll_no, r.completed ? 'Yes' : 'No', r.score != null ? `${r.score}/${r.total}` : '—', fmtDate(r.submitted_at)]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${quiz.title.replace(/\s+/g, '_')}_quiz_report.csv`;
    a.click();
  };

  const completed = report?.filter(r => r.completed).length || 0;
  const total = report?.length || 0;

  return (
    <Modal title={quiz.title} onClose={onClose} maxWidth={680}>
      <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: C.t3, flex: 1 }}>{quiz.duration_mins} min · Closes {fmtDate(quiz.ends_at)}</span>
        {!loading && <Pill label={`${completed} / ${total} completed`} color={C.primary} dim={C.primaryDim} />}
        <OutlineBtn onClick={downloadCSV} hoverColor={C.green}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
          Export CSV
        </OutlineBtn>
      </div>
      <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        <ReportTable loading={loading} headers={['Name', 'Roll No.', 'Status', 'Score', 'Submitted At']}
          rows={report?.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? 'rgba(255,255,255,0.012)' : 'transparent' }}>
              <td style={{ padding: '11px 18px', color: C.t1, fontWeight: 500 }}>{r.name}</td>
              <td style={{ padding: '11px 18px', color: C.t2 }}>{r.roll_no}</td>
              <td style={{ padding: '11px 18px' }}>
                <Pill label={r.completed ? 'Completed' : 'Pending'} color={r.completed ? C.green : C.t3} dim={r.completed ? C.greenDim : 'rgba(85,85,85,0.12)'} />
              </td>
              <td style={{ padding: '11px 18px', color: C.primary, fontWeight: 600 }}>
                {r.score != null ? (
                  <>{r.score}/{r.total}<span style={{ fontSize: 10, color: C.t3, marginLeft: 6 }}>({Math.round((r.score / r.total) * 100)}%)</span></>
                ) : '—'}
              </td>
              <td style={{ padding: '11px 18px', color: C.t3 }}>{fmtDate(r.submitted_at)}</td>
            </tr>
          ))} />
      </div>
    </Modal>
  );
}

// ── Quiz Builder Modal wrapper ─────────────────────────
function QuizBuilderModal({ groupId, onCreated, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 620, margin: 'auto' }} onClick={e => e.stopPropagation()}>
        <QuizBuilder groupId={groupId} onCreated={onCreated} onCancel={onClose} />
      </div>
    </div>
  );
}

// ── Row item (assignment or quiz) ──────────────────────
function ItemRow({ icon, iconColor, iconDim, title, subtitle, col1, col2, col3, statusPill, actions, isLast }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '14px 20px', borderBottom: isLast ? 'none' : `1px solid ${C.border}`, background: hov ? C.cardHi : 'transparent', transition: 'background 0.12s' }}>
      {/* Icon + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
        <IconBadge color={iconColor} dim={iconDim}>{icon}</IconBadge>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.t1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11, color: C.t3, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>}
        </div>
      </div>
      {/* col1 */}
      <div style={{ width: 120, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: C.t2, whiteSpace: 'nowrap' }}>{col1}</span>
      </div>
      {/* col2 */}
      <div style={{ width: 120, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: C.t2, whiteSpace: 'nowrap' }}>{col2}</span>
      </div>
      {/* col3 (optional) */}
      {col3 !== undefined && (
        <div style={{ width: 90, flexShrink: 0 }}>{col3}</div>
      )}
      {/* Status — wider so pill doesn't overlap */}
      <div style={{ width: 140, flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>{statusPill}</div>
      {/* Actions */}
      <div style={{ width: 160, flexShrink: 0, display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>{actions}</div>
    </div>
  );
}

// ── Three-dot dropdown menu ────────────────────────────
function DotsMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: 'none', cursor: 'pointer', color: C.t3, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.color = C.t1; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.t3; }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 32, zIndex: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, minWidth: 130, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {items.map(({ label, color = C.t1, onClick }) => (
            <button key={label} onClick={() => { setOpen(false); onClick(); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 7, border: 'none', background: 'none', color, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: FF, transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = C.cardHi}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Assignment row ─────────────────────────────────────
function AssignmentRow({ item, isTeacher, onDelete, onSubmit, onReport, onEdit, onClose, onViewSubmission, isLast }) {
  const past     = isPast(item.due_date);
  const isClosed = !!item.closed_at;
  const isOffline = !!item.allow_offline;
  const used     = item.my_submissions || 0;
  const overdueSubmit = item.my_overdue || false;
  const attemptsLeft  = 2 - used;
  const canSubmit = !isTeacher && !isOffline && attemptsLeft > 0 && !isClosed;

  // ── Student status pill ──
  let statusPill;
  if (isTeacher) {
    statusPill = isClosed
      ? <Pill label="Closed" color={C.t3} dim="rgba(85,85,85,0.12)" />
      : past
        ? <Pill label="Overdue" color={C.red} dim={C.redDim} />
        : <Pill label="Open" color={C.amber} dim={C.amberDim} />;
  } else if (isOffline) {
    statusPill = used > 0
      ? <Pill label="Submitted (Offline)" color={C.green} dim={C.greenDim} />
      : <Pill label="Pending (Offline)" color={C.amber} dim={C.amberDim} />;
  } else if (isClosed) {
    if (used === 0) {
      statusPill = <Pill label="Not Submitted" color={C.red} dim={C.redDim} />;
    } else if (overdueSubmit) {
      statusPill = <Pill label="Overdue Submitted" color={C.amber} dim={C.amberDim} />;
    } else {
      statusPill = <Pill label="Submitted" color={C.green} dim={C.greenDim} />;
    }
  } else if (used >= 2) {
    statusPill = overdueSubmit
      ? <Pill label="Overdue Submitted" color={C.amber} dim={C.amberDim} />
      : <Pill label="Submitted" color={C.green} dim={C.greenDim} />;
  } else if (past) {
    statusPill = <Pill label="Overdue" color={C.red} dim={C.redDim} />;
  } else {
    statusPill = <Pill label="Pending" color={C.amber} dim={C.amberDim} />;
  }

  const subtitle = isTeacher ? (item.description || null) : (isOffline ? 'Offline submission' : null);

  const actions = isTeacher ? (
    <>
      <OutlineBtn onClick={() => onReport(item)} hoverColor={C.primary}>Report</OutlineBtn>
      {!isClosed && <OutlineBtn onClick={() => onClose(item.id)} hoverColor={C.t2} color={C.t3}>Close</OutlineBtn>}
      <DotsMenu items={[
        { label: 'Edit', onClick: () => onEdit(item) },
        { label: 'Delete', color: C.red, onClick: () => onDelete(item.id) },
      ]} />
    </>
  ) : isOffline ? (
    used > 0 ? null : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: C.amberDim, border: `1px solid ${C.amber}35`, color: C.amber, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>
        Submit offline to teacher
      </span>
    )
  ) : canSubmit ? (
    <PrimaryBtn onClick={() => onSubmit(item)} color={past ? C.amber : C.primary} style={{ width: 140, justifyContent: 'center' }}>
      {past ? 'Submit (Overdue)' : used > 0 ? 'Resubmit' : 'Submit'}
    </PrimaryBtn>
  ) : used > 0 && item.my_file_url ? (
    <OutlineBtn onClick={() => onViewSubmission(item)} hoverColor={C.primary} style={{ width: 140, justifyContent: 'center' }}>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>
      View Submission
    </OutlineBtn>
  ) : null;

  return (
    <ItemRow isLast={isLast}
      icon={<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3z"/>}
      iconColor={C.primary} iconDim={C.primaryDim}
      title={item.title} subtitle={subtitle}
      col1={fmtDate(item.due_date)}
      col2={isTeacher ? null : `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left`}
      col3={
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
          background: isOffline ? C.amberDim : C.primaryDim,
          color: isOffline ? C.amber : C.primary,
          border: `1px solid ${isOffline ? C.amber : C.primary}30`,
        }}>
          {isOffline ? 'Offline' : 'Online'}
        </span>
      }
      statusPill={statusPill} actions={actions} />
  );
}

// ── Quiz row ───────────────────────────────────────────
function QuizRow({ item, isTeacher, groupId, onDelete, onReport, onEdit, onClose, isLast }) {
  const now    = new Date().getTime();
  const starts = new Date(item.starts_at).getTime();
  const ends   = new Date(item.ends_at).getTime();
  const isClosed   = !!item.closed_at;
  const isLive     = !isClosed && now >= starts && now <= ends;
  const isUpcoming = !isClosed && now < starts;
  const attempted  = !!item.my_attempt;

  // Check if quiz is in-progress (tab was closed mid-quiz)
  const storageKey = `quiz_started_${item.id}`;
  const startedAt = !attempted ? localStorage.getItem(storageKey) : null;
  const inProgress = isLive && !attempted && !!startedAt;
  const remainingMins = inProgress
    ? Math.max(0, Math.ceil((item.duration_mins * 60 - Math.floor((now - Number(startedAt)) / 1000)) / 60))
    : null;

  const statusLabel = isClosed ? 'Closed' : isUpcoming ? 'Upcoming' : isLive ? 'Live' : 'Ended';
  const statusColor = isClosed ? C.t3 : isUpcoming ? C.amber : isLive ? C.green : C.t3;
  const statusDim   = isClosed ? 'rgba(85,85,85,0.12)' : isUpcoming ? C.amberDim : isLive ? C.greenDim : 'rgba(85,85,85,0.12)';

  const openQuiz = () => {
    const existing = window.open('', `quiz_${item.id}`);
    if (existing && (existing.location.href === 'about:blank' || existing.location.href.includes(`/quiz/${groupId}/${item.id}`))) {
      existing.location.href = `${window.location.origin}/quiz/${groupId}/${item.id}`;
      existing.focus();
    } else if (existing) {
      existing.focus();
    }
  };

  const actions = isTeacher ? (
    <>
      <OutlineBtn onClick={() => onReport(item)} hoverColor={C.primary}>Report</OutlineBtn>
      {!isClosed && <OutlineBtn onClick={() => onClose(item.id)} hoverColor={C.t2} color={C.t3}>Close</OutlineBtn>}
      <DotsMenu items={[
        { label: 'Edit', onClick: () => onEdit(item) },
        { label: 'Delete', color: C.red, onClick: () => onDelete(item.id) },
      ]} />
    </>
  ) : isLive && !attempted ? (
    inProgress
      ? <PrimaryBtn onClick={openQuiz} color={C.amber} style={{ width: 200, justifyContent: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber, boxShadow: `0 0 6px ${C.amber}`, display: 'inline-block', flexShrink: 0 }} />
          Quiz in Progress · {remainingMins}m left
        </PrimaryBtn>
      : <PrimaryBtn onClick={openQuiz} color={C.green} style={{ width: 140, justifyContent: 'center' }}>Start Quiz →</PrimaryBtn>
  ) : attempted ? (
    <Pill label="Completed" color={C.green} dim={C.greenDim} />
  ) : null;

  return (
    <ItemRow isLast={isLast}
      icon={<><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></>}
      iconColor={C.secondary} iconDim={C.secondaryDim}
      title={item.title} subtitle={`${item.duration_mins} min`}
      col1={fmtDate(item.starts_at)}
      col2={fmtDate(item.ends_at)}
      statusPill={<Pill label={statusLabel} color={statusColor} dim={statusDim} />}
      actions={actions} />
  );
}

// ── Stat card ──────────────────────────────────────────
function StatCard({ label, value, color, dim, icon }) {
  return (
    <div style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', right: -10, top: -10, width: 70, height: 70, borderRadius: '50%', background: dim, pointerEvents: 'none' }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill={color}>{icon}</svg>
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, fontFamily: FM, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 10, fontWeight: 600, color: C.t3, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────
function SectionHeader({ label, count, color, dim }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.14em', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: dim, color, border: `1px solid ${color}30` }}>{count}</span>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────
export default function SubmissionsPanel({ group }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [editAssignment, setEditAssignment]   = useState(null);
  const [editQuiz, setEditQuiz]               = useState(null);
  const [submitTarget, setSubmitTarget]       = useState(null);
  const [reportTarget, setReportTarget]       = useState(null);
  const [quizReportTarget, setQuizReportTarget] = useState(null);
  const [confirmAction, setConfirmAction]     = useState(null); // { type, id, label }
  const [studentPreviewFile, setStudentPreviewFile] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey(k => k + 1);

  // Listen for quiz completion from the quiz tab (cross-tab via localStorage)
  useEffect(() => {
    const handler = (e) => {
      if (!e.key?.startsWith('quiz_started_')) return;
      if (e.newValue !== null) return; // key was set, not removed
      const quizId = e.key.replace('quiz_started_', '');
      // Mark that quiz as attempted in local state so button flips to Completed
      setQuizzes(prev => prev.map(q =>
        q.id === quizId && !q.my_attempt
          ? { ...q, my_attempt: { submitted_at: new Date().toISOString() } }
          : q
      ));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    if (!group?.id) return;
    const controller = new AbortController();
    Promise.resolve().then(() => {
      setLoading(true);
      return Promise.all([submissionsAPI.list(group.id), quizzesAPI.list(group.id)]);
    }).then(([aRes, qRes]) => {
      if (!controller.signal.aborted) {
        setAssignments(aRes.data);
        setQuizzes(qRes.data);
        setLoading(false);
      }
    }).catch(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [group?.id, reloadKey]);

  const handleCreated     = (a) => { setAssignments(prev => [a, ...prev]); setShowCreate(false); };
  const handleQuizCreated = (q) => { setQuizzes(prev => [q, ...prev]); setShowQuizBuilder(false); };
  const handleAssignmentUpdated = (a) => { setAssignments(prev => prev.map(x => x.id === a.id ? a : x)); setEditAssignment(null); };
  const handleQuizUpdated       = (q) => { setQuizzes(prev => prev.map(x => x.id === q.id ? q : x)); setEditQuiz(null); };
  const handleSubmitDone  = () => { setSubmitTarget(null); load(); };
  const handleViewSubmission = (item) => {
    setStudentPreviewFile({
      file_url: item.my_file_url,
      filename: item.my_file_name || 'Submission',
      file_type: item.my_file_type || 'application/octet-stream',
      size_bytes: item.my_file_size,
      users: { name: 'My Submission' },
    });
  };

  const handleDelete    = (id) => setConfirmAction({ type: 'delete-assignment', id });
  const handleDeleteQuiz = (id) => setConfirmAction({ type: 'delete-quiz', id });
  const handleClose     = (id) => setConfirmAction({ type: 'close-assignment', id });
  const handleCloseQuiz = (id) => setConfirmAction({ type: 'close-quiz', id });

  const handleConfirmAction = async () => {
    const { type, id } = confirmAction;
    setConfirmAction(null);
    try {
      if (type === 'delete-assignment') {
        await submissionsAPI.delete(group.id, id);
        setAssignments(p => p.filter(a => a.id !== id));
        addToast({ type: 'success', message: 'Assignment deleted' });
      } else if (type === 'delete-quiz') {
        await quizzesAPI.delete(group.id, id);
        setQuizzes(p => p.filter(q => q.id !== id));
        addToast({ type: 'success', message: 'Quiz deleted' });
      } else if (type === 'close-assignment') {
        const res = await submissionsAPI.close(group.id, id);
        setAssignments(p => p.map(a => a.id === id ? res.data : a));
        addToast({ type: 'success', message: 'Assignment closed' });
      } else if (type === 'close-quiz') {
        const res = await quizzesAPI.close(group.id, id);
        setQuizzes(p => p.map(q => q.id === id ? res.data : q));
        addToast({ type: 'success', message: 'Quiz closed' });
      }
    } catch { addToast({ type: 'error', message: 'Action failed' }); }
  };
  // Stats
  const totalItems   = assignments.length + quizzes.length;
  // "Submitted" = any submission made (online or offline) + completed quizzes
  const submitted    = assignments.filter(a => (a.my_submissions || 0) > 0).length
                     + quizzes.filter(q => !!q.my_attempt).length;
  const liveQuizzes  = quizzes.filter(q => { const n = new Date().getTime(); return n >= new Date(q.starts_at).getTime() && n <= new Date(q.ends_at).getTime(); }).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, fontFamily: FF, overflow: 'hidden' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Top bar ── */}
      <div style={{ padding: '24px 28px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexShrink: 0, background: C.surface }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.secondary, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 4px' }}>
            {group?.subject || group?.name}
          </p>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: C.t1, margin: '0 0 4px', fontFamily: FM, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Assignment Track
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: C.t3, margin: 0 }}>Manage submissions and quizzes</p>
        </div>
        {isTeacher && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <OutlineBtn onClick={() => setShowCreate(true)}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
              Assignment
            </OutlineBtn>
            <PrimaryBtn onClick={() => setShowQuizBuilder(true)}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
              New Quiz
            </PrimaryBtn>
          </div>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${C.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Stat cards */}
            {!isTeacher && (
              <div style={{ display: 'flex', gap: 12 }}>
                <StatCard label="Total" value={totalItems} color={C.primary} dim={C.primaryDim}
                  icon={<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>} />
                <StatCard label="Submitted" value={submitted} color={C.green} dim={C.greenDim}
                  icon={<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>} />
                <StatCard label="Live Quizzes" value={liveQuizzes} color={C.secondary} dim={C.secondaryDim}
                  icon={<><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></>} />
              </div>
            )}

            {/* Empty state */}
            {assignments.length === 0 && quizzes.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, opacity: 0.45 }}>
                <svg width="36" height="36" viewBox="0 0 16 16" fill={C.t3}><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/></svg>
                <p style={{ fontSize: 14, color: C.t3, margin: 0 }}>{isTeacher ? 'No assignments or quizzes yet.' : 'Nothing here yet.'}</p>
              </div>
            )}

            {/* Quizzes table */}
            {quizzes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SectionHeader label="Quizzes" count={quizzes.length} color={C.secondary} dim={C.secondaryDim} />
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                      <div style={{ width: 38, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Assignment Name</span>
                    </div>
                    <div style={{ width: 120, flexShrink: 0 }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Opens</span></div>
                    <div style={{ width: 120, flexShrink: 0 }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Closes</span></div>
                    <div style={{ width: 140, flexShrink: 0 }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status</span></div>
                    <div style={{ width: 160, flexShrink: 0, textAlign: 'right' }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Actions</span></div>
                  </div>
                  {quizzes.map((q, i) => (
                    <QuizRow key={q.id} item={q} isTeacher={isTeacher} groupId={group.id}
                      onDelete={handleDeleteQuiz} onReport={setQuizReportTarget} onEdit={setEditQuiz} onClose={handleCloseQuiz} isLast={i === quizzes.length - 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Assignments table */}
            {assignments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SectionHeader label="Assignments" count={assignments.length} color={C.primary} dim={C.primaryDim} />
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                      <div style={{ width: 38, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Assignment Name</span>
                    </div>
                    <div style={{ width: 120, flexShrink: 0 }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Due Date</span></div>
                    <div style={{ width: 120, flexShrink: 0 }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{isTeacher ? '' : 'Attempts Left'}</span></div>
                    <div style={{ width: 90, flexShrink: 0 }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Type</span></div>
                    <div style={{ width: 140, flexShrink: 0 }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status</span></div>
                    <div style={{ width: 160, flexShrink: 0, textAlign: 'right' }}><span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Actions</span></div>
                  </div>
                  {assignments.map((a, i) => (
                    <AssignmentRow key={a.id} item={a} isTeacher={isTeacher} groupId={group.id}
                      onDelete={handleDelete} onSubmit={setSubmitTarget} onReport={setReportTarget} onEdit={setEditAssignment} onClose={handleClose} onViewSubmission={handleViewSubmission} isLast={i === assignments.length - 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate      && <CreateModal groupId={group.id} onCreated={handleCreated} onClose={() => setShowCreate(false)} />}
      {showQuizBuilder && <QuizBuilderModal groupId={group.id} onCreated={handleQuizCreated} onClose={() => setShowQuizBuilder(false)} />}
      {editAssignment  && <EditAssignmentModal item={editAssignment} groupId={group.id} onUpdated={handleAssignmentUpdated} onClose={() => setEditAssignment(null)} />}
      {editQuiz        && <EditQuizModal item={editQuiz} groupId={group.id} onUpdated={handleQuizUpdated} onClose={() => setEditQuiz(null)} />}
      {submitTarget    && <SubmitModal assignment={submitTarget} groupId={group.id} onDone={handleSubmitDone} onClose={() => setSubmitTarget(null)} />}
      {reportTarget    && <ReportModal assignment={reportTarget} groupId={group.id} onClose={() => setReportTarget(null)} />}
      {quizReportTarget && <QuizReportModal quiz={quizReportTarget} groupId={group.id} onClose={() => setQuizReportTarget(null)} />}
      {studentPreviewFile && <FilePreviewModal file={studentPreviewFile} onClose={() => setStudentPreviewFile(null)} canDelete={false} />}
      <ConfirmDialog
        open={!!confirmAction}
        danger={confirmAction?.type?.startsWith('delete')}
        title={confirmAction?.type === 'delete-assignment' ? 'Delete Assignment?' :
               confirmAction?.type === 'delete-quiz'       ? 'Delete Quiz?' :
               confirmAction?.type === 'close-assignment'  ? 'Close Assignment?' : 'Close Quiz?'}
        description={confirmAction?.type?.startsWith('delete')
          ? 'This will permanently delete it and all submissions. This cannot be undone.'
          : 'This will remove it from Due Dates but keep it here for history.'}
        confirmText={confirmAction?.type?.startsWith('delete') ? 'Delete' : 'Close'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
