import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { teacherAPI } from '../services/api';
import logo from '../assets/logo.png';
import ProfilePage from '../components/ProfilePage';

// ── Design tokens (matching palette image) ────────────────
const C = {
  shell:      '#0E0E0E',
  sidebar:    '#141414',
  surface:    '#1A1A1A',
  raised:     '#222222',
  border:     '#2A2A2A',
  borderHi:   '#383838',
  primary:    '#C0C1FF',
  primaryLo:  'rgba(192,193,255,0.10)',
  primaryMid: 'rgba(192,193,255,0.20)',
  secondary:  '#FFB38E',
  secondaryLo:'rgba(255,179,142,0.12)',
  text1:      '#F0F0F0',
  text2:      '#9E9E9E',
  text3:      '#555555',
  danger:     '#EF4444',
  success:    '#22C55E',
};

// ── Helpers ───────────────────────────────────────────────
const AVATAR_COLORS = ['#4f46e5','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

function Avatar({ name, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: avatarBg(name), flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff',
    }}>{ini(name)}</div>
  );
}

// ── Sidebar nav item ──────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
      background: active ? C.primaryLo : 'none',
      color: active ? C.primary : C.text2,
      borderLeft: `2px solid ${active ? C.primary : 'transparent'}`,
      fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: active ? 600 : 400,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      transition: 'all 0.15s', textAlign: 'left',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.primaryLo; e.currentTarget.style.color = C.text1; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; } }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

// ── Student Profile Modal ─────────────────────────────────
function StudentProfileModal({ student, onClose, onViewFullProfile }) {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  if (!student) return null;

  const buildPdfHtml = () => {
    const fmtItem = (item) => {
      if (typeof item === 'string') return item;
      const parts = [item?.title, item?.subtitle, item?.date].filter(Boolean);
      return parts.join(' — ');
    };
    const section = (title, items) => !items?.length ? '' : `
      <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888;margin:20px 0 8px;border-bottom:1px solid #333;padding-bottom:6px;">${title} (${items.length})</h3>
      ${items.map(item => `<div style="padding:8px 0;border-bottom:1px solid #222;font-size:13px;color:#ccc;">${fmtItem(item)}</div>`).join('')}
    `;
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>body{font-family:Inter,sans-serif;background:#111;color:#f0f0f0;padding:40px;max-width:700px;margin:0 auto;}
      h1{font-size:28px;font-weight:800;margin:0 0 4px;}h2{font-size:13px;color:#888;font-weight:400;margin:0 0 24px;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;}
      .cell{background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:12px 16px;}
      .cell-label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:4px;}
      .cell-value{font-size:15px;font-weight:600;}</style></head>
      <body>
        <h1>${student.name}</h1>
        <h2>${student.email}</h2>
        <div class="grid">
          <div class="cell"><div class="cell-label">Roll No</div><div class="cell-value">${student.roll_no || '—'}</div></div>
          <div class="cell"><div class="cell-label">Department</div><div class="cell-value">${student.department || '—'}</div></div>
          <div class="cell"><div class="cell-label">Year</div><div class="cell-value">${student.year ? `Year ${student.year}` : '—'}</div></div>
          <div class="cell"><div class="cell-label">CGPA</div><div class="cell-value">${student.cgpa ?? '—'}</div></div>
          <div class="cell"><div class="cell-label">Achievements</div><div class="cell-value">${student.achievements?.length || 0}</div></div>
          <div class="cell"><div class="cell-label">Certifications</div><div class="cell-value">${student.certificates?.length || 0}</div></div>
        </div>
        ${section('Achievements', student.achievements)}
        ${section('Certifications', student.certificates)}
        ${section('Internships', student.internships)}
      </body></html>`;
  };

  const handlePreviewPdf = () => {
    setGeneratingPdf(true);
    try {
      const html = buildPdfHtml();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setShowPdfPreview(true);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    const html = buildPdfHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) setTimeout(() => { win.focus(); win.print(); }, 800);
  };

  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }); }
    catch { return d; }
  };

  const isImage = (t) => t?.startsWith('image/');

  const StructuredItem = ({ item, accent }) => {
    const title    = typeof item === 'string' ? item : item?.title || '—';
    const subtitle = typeof item === 'object' ? item?.subtitle : null;
    const date     = typeof item === 'object' ? item?.date : null;
    const attachments = typeof item === 'object' ? (item?.attachments || []) : [];
    return (
      <div style={{ padding: '10px 14px', borderRadius: 9, background: C.raised, border: `1px solid ${C.border}`, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: C.text2, marginTop: 3 }}>{subtitle}</div>}
        {date && <div style={{ fontSize: 10, color: accent, marginTop: 4, fontWeight: 500 }}>{fmtDate(date)}</div>}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {attachments.map((att, i) => (
              isImage(att.type)
                ? <a key={i} href={att.url} target="_blank" rel="noreferrer">
                    <img src={att.url} alt={att.name} style={{ height: 48, width: 68, objectFit: 'cover', borderRadius: 6, border: `1px solid ${C.border}` }} />
                  </a>
                : <a key={i} href={att.url} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: C.surface, border: `1px solid ${C.border}`, textDecoration: 'none', color: C.text2, fontSize: 11 }}>
                    📎 {att.name}
                  </a>
            ))}
          </div>
        )}
      </div>
    );
  };

  const infoItems = [
    ['Roll No', student.roll_no || '—'], ['Department', student.department || '—'],
    ['Year', student.year ? `Year ${student.year}` : '—'], ['CGPA', student.cgpa ?? '—'],
    ['Achievements', student.achievements?.length || 0], ['Certifications', student.certificates?.length || 0],
  ];

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', animation: 'popIn 220ms cubic-bezier(0.34,1.2,0.64,1) both' }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
            <Avatar name={student.name} size={46} />
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>{student.name}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{student.email}</div>
            </div>
            <button onClick={() => onViewFullProfile(student.id)}
              style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>
              View Full Profile
            </button>
            <button onClick={handlePreviewPdf} disabled={generatingPdf}
              style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.primaryMid}`, background: C.primaryLo, color: C.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', opacity: generatingPdf ? 0.6 : 1 }}>
              {generatingPdf ? '…' : '↓ Download PDF'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 20, padding: 4, lineHeight: 1 }}>✕</button>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
            {infoItems.map(([k, v]) => (
              <div key={k} style={{ background: C.raised, borderRadius: 9, padding: '11px 14px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Achievements */}
          {student.achievements?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 10 }}>
                Achievements ({student.achievements.length})
              </div>
              {student.achievements.map((item, i) => <StructuredItem key={i} item={item} accent={C.primary} />)}
            </div>
          )}

          {/* Certifications */}
          {student.certificates?.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 10 }}>
                Certifications ({student.certificates.length})
              </div>
              {student.certificates.map((item, i) => <StructuredItem key={i} item={item} accent='#22C55E' />)}
            </div>
          )}

          {/* Internships */}
          {student.internships?.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 10 }}>
                Internships ({student.internships.length})
              </div>
              {student.internships.map((item, i) => <StructuredItem key={i} item={item} accent={C.secondary} />)}
            </div>
          )}

          {!student.achievements?.length && !student.certificates?.length && !student.internships?.length && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.text3, fontSize: 13, fontStyle: 'italic' }}>No academic records added yet</div>
          )}
        </div>
      </div>

      {/* PDF Preview */}
      {showPdfPreview && pdfBlobUrl && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'stretch', background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', fontFamily: 'Inter, sans-serif' }}
          onClick={e => e.target === e.currentTarget && setShowPdfPreview(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', maxWidth: 1000, margin: '0 auto', padding: '20px 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexShrink: 0 }}>
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>PDF Preview</span>
              <h2 style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#F0F0F0', margin: 0 }}>{student.name} — Profile</h2>
              <button onClick={handleDownloadPdf}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, background: 'rgba(192,193,255,0.12)', border: '1px solid rgba(192,193,255,0.25)', color: '#C0C1FF', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ↓ Download / Print PDF
              </button>
              <button onClick={() => { setShowPdfPreview(false); URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }}
                style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, background: '#1A1A1E', borderRadius: 16, border: '1px solid #333', overflow: 'hidden' }}>
              <iframe src={pdfBlobUrl} title="Profile Preview" style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}


