import { useEffect, useState } from 'react';
import AnimatedContent from '../AnimatedContent';

const DURATION = 220;

export default function ConfirmDialog({
  open, title, description,
  confirmText = 'Confirm', cancelText = 'Cancel',
  danger = false, onConfirm, onCancel, disabled = false,
}) {
  const [phase, setPhase] = useState('closed');

  useEffect(() => {
    if (open) {
      setPhase('entering');
      const t = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')));
      return () => cancelAnimationFrame(t);
    } else {
      if (phase === 'closed') return;
      setPhase('leaving');
      const t = setTimeout(() => setPhase('closed'), DURATION);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (phase === 'closed') return null;
  const visible = phase === 'open';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: visible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
        transition: `background ${DURATION}ms ease, backdrop-filter ${DURATION}ms ease`,
      }}
      onClick={e => e.target === e.currentTarget && !disabled && onCancel?.()}
    >
      <div style={{
        position: 'absolute', width: 400, height: 280,
        background: `radial-gradient(ellipse at center, ${danger ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,53,0.07)'} 0%, transparent 70%)`,
        pointerEvents: 'none', borderRadius: '50%',
        opacity: visible ? 1 : 0, transition: `opacity ${DURATION}ms ease`,
      }} />

      <AnimatedContent immediate distance={16} duration={0.28} ease="power3.out" scale={0.97}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1,
                 opacity: visible ? 1 : 0, transition: `opacity ${DURATION}ms ease` }}>
        <div
          style={{ background: '#0a0a0a', border: `1px solid ${danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 20, padding: '36px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', fontFamily: 'Inter, sans-serif' }}
          onClick={e => e.stopPropagation()}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: danger ? 'rgba(239,68,68,0.6)' : '#444', textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 10px' }}>
            {danger ? 'Destructive Action' : 'Confirmation Required'}
          </p>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 10px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>
            {title}
          </h3>
          {description && (
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65, margin: '0 0 28px' }}>{description}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" onClick={onConfirm} disabled={disabled}
              style={{ width: '100%', padding: '14px', background: danger ? 'rgba(239,68,68,0.75)' : '#FF6B35', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              {confirmText}
            </button>
            <button type="button" onClick={onCancel} disabled={disabled}
              style={{ width: '100%', padding: '13px', background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#666', fontSize: 14, fontWeight: 400, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
              onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#666'; }}>
              {cancelText}
            </button>
          </div>
        </div>
      </AnimatedContent>
    </div>
  );
}
