import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';

const COLORS = ['#4f46e5','#0d9488','#6366F1','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const T = {
  bg:        '#181818',
  surface:   '#1E1E1E',
  card:      '#252525',
  cardHi:    '#2C2C2C',
  border:    '#333333',
  borderHi:  '#444444',
  primary:   '#FF6B35',
  primaryHi: '#FF8C5A',
  primaryLo: 'rgba(255,107,53,0.10)',
  secondary: '#C0C1FF',
  secondaryLo: 'rgba(192,193,255,0.12)',
  green:     '#22C55E',
  greenLo:   'rgba(34,197,94,0.12)',
  amber:     '#F59E0B',
  amberLo:   'rgba(245,158,11,0.12)',
  text1:     '#F0F0F0',
  text2:     '#9E9E9E',
  text3:     '#555555',
  danger:    '#EF4444',
};

// -- Achievement compact card ---------------------------
function AchievementCard({ item, accent, accentLo, icon }) {
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }); }
    catch { return d; }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.text1, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
        {item.subtitle && <p style={{ fontSize: 10, fontWeight: 300, color: T.text2, margin: '2px 0 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</p>}
        {item.date && <p style={{ fontSize: 9, fontWeight: 500, color: accent, margin: '3px 0 0' }}>{fmtDate(item.date)}</p>}
      </div>
    </div>
  );
}

// -- Certificate horizontal card -----------------------
function CertCard({ item, accent, accentLo, icon }) {
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }); }
    catch { return d; }
  };
  const status = item.date ? 'ACTIVE' : 'IN PROGRESS';
  const statusColor = item.date ? T.green : T.amber;
  const statusBg    = item.date ? T.greenLo : T.amberLo;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, transition: 'border-color 0.15s', minWidth: 0 }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: statusBg, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${statusColor}30` }}>
          {status}
        </span>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: 0, lineHeight: 1.3 }}>{item.title}</p>
        {item.subtitle && <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '3px 0 0' }}>{item.subtitle}</p>}
        {item.date && <p style={{ fontSize: 10, fontWeight: 500, color: accent, margin: '4px 0 0' }}>{fmtDate(item.date)}</p>}
      </div>
    </div>
  );
}

// -- Internship card ------------------------------------
function InternCard({ item, accent, accentLo, icon }) {
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }); }
    catch { return d; }
  };
  const isImage = (type) => type?.startsWith('image/');
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, borderLeft: `3px solid ${accent}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: 0, lineHeight: 1.3 }}>{item.title}</p>
          {item.subtitle && <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '3px 0 0', lineHeight: 1.4 }}>{item.subtitle}</p>}
          {item.date && <p style={{ fontSize: 10, fontWeight: 500, color: accent, margin: '4px 0 0' }}>{fmtDate(item.date)}</p>}
        </div>
      </div>
      {item.attachments?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 14px 12px 14px' }}>
          {item.attachments.map((att, ai) => (
            isImage(att.type)
              ? <a key={ai} href={att.url} target="_blank" rel="noreferrer">
                  <img src={att.url} alt={att.name} style={{ height: 56, width: 80, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, display: 'block' }} />
                </a>
              : <a key={ai} href={att.url} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill={accent}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                  <span style={{ fontSize: 11, color: T.text2, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                </a>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Detail Modal --------------------------------------
function DetailModal({ item, type, accent, onClose }) {
  const fmtDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };
  const isImage = (t) => t?.startsWith('image/');

  const typeLabel = type === 'achievement' ? 'Achievement' : type === 'certificate' ? 'Certificate' : 'Internship';
  const typeIcon  = ICONS[type === 'achievement' ? 'achievement' : type === 'certificate' ? 'certificate' : 'internship'];

  const statusColor = item.date ? T.green : T.amber;
  const statusBg    = item.date ? T.greenLo : T.amberLo;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: accent, lineHeight: 0, flexShrink: 0 }}>{typeIcon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', flex: 1 }}>{typeLabel}</span>
          {type === 'certificate' && (
            <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: statusBg, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${statusColor}30` }}>
              {item.date ? 'Active' : 'In Progress'}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, padding: 4, lineHeight: 0, marginLeft: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = T.text1}
            onMouseLeave={e => e.currentTarget.style.color = T.text3}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text1, margin: '0 0 6px', fontFamily: "'Manrope','Inter',sans-serif", lineHeight: 1.2 }}>{item.title}</h2>
            {item.subtitle && <p style={{ fontSize: 13, fontWeight: 300, color: T.text2, margin: 0, lineHeight: 1.6 }}>{item.subtitle}</p>}
          </div>

          {item.date && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill={accent}><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>
              <span style={{ fontSize: 12, fontWeight: 500, color: accent }}>{fmtDate(item.date)}</span>
            </div>
          )}

          {item.description && (
            <div style={{ background: T.card, borderRadius: 10, padding: '12px 14px', border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 12, fontWeight: 300, color: T.text2, margin: 0, lineHeight: 1.7 }}>{item.description}</p>
            </div>
          )}

          {item.attachments?.length > 0 && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Attachments</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.attachments.map((att, ai) => (
                  isImage(att.type)
                    ? <a key={ai} href={att.url} target="_blank" rel="noreferrer">
                        <img src={att.url} alt={att.name} style={{ height: 72, width: 100, objectFit: 'cover', borderRadius: 8, border: `1px solid ${T.border}`, display: 'block' }} />
                      </a>
                    : <a key={ai} href={att.url} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, textDecoration: 'none', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill={accent}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                        <span style={{ fontSize: 11, color: T.text2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                      </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const ICONS = {
  achievement: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935z"/></svg>,
  internship:  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5zm1.886 6.914L15 7.151V12.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V7.15l6.614 1.764a1.5 1.5 0 0 0 .772 0zM1.5 4h13a.5.5 0 0 1 .5.5v1.616L8.129 7.948a.5.5 0 0 1-.258 0L1 6.116V4.5a.5.5 0 0 1 .5-.5z"/></svg>,
  certificate: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/><path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/></svg>,
};

export default function ProfilePage({ userId, onClose }) {
  const { user: me } = useAuth();
  const isOwn = userId === me?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState(null); // { item, type, accent }

  const handleShare = () => {
    const url = `${window.location.origin}/profile/${userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    setLoading(true);
    profileAPI.get(userId)
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const isStudent  = profile?.role === 'student';
  const roleColor  = isStudent ? T.primary   : T.secondary;
  const roleLo     = isStudent ? T.primaryLo : T.secondaryLo;
  const roleLabel  = profile?.role === 'admin' ? 'Admin' : profile?.role === 'teacher' ? 'Instructor' : 'Student';

  const achievements = Array.isArray(profile?.achievements) ? profile.achievements : [];
  const internships  = Array.isArray(profile?.internships)  ? profile.internships  : [];
  const certificates = Array.isArray(profile?.certificates) ? profile.certificates : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: T.bg, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{ height: 52, flexShrink: 0, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, background: T.surface }}>
        <button onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, background: 'none', border: `1px solid ${T.border}`, color: T.text2, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/></svg>
          Back
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.text2 }}>{isOwn ? 'Your Profile' : 'Profile'}</span>
        <div style={{ flex: 1 }} />
        <button onClick={handleShare}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 8, background: copied ? T.greenLo : 'none', border: `1px solid ${copied ? T.green + '60' : T.border}`, color: copied ? T.green : T.text2, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
          onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; } }}
          onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; } }}>
          {copied
            ? <><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> Copied!</>
            : <><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg> Share</>
          }
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${T.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
          </div>
        ) : (
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 60px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/*  · ·  · ·  Hero row: avatar + name + role  · ·  · ·  */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '28px 32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 28 }}>
              {/* Ambient glow */}
              <div style={{ position: 'absolute', top: 0, right: 0, width: 340, height: '100%', background: `radial-gradient(ellipse at top right, ${roleColor}10 0%, transparent 65%)`, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: 200, height: '60%', background: 'radial-gradient(ellipse at bottom left, rgba(192,193,255,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

              {/* Avatar */}
              <div style={{ width: 96, height: 96, borderRadius: 20, background: avatarBg(profile?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff', flexShrink: 0, border: `2px solid ${T.borderHi}`, position: 'relative', zIndex: 1 }}>
                {ini(profile?.name)}
              </div>

              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, background: roleLo, border: `1px solid ${roleColor}40`, fontSize: 9, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                  {roleLabel}
                </span>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: T.text1, margin: '0 0 6px', fontFamily: "'Manrope','Inter',sans-serif", letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                  {profile?.name}
                </h1>
                <p style={{ fontSize: 14, fontWeight: 300, color: T.text2, margin: 0 }}>
                  {profile?.department || 'No department set'}
                  {profile?.year ? ` · ${profile.year}${['st', 'nd', 'rd'][profile.year - 1] || 'th'} year` : ''}
                </p>
              </div>
            </div>

            {/*  · ·  · ·  Student layout  · ·  · ·  */}
            {isStudent && (
              <>
                {/* Info strip: dept / year / roll */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                  {[
                    { label: 'Department',    value: profile?.department },
                    { label: 'Year / Tenure', value: profile?.year },
                    { label: 'Roll Number',   value: profile?.roll_no },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>{label}</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: T.text1, margin: 0, lineHeight: 1.3 }}>{value || ' · · '}</p>
                    </div>
                  ))}
                </div>

                {/* CGPA + achievements side by side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'stretch' }}>

                  {/* Left: CGPA card + stats card stacked */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `${T.primary}06`, pointerEvents: 'none' }} />
                    <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Academic Performance</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 56, fontWeight: 800, color: T.primary, fontFamily: "'Manrope','Inter',sans-serif", lineHeight: 1 }}>
                        {profile?.cgpa != null ? Number(profile.cgpa).toFixed(2) : ' · · '}
                      </span>
                      {profile?.cgpa != null && <span style={{ fontSize: 16, color: T.text3, fontWeight: 300 }}>/ 10.0</span>}
                    </div>
                    {profile?.cgpa != null && (
                      <p style={{ fontSize: 11, fontWeight: 600, color: T.secondary, margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M7.247 4.86l-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/></svg>
                        CGPA Score
                      </p>
                    )}
                    {/* Account info strip */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {profile?.email && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: T.text3 }}>Email</span>
                          <span style={{ fontSize: 12, color: T.text2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.email}</span>
                        </div>
                      )}
                      {profile?.phone && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: T.text3 }}>Phone</span>
                          <span style={{ fontSize: 12, color: T.text2 }}>{profile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats card below CGPA */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 28px', flex: 1 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>Activity</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Achievements', value: achievements.length, color: T.primary, bg: T.primaryLo },
                        { label: 'Certificates',  value: certificates.length,  color: T.green,   bg: T.greenLo },
                        { label: 'Internships',   value: internships.length,   color: T.secondary, bg: T.secondaryLo },
                      ].map(({ label, value, color, bg }) => (
                        <div key={label} style={{ background: bg, border: `1px solid ${color}25`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                          <p style={{ fontSize: 24, fontWeight: 800, color, margin: 0, fontFamily: "'Manrope','Inter',sans-serif", lineHeight: 1 }}>{value}</p>
                          <p style={{ fontSize: 9, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '5px 0 0' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  </div>{/* end left column */}

                  {/* Right: achievements column */}
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ color: T.primary, lineHeight: 0 }}>{ICONS.achievement}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Achievements</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: T.primaryLo, color: T.primary, border: `1px solid ${T.primary}30`, marginLeft: 'auto' }}>{achievements.length}</span>
                    </div>
                    {achievements.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
                        {achievements.map((item, i) => (
                          <div key={i} onClick={() => setSelected({ item, type: 'achievement', accent: T.primary })} style={{ cursor: 'pointer' }}>
                            <AchievementCard item={item} accent={T.primary} accentLo={T.primaryLo} icon={ICONS.achievement} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 20px', color: T.text3, fontSize: 13 }}>
                        No achievements added yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificates section */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ color: T.green, lineHeight: 0 }}>{ICONS.certificate}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Professional Certifications</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: T.greenLo, color: T.green, border: `1px solid ${T.green}30`, marginLeft: 'auto' }}>{certificates.length}</span>
                  </div>
                  {certificates.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {certificates.map((item, i) => (
                        <div key={i} onClick={() => setSelected({ item, type: 'certificate', accent: T.green })} style={{ cursor: 'pointer' }}>
                          <CertCard item={item} accent={T.green} accentLo={T.greenLo} icon={ICONS.certificate} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 20px', color: T.text3, fontSize: 13 }}>
                      No certifications added yet
                    </div>
                  )}
                </div>

                {/* Internships section */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ color: T.secondary, lineHeight: 0 }}>{ICONS.internship}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Internships</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: T.secondaryLo, color: T.secondary, border: `1px solid ${T.secondary}30`, marginLeft: 'auto' }}>{internships.length}</span>
                  </div>
                  {internships.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {internships.map((item, i) => (
                        <div key={i} onClick={() => setSelected({ item, type: 'internship', accent: T.secondary })} style={{ cursor: 'pointer' }}>
                          <InternCard item={item} accent={T.secondary} accentLo={T.secondaryLo} icon={ICONS.internship} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px 20px', color: T.text3, fontSize: 13 }}>
                      No internships added yet
                    </div>
                  )}
                </div>
              </>
            )}

            {/*  · ·  · ·  Non-student layout  · ·  · ·  */}
            {!isStudent && (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px 28px' }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 16px' }}>Account Info</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {profile?.faculty_role && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: T.text3 }}>Faculty Role</span>
                      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                        {profile.faculty_role}
                      </span>
                    </div>
                  )}
                  {profile?.email && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: T.text3 }}>Email</span>
                      <span style={{ fontSize: 13, color: T.text2 }}>{profile.email}</span>
                    </div>
                  )}
                  {profile?.department && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: T.text3 }}>Department</span>
                      <span style={{ fontSize: 13, color: T.text2 }}>{profile.department}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: T.text3 }}>Phone</span>
                      <span style={{ fontSize: 13, color: T.text2 }}>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/*  · ·  · ·  Own-profile hint  · ·  · ·  */}
            {isOwn && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, background: 'rgba(192,193,255,0.06)', border: '1px solid rgba(255,107,53,0.10)', marginTop: 4 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#FF6B35', flexShrink: 0 }}>
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.892 3.433-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.892-1.64-.901-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
                </svg>
                <p style={{ fontSize: 12, fontWeight: 300, color: '#9E9E9E', margin: 0 }}>
                  To update your profile, go to <span style={{ color: '#FF6B35', fontWeight: 500 }}>Settings  ·  Account</span>
                </p>
              </div>
            )}

          </div>
        )}
      </div>

      {selected && (
        <DetailModal item={selected.item} type={selected.type} accent={selected.accent} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}




