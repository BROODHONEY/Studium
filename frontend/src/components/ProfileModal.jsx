import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { palette as T, getAvatarBg as avatarBg, getInitials as ini } from '../constants/theme';

// -- Mini card modal shown when clicking any user -------
export default function ProfileModal({ userId, onClose, onViewFull }) {
  const { user: me } = useAuth();
  const isOwn = userId === me?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    profileAPI.get(userId)
      .then(res => { if (!cancelled) setProfile(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const isStudent = profile?.role === 'student';
  const roleBg    = isStudent ? T.primaryLo : T.secondaryLo;
  const roleColor = isStudent ? T.primary   : T.secondary;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: 16 }}
      onClick={onClose}
    >
      {/* gradient glow */}
      <div style={{ position: 'absolute', width: 360, height: 260, background: 'radial-gradient(ellipse at center, rgba(165,166,246,0.10) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div
        style={{ width: '100%', maxWidth: 340, background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', fontFamily: 'Inter, sans-serif', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', position: 'relative', zIndex: 1 }}
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 22, border: `2px solid ${T.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
          </div>
        ) : (
          <>
            {/* Gradient banner */}
            <div style={{ height: 72, background: `linear-gradient(135deg, ${avatarBg(profile?.name)}55 0%, ${T.bg} 100%)`, position: 'relative', flexShrink: 0 }}>
              <button onClick={onClose}
                style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: `1px solid ${T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3 }}
                onMouseEnter={e => e.currentTarget.style.color = T.text2}
                onMouseLeave={e => e.currentTarget.style.color = T.text3}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
              </button>
              {/* Avatar overlapping banner */}
              <div style={{ position: 'absolute', bottom: -28, left: 20, width: 56, height: 56, borderRadius: 14, background: avatarBg(profile?.name), border: `2px solid ${T.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {ini(profile?.name)}
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: '36px 20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: T.text1, margin: '0 0 6px', fontFamily: "'Manrope','Inter',sans-serif", letterSpacing: '-0.01em' }}>{profile?.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: roleBg, color: roleColor, border: `1px solid ${roleColor}40`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {profile?.role}
                    </span>
                    {profile?.roll_no && (
                      <span style={{ fontSize: 11, color: T.text3, fontWeight: 300 }}>{profile.roll_no}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, marginBottom: 14 }}>
                {profile?.department && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 300 }}>Department</span>
                    <span style={{ fontSize: 12, color: T.text2, fontWeight: 400, maxWidth: 180, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.department}</span>
                  </div>
                )}
                {isStudent && profile?.year && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 300 }}>Year</span>
                    <span style={{ fontSize: 12, color: T.text2, fontWeight: 400 }}>{profile.year}</span>
                  </div>
                )}
                {isStudent && profile?.cgpa != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: T.text3, fontWeight: 300 }}>CGPA</span>
                    <span style={{ fontSize: 12, color: T.primary, fontWeight: 600 }}>{Number(profile.cgpa).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => { onClose(); onViewFull(userId); }}
                  style={{ width: '100%', padding: '11px', borderRadius: 10, background: T.primary, border: 'none', color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>
                  View Full Profile
                </button>
                {isOwn && (
                  <button onClick={onClose}
                    style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'none', border: `1px solid ${T.border}`, color: T.text2, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}>
                    Close
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
