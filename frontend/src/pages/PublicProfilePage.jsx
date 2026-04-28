import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { profileAPI } from '../services/api';
import logo from '../assets/logo.png';

const COLORS = ['#4f46e5','#0d9488','#6366F1','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const T = {
  bg: '#181818', surface: '#1E1E1E', card: '#252525', cardHi: '#2C2C2C',
  border: '#333333', borderHi: '#444444',
  primary: '#FF6B35', primaryHi: '#FF8C5A', primaryLo: 'rgba(255,107,53,0.10)',
  secondary: '#C0C1FF', secondaryLo: 'rgba(192,193,255,0.12)',
  green: '#22C55E', greenLo: 'rgba(34,197,94,0.12)',
  amber: '#F59E0B', amberLo: 'rgba(245,158,11,0.12)',
  text1: '#F0F0F0', text2: '#9E9E9E', text3: '#555555',
};

const fmtDate = (d) => {
  if (!d) return null;
  try {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
    if (iso) return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    return d;
  } catch { return d; }
};

const ICONS = {
  achievement: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935zm10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935z"/></svg>,
  internship:  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5zm1.886 6.914L15 7.151V12.5a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V7.15l6.614 1.764a1.5 1.5 0 0 0 .772 0zM1.5 4h13a.5.5 0 0 1 .5.5v1.616L8.129 7.948a.5.5 0 0 1-.258 0L1 6.116V4.5a.5.5 0 0 1 .5-.5z"/></svg>,
  certificate: <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"/><path d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"/></svg>,
};

function Section({ label, accent, accentLo, icon, count, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: accent, lineHeight: 0 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: accentLo, color: accent, border: `1px solid ${accent}30`, marginLeft: 'auto' }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    profileAPI.getPublic(userId)
      .then(res => setProfile(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [userId]);

  const isStudent = profile?.role === 'student';
  const roleColor = isStudent ? T.primary : T.secondary;
  const roleLo    = isStudent ? T.primaryLo : T.secondaryLo;
  const roleLabel = profile?.role === 'admin' ? 'Admin' : profile?.role === 'teacher' ? 'Instructor' : 'Student';

  const achievements = Array.isArray(profile?.achievements) ? profile.achievements : [];
  const internships  = Array.isArray(profile?.internships)  ? profile.internships  : [];
  const certificates = Array.isArray(profile?.certificates) ? profile.certificates : [];

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text1 }}>
      {/* Top bar */}
      <div style={{ height: 52, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, background: T.surface, position: 'sticky', top: 0, zIndex: 10 }}>
        <img src={logo} alt="Studi+" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: T.text1, letterSpacing: '-0.02em' }}>Studi+</span>
        <span style={{ fontSize: 12, color: T.text3, marginLeft: 4 }}>· Public Profile</span>
        <div style={{ flex: 1 }} />
        <a href="/login" style={{ padding: '6px 14px', borderRadius: 8, background: T.primaryLo, border: `1px solid ${T.primary}40`, color: T.primary, fontSize: 12, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,193,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = T.primaryLo}>
          Sign in
        </a>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 60px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{ width: 28, height: 28, border: `2px solid ${T.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}

        {notFound && !loading && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontSize: 16, color: T.text2, fontWeight: 400 }}>Profile not found.</p>
            <p style={{ fontSize: 13, color: T.text3, fontWeight: 300, marginTop: 8 }}>This link may be invalid or the user no longer exists.</p>
          </div>
        )}

        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Hero */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: '28px 32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 340, height: '100%', background: `radial-gradient(ellipse at top right, ${roleColor}10 0%, transparent 65%)`, pointerEvents: 'none' }} />
              <div style={{ width: 96, height: 96, borderRadius: 20, background: avatarBg(profile.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff', flexShrink: 0, border: `2px solid ${T.borderHi || T.border}`, position: 'relative', zIndex: 1 }}>
                {ini(profile.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, background: roleLo, border: `1px solid ${roleColor}40`, fontSize: 9, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                  {roleLabel}
                </span>
                <h1 style={{ fontSize: 36, fontWeight: 800, color: T.text1, margin: '0 0 6px', fontFamily: "'Manrope','Inter',sans-serif", letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                  {profile.name}
                </h1>
                <p style={{ fontSize: 14, fontWeight: 300, color: T.text2, margin: 0 }}>
                  {profile.department || 'No department set'}
                  {profile.year ? ` · ${profile.year}` : ''}
                </p>
              </div>
            </div>

            {isStudent && (
              <>
                {/* Info strip */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                  {[
                    { label: 'Department',    value: profile.department },
                    { label: 'Year / Tenure', value: profile.year },
                    { label: 'Roll Number',   value: profile.roll_no },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>{label}</p>
                      <p style={{ fontSize: 16, fontWeight: 600, color: T.text1, margin: 0 }}>{value || ' · · '}</p>
                    </div>
                  ))}
                </div>

                {/* CGPA */}
                {profile.cgpa != null && (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '24px 28px' }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 12px' }}>Academic Performance</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 56, fontWeight: 800, color: T.primary, fontFamily: "'Manrope','Inter',sans-serif", lineHeight: 1 }}>{Number(profile.cgpa).toFixed(2)}</span>
                      <span style={{ fontSize: 16, color: T.text3, fontWeight: 300 }}>/ 10.0</span>
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {achievements.length > 0 && (
                  <Section label="Achievements" accent={T.primary} accentLo={T.primaryLo} icon={ICONS.achievement} count={achievements.length}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {achievements.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: T.text1, margin: 0 }}>{item.title}</p>
                            {item.description && <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '2px 0 0' }}>{item.description}</p>}
                            {item.date && <p style={{ fontSize: 10, fontWeight: 500, color: T.primary, margin: '3px 0 0' }}>{fmtDate(item.date)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Certificates */}
                {certificates.length > 0 && (
                  <Section label="Certifications" accent={T.green} accentLo={T.greenLo} icon={ICONS.certificate} count={certificates.length}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {certificates.map((item, i) => (
                        <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: 0 }}>{item.title}</p>
                            {item.issuedBy && <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '3px 0 0' }}>{item.issuedBy}</p>}
                            {item.date && <p style={{ fontSize: 10, fontWeight: 500, color: T.green, margin: '4px 0 0' }}>{fmtDate(item.date)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Internships */}
                {internships.length > 0 && (
                  <Section label="Internships" accent={T.secondary} accentLo={T.secondaryLo} icon={ICONS.internship} count={internships.length}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {internships.map((item, i) => (
                        <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, borderLeft: `3px solid ${T.secondary}`, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: 0 }}>{item.title}</p>
                            {item.where && <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '3px 0 0' }}>{item.where}</p>}
                            {item.description && <p style={{ fontSize: 11, fontWeight: 300, color: T.text2, margin: '3px 0 0' }}>{item.description}</p>}
                            {item.fromDate && (
                              <p style={{ fontSize: 10, fontWeight: 500, color: T.secondary, margin: '4px 0 0' }}>
                                {fmtDate(item.fromDate)}{item.toDate ? `  ·  ${fmtDate(item.toDate)}` : '  ·  Present'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