// ── Selection Groups Modal ────────────────────────────────
function SelectionGroupsModal({ groups, selectedIds, onApplyGroup, onSaveGroup, onDeleteGroup, onClose }) {
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newName.trim() || selectedIds.size === 0) return;
    setSaving(true);
    await onSaveGroup(newName.trim());
    setNewName(''); setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, maxHeight: '80vh', overflowY: 'auto', animation: 'popIn 220ms cubic-bezier(0.34,1.2,0.64,1) both' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4 }}>Management Tools</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>Student Selection Control</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {/* Active selection */}
        <div style={{ background: C.raised, borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Active Selection</span>
            <button onClick={() => {}} style={{ fontSize: 11, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>
            {selectedIds.size} <span style={{ fontSize: 14, fontWeight: 400, color: C.text2 }}>Selected</span>
          </div>
        </div>

        {/* Save new group */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>Save as Group</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', color: C.text1, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none' }}
              placeholder="Group name…" value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button onClick={handleSave} disabled={saving || !newName.trim() || selectedIds.size === 0}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (saving || !newName.trim() || selectedIds.size === 0) ? 0.4 : 1, fontFamily: 'Inter, sans-serif' }}>
              {saving ? '…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Saved groups */}
        <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>
          Saved Groups ({groups.length})
        </div>
        {groups.length === 0 && <div style={{ fontSize: 12, color: C.text3, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>No groups saved yet</div>}
        {groups.map(g => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, border: `1px solid ${C.border}`, marginBottom: 8, background: C.raised }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{g.student_ids?.length || 0} students</div>
            </div>
            <button onClick={() => onApplyGroup(g)}
              style={{ padding: '5px 14px', borderRadius: 7, border: `1px solid ${C.primaryMid}`, background: C.primaryLo, color: C.primary, fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              Select
            </button>
            <button onClick={() => onDeleteGroup(g.id)}
              style={{ padding: '5px 9px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'none', color: C.danger, fontSize: 12, cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Message Modal ─────────────────────────────────────────
// ── Markdown → HTML (for Gmail body) ─────────────────────
function mdToHtml(md) {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // headings
    .replace(/^### (.+)$/gm, '<h3 style="margin:16px 0 6px;font-size:15px;font-weight:700;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:18px 0 8px;font-size:18px;font-weight:700;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:20px 0 10px;font-size:22px;font-weight:800;">$1</h1>')
    // bold / italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // inline code
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:2px 5px;border-radius:4px;font-family:monospace;font-size:13px;">$1</code>')
    // blockquote
    .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid #c0c1ff;margin:8px 0;padding:4px 12px;color:#555;">$1</blockquote>')
    // hr
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">')
    // unordered list items
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;">$1</li>')
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:3px 0;">$1</li>')
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#6366f1;">$1</a>')
    // line breaks
    .replace(/\n\n/g, '</p><p style="margin:8px 0;">')
    .replace(/\n/g, '<br>');
}

// ── Format toolbar button (outside component) ────────────
function FmtBtn({ label, title, onClick }) {
  return (
    <button title={title} onClick={onClick}
      style={{ padding: '3px 8px', borderRadius: 5, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace', lineHeight: 1.4 }}
      onMouseEnter={e => { e.currentTarget.style.background = C.primaryLo; e.currentTarget.style.color = C.primary; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text2; }}>
      {label}
    </button>
  );
}

// ── Email Composer Modal ──────────────────────────────────
function EmailComposerModal({ students, selectionGroups, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);
  const [attachments, setAttachments] = useState([]); // { name, file, url }
  const [extraEmails, setExtraEmails] = useState(''); // comma-separated manual emails
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [recipients, setRecipients] = useState(students.map(s => ({ ...s, included: true })));

  // When a group is selected, merge its students in
  const handleGroupSelect = (gid) => {
    setSelectedGroupId(gid);
    if (!gid) { setRecipients(students.map(s => ({ ...s, included: true }))); return; }
    const g = selectionGroups.find(g => g.id === gid);
    if (!g) return;
    const groupIds = new Set(g.student_ids || []);
    const merged = students.map(s => ({ ...s, included: groupIds.has(s.id) }));
    setRecipients(merged);
  };

  const toggleRecipient = (id) => setRecipients(r => r.map(s => s.id === id ? { ...s, included: !s.included } : s));

  const includedStudents = recipients.filter(s => s.included);
  const toEmails = [
    ...includedStudents.map(s => s.email).filter(Boolean),
    ...extraEmails.split(',').map(e => e.trim()).filter(e => e.includes('@')),
  ];

  const insertFormat = (before, after = '') => {
    const ta = document.getElementById('email-body-ta');
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = body.slice(start, end);
    const newBody = body.slice(0, start) + before + (sel || 'text') + after + body.slice(end);
    setBody(newBody);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + (sel || 'text').length); }, 0);
  };

  const handleAttach = (e) => {
    const files = Array.from(e.target.files || []);
    const newAtts = files.map(f => ({ name: f.name, file: f, url: URL.createObjectURL(f) }));
    setAttachments(prev => [...prev, ...newAtts]);
    e.target.value = '';
  };

  const removeAttachment = (i) => {
    URL.revokeObjectURL(attachments[i].url);
    setAttachments(prev => prev.filter((_, idx) => idx !== i));
  };

  const openInGmail = () => {
    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#222;"><p style="margin:8px 0;">${mdToHtml(body)}</p></div>`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1`
      + `&to=${encodeURIComponent(toEmails.join(','))}`
      + `&su=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    void html; // html preview used in preview tab
  };

  const openMailto = () => {
    window.location.href = `mailto:${toEmails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const inputStyle = {
    width: '100%', background: C.raised, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '9px 12px', color: C.text1, fontSize: 13,
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, width: '100%', maxWidth: 720, maxHeight: '92vh', display: 'flex', flexDirection: 'column', animation: 'popIn 220ms cubic-bezier(0.34,1.2,0.64,1) both', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4 }}>Bulk Actions</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>Compose Email</h3>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setPreview(v => !v)}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${preview ? C.primary : C.border}`, background: preview ? C.primaryLo : 'none', color: preview ? C.primary : C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: preview ? 600 : 400 }}>
                {preview ? 'Edit' : 'Preview'}
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 20, lineHeight: 1 }}>✕</button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px' }}>

          {/* Recipients section */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Recipients</div>
              {/* Group selector */}
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <select value={selectedGroupId} onChange={e => handleGroupSelect(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', padding: '5px 28px 5px 10px', fontSize: 11, appearance: 'none', cursor: 'pointer' }}>
                  <option value="">From selection ({students.length})</option>
                  {selectionGroups.map(g => <option key={g.id} value={g.id}>Group: {g.name} ({g.student_ids?.length || 0})</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: C.text3, pointerEvents: 'none', fontSize: 10 }}>▾</span>
              </div>
            </div>

            {/* Student chips */}
            <div style={{ background: C.raised, borderRadius: 9, padding: '10px 12px', border: `1px solid ${C.border}`, maxHeight: 90, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {recipients.map(s => (
                <button key={s.id} onClick={() => toggleRecipient(s.id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, border: `1px solid ${s.included ? C.primaryMid : C.border}`, background: s.included ? C.primaryLo : 'transparent', color: s.included ? C.primary : C.text3, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: s.included ? 600 : 400, transition: 'all 0.12s' }}>
                  {s.included ? '✓' : '+'} {s.name}
                </button>
              ))}
            </div>

            {/* Manual email input */}
            <div style={{ marginTop: 8 }}>
              <input style={{ ...inputStyle, fontSize: 12 }}
                placeholder="Add more emails (comma-separated)…"
                value={extraEmails} onChange={e => setExtraEmails(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
            </div>

            {toEmails.length > 0 && (
              <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>
                Sending to <span style={{ color: C.primary, fontWeight: 600 }}>{toEmails.length}</span> address{toEmails.length !== 1 ? 'es' : ''}
              </div>
            )}
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>Subject</div>
            <input style={inputStyle} placeholder="Email subject…" value={subject} onChange={e => setSubject(e.target.value)}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
          </div>

          {/* Body */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginRight: 4 }}>Body</div>
              <FmtBtn label="B" title="Bold (**text**)" onClick={() => insertFormat('**', '**')} />
              <FmtBtn label="I" title="Italic (*text*)" onClick={() => insertFormat('*', '*')} />
              <FmtBtn label="H1" title="Heading 1" onClick={() => insertFormat('# ')} />
              <FmtBtn label="H2" title="Heading 2" onClick={() => insertFormat('## ')} />
              <FmtBtn label="H3" title="Heading 3" onClick={() => insertFormat('### ')} />
              <FmtBtn label="—" title="Divider" onClick={() => setBody(b => b + '\n---\n')} />
              <FmtBtn label="• List" title="Bullet list" onClick={() => insertFormat('- ')} />
              <FmtBtn label="&gt;" title="Blockquote" onClick={() => insertFormat('> ')} />
              <FmtBtn label="`code`" title="Inline code" onClick={() => insertFormat('`', '`')} />
              <FmtBtn label="Link" title="Link [text](url)" onClick={() => insertFormat('[', '](url)')} />
            </div>

            {preview ? (
              <div style={{ minHeight: 200, background: '#fff', borderRadius: 9, padding: '16px 20px', border: `1px solid ${C.border}`, color: '#222', fontSize: 14, lineHeight: 1.7, fontFamily: 'Arial, sans-serif' }}
                dangerouslySetInnerHTML={{ __html: `<p style="margin:8px 0;">${mdToHtml(body || '_Nothing written yet…_')}</p>` }} />
            ) : (
              <textarea id="email-body-ta" style={{ ...inputStyle, resize: 'vertical', minHeight: 200, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7 }}
                placeholder={'Write your email in Markdown…\n\n**Bold**, *italic*, # Heading, - list item, > quote, `code`, [link](url)'}
                value={body} onChange={e => setBody(e.target.value)}
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.border} />
            )}
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Attachments</div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}>
                📎 Attach files
                <input type="file" multiple style={{ display: 'none' }} onChange={handleAttach} />
              </label>
              <span style={{ fontSize: 11, color: C.text3 }}>Files will be attached when you open in Gmail</span>
            </div>
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {attachments.map((att, i) => (
                  <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 7, background: C.raised, border: `1px solid ${C.border}`, fontSize: 11, color: C.text2 }}>
                    📄 {att.name}
                    <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 13, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', gap: 10, alignItems: 'center', background: C.surface }}>
          <div style={{ fontSize: 11, color: C.text3, flex: 1 }}>
            Opens in your email client with all recipients pre-filled
          </div>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Cancel
          </button>
          <button onClick={openMailto} disabled={!subject.trim() || !body.trim() || toEmails.length === 0}
            style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.raised, color: C.text1, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: (!subject.trim() || !body.trim() || toEmails.length === 0) ? 0.4 : 1 }}>
            Open in Mail App
          </button>
          <button onClick={openInGmail} disabled={!subject.trim() || !body.trim() || toEmails.length === 0}
            style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 7, opacity: (!subject.trim() || !body.trim() || toEmails.length === 0) ? 0.4 : 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            Open in Gmail
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report Modal ──────────────────────────────────────────
function ReportModal({ students, onClose }) {
  const [type, setType] = useState('csv');

  const generateCSV = () => {
    const headers = ['Name','Email','Roll No','Department','Year','CGPA','Achievements','Certifications','Internships'];
    const rows = students.map(s => [
      s.name, s.email, s.roll_no||'', s.department||'', s.year||'',
      s.cgpa??'', s.achievements?.length||0, s.certificates?.length||0, s.internships?.length||0,
    ]);
    const csv = [headers,...rows].map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`student_report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const generateText = () => {
    const wc = students.filter(s=>s.cgpa);
    const avg = wc.length ? (wc.reduce((a,s)=>a+s.cgpa,0)/wc.length).toFixed(2) : 'N/A';
    const lines = [
      `STUDENT REPORT — ${new Date().toLocaleDateString()}`,
      `Total: ${students.length}  |  Avg CGPA: ${avg}`, '',
      ...students.map((s,i)=>`${i+1}. ${s.name} (${s.roll_no||'N/A'}) — ${s.department||'N/A'} — CGPA: ${s.cgpa??'N/A'} — Ach: ${s.achievements?.length||0} — Certs: ${s.certificates?.length||0}`),
    ];
    const blob = new Blob([lines.join('\n')],{type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`student_report_${new Date().toISOString().slice(0,10)}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const wc = students.filter(s=>s.cgpa);
  const avgCgpa = wc.length ? (wc.reduce((a,s)=>a+s.cgpa,0)/wc.length).toFixed(2) : '—';
  const totalAch = students.reduce((a,s)=>a+(s.achievements?.length||0),0);
  const totalCerts = students.reduce((a,s)=>a+(s.certificates?.length||0),0);

  const stats = [
    { label: 'Students', value: students.length, color: C.primary },
    { label: 'Avg CGPA', value: avgCgpa, color: C.success },
    { label: 'Achievements', value: totalAch, color: C.secondary },
    { label: 'Certs', value: totalCerts, color: C.primary },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, animation: 'popIn 220ms cubic-bezier(0.34,1.2,0.64,1) both' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 600, marginBottom: 4 }}>Reporting Hub</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>Generate Report</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: C.raised, borderRadius: 10, padding: '12px 14px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'Manrope, Inter, sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: C.text3, marginBottom: 18 }}>
          Exporting {students.length} student{students.length !== 1 ? 's' : ''} from current selection.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[['csv','Export Data (.csv)'],['summary','Text Summary']].map(([t,l]) => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              border: `1px solid ${type===t ? C.primary : C.border}`,
              background: type===t ? C.primaryLo : 'none',
              color: type===t ? C.primary : C.text2,
              fontSize: 12, fontWeight: type===t ? 600 : 400,
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'none', color: C.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
          <button onClick={type==='csv' ? generateCSV : generateText}
            style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#131313', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            ↓ Export {type==='csv' ? 'CSV' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Advanced Filters Modal ────────────────────────────────
function AdvancedFiltersModal({ filters, onChange, onApply, onClose }) {
  const [local, setLocal] = useState({ ...filters });

  const inputStyle = {
    width: '100%', background: C.raised, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '9px 12px', color: C.text1, fontSize: 13,
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  };
  const label = (text) => (
    <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 6 }}>{text}</div>
  );
  const focus = e => e.target.style.borderColor = C.primary;
  const blur  = e => e.target.style.borderColor = C.border;

  const handleApply = () => { onChange(local); onApply(local); onClose(); };
  const handleClear = () => { const cleared = { ...local, cgpa_min:'', cgpa_max:'', achievement_min:'', cert_min:'' }; setLocal(cleared); onChange(cleared); onApply(cleared); onClose(); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)' }}
      onClick={onClose}>
      <div style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:32, width:'100%', maxWidth:480, animation:'popIn 220ms cubic-bezier(0.34,1.2,0.64,1) both' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:600, marginBottom:4 }}>Student Manager</div>
            <h3 style={{ margin:0, fontSize:20, fontWeight:800, color: C.text1, fontFamily:'Manrope, Inter, sans-serif', letterSpacing:'-0.01em' }}>
              Advanced Filters
            </h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color: C.text3, fontSize:20, lineHeight:1, padding:4 }}>✕</button>
        </div>

        {/* CGPA range */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color: C.text2, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:20, height:20, borderRadius:6, background: C.primaryLo, border:`1px solid ${C.primaryMid}`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>▲</span>
            CGPA Range
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              {label('Minimum CGPA')}
              <input style={inputStyle} type="number" min="0" max="10" step="0.1" placeholder="e.g. 7.0"
                value={local.cgpa_min} onChange={e => setLocal(l=>({...l,cgpa_min:e.target.value}))}
                onFocus={focus} onBlur={blur} />
            </div>
            <div>
              {label('Maximum CGPA')}
              <input style={inputStyle} type="number" min="0" max="10" step="0.1" placeholder="e.g. 10.0"
                value={local.cgpa_max} onChange={e => setLocal(l=>({...l,cgpa_max:e.target.value}))}
                onFocus={focus} onBlur={blur} />
            </div>
          </div>
        </div>

        <div style={{ height:1, background: C.border, marginBottom:20 }} />

        {/* Achievement & Cert counts */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color: C.text2, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:20, height:20, borderRadius:6, background: C.secondaryLo, border:`1px solid rgba(255,179,142,0.25)`, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>★</span>
            Academic Achievements
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              {label('Achievements ≥')}
              <input style={inputStyle} type="number" min="0" placeholder="e.g. 3"
                value={local.achievement_min} onChange={e => setLocal(l=>({...l,achievement_min:e.target.value}))}
                onFocus={focus} onBlur={blur} />
              <div style={{ fontSize:10, color: C.text3, marginTop:4 }}>Min. achievement count</div>
            </div>
            <div>
              {label('Certifications ≥')}
              <input style={inputStyle} type="number" min="0" placeholder="e.g. 2"
                value={local.cert_min} onChange={e => setLocal(l=>({...l,cert_min:e.target.value}))}
                onFocus={focus} onBlur={blur} />
              <div style={{ fontSize:10, color: C.text3, marginTop:4 }}>Min. certification count</div>
            </div>
          </div>
        </div>

        {/* Active preview */}
        {[local.cgpa_min, local.cgpa_max, local.achievement_min, local.cert_min].some(Boolean) && (
          <div style={{ background: C.raised, borderRadius:9, padding:'10px 14px', marginBottom:20, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:8 }}>Will apply</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {local.cgpa_min && <span style={{ fontSize:11, background: C.primaryLo, color: C.primary, borderRadius:6, padding:'3px 10px', border:`1px solid ${C.primaryMid}`, fontWeight:600 }}>CGPA ≥ {local.cgpa_min}</span>}
              {local.cgpa_max && <span style={{ fontSize:11, background: C.primaryLo, color: C.primary, borderRadius:6, padding:'3px 10px', border:`1px solid ${C.primaryMid}`, fontWeight:600 }}>CGPA ≤ {local.cgpa_max}</span>}
              {local.achievement_min && <span style={{ fontSize:11, background: C.secondaryLo, color: C.secondary, borderRadius:6, padding:'3px 10px', border:`1px solid rgba(255,179,142,0.25)`, fontWeight:600 }}>Achievements ≥ {local.achievement_min}</span>}
              {local.cert_min && <span style={{ fontSize:11, background: C.secondaryLo, color: C.secondary, borderRadius:6, padding:'3px 10px', border:`1px solid rgba(255,179,142,0.25)`, fontWeight:600 }}>Certs ≥ {local.cert_min}</span>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={handleClear} style={{ padding:'9px 18px', borderRadius:8, border:`1px solid ${C.border}`, background:'none', color: C.danger, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
            Clear Advanced
          </button>
          <button onClick={onClose} style={{ padding:'9px 18px', borderRadius:8, border:`1px solid ${C.border}`, background:'none', color: C.text2, fontSize:12, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
            Cancel
          </button>
          <button onClick={handleApply} style={{ padding:'9px 24px', borderRadius:8, border:'none', background: C.primary, color:'#131313', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function TeacherDashboard() {
  const { user, logout } = useAuth();

  const [activeNav, setActiveNav] = useState('students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [filters, setFilters] = useState({ name:'', roll_no:'', department:'', year:'', cgpa_min:'', cgpa_max:'', achievement_min:'', cert_min:'' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionGroups, setSelectionGroups] = useState([]);
  const [viewProfile, setViewProfile] = useState(null);
  const [fullProfileUserId, setFullProfileUserId] = useState(null);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  const fetchStudents = async (explicitFilters) => {
    setLoading(true);
    try {
      const params = {};
      Object.keys(explicitFilters).forEach(k => {
        if (explicitFilters[k] === '' || explicitFilters[k] === null || explicitFilters[k] === undefined) return;
        // year is int4 in DB — send as number
        params[k] = k === 'year' ? parseInt(explicitFilters[k]) : explicitFilters[k];
      });
      const res = await teacherAPI.getStudents(params);
      setStudents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const fetchGroups = useCallback(async () => {
    try { const res = await teacherAPI.getSelectionGroups(); setSelectionGroups(res.data); }
    catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchStudents({}); }, []);
  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleSearch = (overrideFilters) => {
    const f = overrideFilters !== undefined ? overrideFilters : filters;
    const tags = [];
    if (f.cgpa_min)        tags.push({ label: `CGPA ≥ ${f.cgpa_min}`,               key: 'cgpa_min' });
    if (f.cgpa_max)        tags.push({ label: `CGPA ≤ ${f.cgpa_max}`,               key: 'cgpa_max' });
    if (f.achievement_min) tags.push({ label: `Achievements ≥ ${f.achievement_min}`, key: 'achievement_min' });
    if (f.cert_min)        tags.push({ label: `Certs ≥ ${f.cert_min}`,              key: 'cert_min' });
    if (f.department)      tags.push({ label: f.department,                          key: 'department' });
    if (f.year)            tags.push({ label: `Year ${f.year}`,                      key: 'year' });
    if (f.roll_no)         tags.push({ label: `Roll: ${f.roll_no}`,                  key: 'roll_no' });
    setActiveFilters(tags);
    fetchStudents(f);
  };

  const advancedActive = [filters.cgpa_min, filters.cgpa_max, filters.achievement_min, filters.cert_min].filter(Boolean).length;

  const removeFilter = (key) => {
    const nf = { ...filters, [key]: '' };
    setFilters(nf);
    setActiveFilters(prev => prev.filter(f => f.key !== key));
    fetchStudents(nf);
  };

  const toggleStudent = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => selectedIds.size === students.length ? setSelectedIds(new Set()) : setSelectedIds(new Set(students.map(s => s.id)));
  const applyGroup = (g) => { setSelectedIds(new Set(g.student_ids||[])); setShowGroupsModal(false); };
  const saveGroup = async (name) => { try { await teacherAPI.createSelectionGroup({ name, student_ids: Array.from(selectedIds) }); await fetchGroups(); } catch(e){console.error(e);} };
  const deleteGroup = async (id) => { try { await teacherAPI.deleteSelectionGroup(id); await fetchGroups(); } catch(e){console.error(e);} };

  const selectedStudents = students.filter(s => selectedIds.has(s.id));
  const wc = students.filter(s => s.cgpa);
  const avgCgpa = wc.length ? (wc.reduce((a,s)=>a+s.cgpa,0)/wc.length).toFixed(2) : '—';

  const NAV = [
    { id:'overview',  icon:'▦', label:'Overview' },
    { id:'analytics', icon:'▲', label:'Analytics' },
    { id:'reporting', icon:'▤', label:'Reporting Hub' },
    { id:'students',  icon:'◉', label:'Student Manager' },
    { id:'resources', icon:'▣', label:'Resources' },
  ];

  const inputBase = { background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', color: C.text1, fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none' };

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'Inter, sans-serif', background: C.shell, color: C.text1, overflow:'hidden' }}>

      {/* ── Left Sidebar ── */}
      <div style={{ width:210, flexShrink:0, background: C.sidebar, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', padding:'0 0 16px' }}>
        {/* Brand */}
        <div style={{ padding:'24px 20px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <div style={{ width:32, height:32, borderRadius:8, background: C.primaryLo, border:`1px solid ${C.primaryMid}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <img src={logo} alt="logo" style={{ width:20, height:20, objectFit:'contain' }} />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color: C.text1, fontFamily:'Manrope, Inter, sans-serif', letterSpacing:'-0.01em', lineHeight:1.1 }}>Studi+</div>
              <div style={{ fontSize:9, color: C.text3, textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:600 }}>Lead Educator</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex:1, padding:'0 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(n => <NavItem key={n.id} icon={n.icon} label={n.label} active={activeNav===n.id} onClick={() => setActiveNav(n.id)} />)}
        </div>

        {/* User card at bottom */}
        <div style={{ margin:'0 10px', padding:'12px 14px', borderRadius:10, background: C.raised, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
          <Avatar name={user?.name} size={36} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color: C.text1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name || 'Teacher'}</div>
            <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:600 }}>
              {user?.role === 'admin' ? 'Admin' : 'Senior Dean'}
            </div>
          </div>
          <button onClick={logout} title="Logout" style={{ background:'none', border:'none', cursor:'pointer', color: C.text3, fontSize:14, padding:2 }}
            onMouseEnter={e=>e.currentTarget.style.color=C.danger} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>
            ⏻
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{ height:56, flexShrink:0, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 28px', gap:20, background: C.sidebar }}>
          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:8, background: C.raised, border:`1px solid ${C.border}`, borderRadius:9, padding:'7px 14px', flex:'0 1 320px' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill={C.text3}><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/></svg>
            <input
              style={{ background:'none', border:'none', outline:'none', color: C.text1, fontSize:12, fontFamily:'Inter, sans-serif', width:'100%' }}
              placeholder="Quick Search (Cmd + K)"
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />
          </div>

          {/* Nav links */}
          <div style={{ display:'flex', gap:24, flex:1, justifyContent:'center' }}>
            {['Classroom','Curriculum','Grades'].map(l => (
              <button key={l} style={{ background:'none', border:'none', cursor:'pointer', color: C.text2, fontSize:13, fontFamily:'Inter, sans-serif', fontWeight:400, padding:0 }}
                onMouseEnter={e=>e.currentTarget.style.color=C.text1} onMouseLeave={e=>e.currentTarget.style.color=C.text2}>
                {l}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button style={{ background:'none', border:'none', cursor:'pointer', color: C.text2, fontSize:18, padding:4 }}>🔔</button>
            <button onClick={() => { if (selectedIds.size > 0) setShowReportModal(true); }}
              style={{ padding:'8px 18px', borderRadius:9, border:`1px solid ${C.borderHi}`, background: C.raised, color: C.text1, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', opacity: selectedIds.size===0 ? 0.5 : 1 }}>
              Generate Report
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'28px 28px 28px' }}>

          {/* Breadcrumb + title */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.12em', fontWeight:600, marginBottom:8 }}>
              Academic Workspace / Directory
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <h1 style={{ margin:0, fontSize:36, fontWeight:800, color: C.text1, fontFamily:'Manrope, Inter, sans-serif', letterSpacing:'-0.02em', lineHeight:1 }}>
                Student Manager
              </h1>
              <button onClick={() => { if (selectedIds.size > 0) setShowGroupsModal(true); }}
                style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${C.borderHi}`, background: C.raised, color: C.text1, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif', marginLeft:'auto' }}>
                Save Current Selection
              </button>
              <button onClick={() => setShowMessageModal(true)}
                style={{ padding:'10px 20px', borderRadius:9, border:`1px solid ${C.primaryMid}`, background: C.primaryLo, color: C.primary, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
                ✉ Compose Email
              </button>
            </div>
          </div>

          {/* Filter row */}
          <div style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', marginBottom:20 }}>
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end', marginBottom: activeFilters.length ? 14 : 0 }}>

              {/* Department */}
              <div style={{ flex:'1 1 180px' }}>
                <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:6 }}>Department</div>
                <div style={{ position:'relative' }}>
                  <select value={filters.department} onChange={e => setFilters(f=>({...f,department:e.target.value}))}
                    style={{ ...inputBase, width:'100%', appearance:'none', paddingRight:28, cursor:'pointer', boxSizing:'border-box' }}>
                    <option value="">All Departments</option>
                    <option value="B. Tech Artificial Intelligence and Machine Learning">B.Tech AI &amp; ML (AIML)</option>
                    <option value="B. Tech Artificial Intelligence and Data Science">B.Tech AI &amp; Data Science (AIDS)</option>
                    <option value="B. Sc Computer Science">B.Sc Computer Science (CSE)</option>
                  </select>
                  <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color: C.text3, pointerEvents:'none', fontSize:10 }}>▾</span>
                </div>
              </div>

              {/* Roll No */}
              <div style={{ flex:'1 1 160px' }}>
                <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:6 }}>Roll No / ID</div>
                <input style={{ ...inputBase, width:'100%', boxSizing:'border-box' }} placeholder="Ex: 241XXXXXX"
                  value={filters.roll_no} onChange={e => setFilters(f=>({...f,roll_no:e.target.value}))}
                  onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}
                  onKeyDown={e=>e.key==='Enter'&&handleSearch()} />
              </div>

              {/* Year */}
              <div style={{ flex:'0 1 120px' }}>
                <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:6 }}>Year</div>
                <div style={{ position:'relative' }}>
                  <select value={filters.year||''} onChange={e => setFilters(f=>({...f,year:e.target.value}))}
                    style={{ ...inputBase, width:'100%', appearance:'none', paddingRight:28, cursor:'pointer', boxSizing:'border-box' }}>
                    <option value="">All Years</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                  <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color: C.text3, pointerEvents:'none', fontSize:10 }}>▾</span>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <button onClick={() => handleSearch()}
                  style={{ padding:'8px 20px', borderRadius:8, border:'none', background: C.primary, color:'#131313', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter, sans-serif', whiteSpace:'nowrap' }}>
                  Search
                </button>
                <button onClick={() => setShowAdvancedFilters(true)}
                  style={{ padding:'8px 16px', borderRadius:8, border:`1px solid ${C.borderHi}`, background: C.raised, color: C.text2, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'Inter, sans-serif', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:11 }}>⚙</span> Advanced
                  {advancedActive > 0 && <span style={{ background: C.primary, color:'#131313', borderRadius:10, fontSize:10, fontWeight:700, padding:'1px 6px' }}>{advancedActive}</span>}
                </button>
              </div>
            </div>

            {/* Active filter tags */}
            {activeFilters.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>Active Filters:</span>
                {activeFilters.map(f => (
                  <span key={f.key} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:6, background: C.secondaryLo, border:`1px solid rgba(255,179,142,0.25)`, color: C.secondary, fontSize:11, fontWeight:600 }}>
                    {f.label}
                    <button onClick={() => removeFilter(f.key)} style={{ background:'none', border:'none', cursor:'pointer', color: C.secondary, fontSize:13, padding:0, lineHeight:1 }}>×</button>
                  </span>
                ))}
                <button onClick={() => { setFilters({ name:'', roll_no:'', department:'', year:'', cgpa_min:'', cgpa_max:'', achievement_min:'', cert_min:'' }); setActiveFilters([]); fetchStudents({ name:'', roll_no:'', department:'', year:'', cgpa_min:'', cgpa_max:'', achievement_min:'', cert_min:'' }); }}
                  style={{ fontSize:11, color: C.danger, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'Inter, sans-serif' }}>
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Student table */}
          <div style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 160px 80px 90px 70px', alignItems:'center', padding:'10px 20px', borderBottom:`1px solid ${C.border}`, background: C.raised }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div onClick={toggleAll} style={{
                  width:16, height:16, borderRadius:4, cursor:'pointer',
                  border:`2px solid ${selectedIds.size===students.length && students.length>0 ? C.primary : C.borderHi}`,
                  background: selectedIds.size===students.length && students.length>0 ? C.primary : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {selectedIds.size===students.length && students.length>0 && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#131313" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
              <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:700 }}>Student Information</div>
              <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:700 }}>ID / Roll No</div>
              <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:700 }}>Year</div>
              <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:700, textAlign:'right' }}>CGPA</div>
              <div></div>
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding:'48px 0', textAlign:'center', color: C.text3, fontSize:13 }}>Loading students…</div>
            ) : students.length === 0 ? (
              <div style={{ padding:'48px 0', textAlign:'center', color: C.text3, fontSize:13 }}>No students found. Adjust filters and apply.</div>
            ) : (
              students.map((s, idx) => {
                const sel = selectedIds.has(s.id);
                const cgpaColor = s.cgpa >= 8 ? C.success : s.cgpa >= 6 ? C.primary : s.cgpa ? C.secondary : C.text3;
                return (
                  <div key={s.id} onClick={() => toggleStudent(s.id)} style={{
                    display:'grid', gridTemplateColumns:'44px 1fr 160px 80px 90px 70px',
                    alignItems:'center', padding:'12px 20px',
                    borderBottom: idx < students.length-1 ? `1px solid ${C.border}` : 'none',
                    background: sel ? 'rgba(192,193,255,0.05)' : 'transparent',
                    cursor:'pointer', transition:'background 0.12s',
                  }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = C.raised; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Checkbox */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{
                        width:16, height:16, borderRadius:4, flexShrink:0,
                        border:`2px solid ${sel ? C.primary : C.borderHi}`,
                        background: sel ? C.primary : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.12s',
                      }}>
                        {sel && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#131313" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </div>

                    {/* Student info — name + dept only */}
                    <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                      <Avatar name={s.name} size={34} />
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color: C.text1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.name}</div>
                        <div style={{ fontSize:11, color: C.text3, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {s.department || '—'}
                        </div>
                      </div>
                    </div>

                    {/* Roll no */}
                    <div style={{ fontSize:12, color: C.text2, fontFamily:'monospace', letterSpacing:'0.04em' }}>
                      {s.roll_no || '—'}
                    </div>

                    {/* Year */}
                    <div style={{ fontSize:12, color: C.text2 }}>
                      {s.year ? `Year ${s.year}` : '—'}
                    </div>

                    {/* CGPA badge */}
                    <div style={{ textAlign:'right' }}>
                      <span style={{ display:'inline-block', padding:'4px 10px', borderRadius:7, background:`${cgpaColor}18`, color: cgpaColor, fontSize:13, fontWeight:700, fontFamily:'Manrope, Inter, sans-serif' }}>
                        {s.cgpa ?? '—'}
                      </span>
                    </div>

                    {/* View button — own column */}
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <button onClick={e => { e.stopPropagation(); setViewProfile(s); }}
                        style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${C.border}`, background:'none', color: C.text3, fontSize:11, cursor:'pointer', fontFamily:'Inter, sans-serif' }}
                        onMouseEnter={e => { e.currentTarget.style.color=C.primary; e.currentTarget.style.borderColor=C.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.color=C.text3; e.currentTarget.style.borderColor=C.border; }}>
                        View
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Footer */}
            {!loading && students.length > 0 && (
              <div style={{ padding:'12px 20px', borderTop:`1px solid ${C.border}`, fontSize:12, color: C.text3 }}>
                Showing <span style={{ color: C.text1, fontWeight:600 }}>{students.length}</span> student{students.length!==1?'s':''}{selectedIds.size>0 && <> · <span style={{ color: C.primary, fontWeight:600 }}>{selectedIds.size} selected</span></>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel (management tools) ── */}
      <div style={{ width:220, flexShrink:0, background: C.sidebar, borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', padding:'24px 16px', gap:16, overflowY:'auto' }}>
        <div>
          <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:600, marginBottom:6 }}>Management Tools</div>
          <div style={{ fontSize:15, fontWeight:700, color: C.text1, fontFamily:'Manrope, Inter, sans-serif' }}>Student Selection Control</div>
        </div>

        {/* Active selection */}
        <div style={{ background: C.raised, borderRadius:10, padding:'14px 16px', border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>Active Selection</span>
            {selectedIds.size > 0 && <button onClick={() => setSelectedIds(new Set())} style={{ fontSize:11, color: C.danger, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'Inter, sans-serif' }}>Clear All</button>}
          </div>
          <div style={{ fontSize:32, fontWeight:800, color: C.text1, fontFamily:'Manrope, Inter, sans-serif', lineHeight:1 }}>
            {selectedIds.size}
          </div>
          <div style={{ fontSize:12, color: C.text2, marginTop:4 }}>Selected</div>
        </div>

        {/* Bulk actions */}
        <div>
          <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:10 }}>Bulk Actions</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              { icon:'↓', label:'Export Data (.csv)', action: () => { if(selectedIds.size>0) setShowReportModal(true); } },
              { icon:'✉', label:'Compose Email', action: () => setShowMessageModal(true) },
              { icon:'📁', label:'Manage Groups', action: () => setShowGroupsModal(true) },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:`1px solid ${C.border}`, background:'none', color: selectedIds.size>0||item.label==='Manage Groups' ? C.text1 : C.text3, fontSize:12, cursor:'pointer', fontFamily:'Inter, sans-serif', textAlign:'left', opacity: selectedIds.size===0 && item.label!=='Manage Groups' ? 0.4 : 1, transition:'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background=C.raised; e.currentTarget.style.borderColor=C.borderHi; }}
                onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor=C.border; }}>
                <span style={{ fontSize:14 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: C.raised, borderRadius:10, padding:'14px 16px', border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, color: C.text3, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, marginBottom:12 }}>Overview</div>
          {[
            { label:'Total Students', value: students.length, color: C.primary },
            { label:'Avg CGPA', value: avgCgpa, color: C.success },
            { label:'Saved Groups', value: selectionGroups.length, color: C.secondary },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:11, color: C.text2 }}>{s.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color: s.color, fontFamily:'Manrope, Inter, sans-serif' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div style={{ background: C.raised, borderRadius:10, padding:'12px 14px', border:`1px solid ${C.border}`, marginTop:'auto' }}>
          <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ fontSize:14, color: C.primary, flexShrink:0 }}>ℹ</span>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color: C.text1, marginBottom:4 }}>Deep Focus Mode</div>
              <div style={{ fontSize:11, color: C.text3, lineHeight:1.5 }}>Multi-pane selection is optimised for bulk academic reporting.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewProfile && <StudentProfileModal student={viewProfile} onClose={() => setViewProfile(null)} onViewFullProfile={(id) => { setViewProfile(null); setFullProfileUserId(id); }} />}
      {fullProfileUserId && <ProfilePage userId={fullProfileUserId} onClose={() => setFullProfileUserId(null)} />}
      {showGroupsModal && <SelectionGroupsModal groups={selectionGroups} selectedIds={selectedIds} onApplyGroup={applyGroup} onSaveGroup={saveGroup} onDeleteGroup={deleteGroup} onClose={() => setShowGroupsModal(false)} />}
      {showMessageModal && <EmailComposerModal students={selectedStudents} selectionGroups={selectionGroups} onClose={() => setShowMessageModal(false)} />}
      {showReportModal && <ReportModal students={selectedStudents} onClose={() => setShowReportModal(false)} />}
      {showAdvancedFilters && <AdvancedFiltersModal filters={filters} onChange={setFilters} onApply={(f) => handleSearch(f)} onClose={() => setShowAdvancedFilters(false)} />}
    </div>
  );
}
