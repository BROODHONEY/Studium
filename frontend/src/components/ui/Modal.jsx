import { useEffect, useRef, useState } from 'react';
import AnimatedContent from '../AnimatedContent';

const DURATION = 240;

export default function Modal({ open = true, onClose, children, maxWidth = 520 }) {
  const closeButtonRef = useRef(null);
  const [phase, setPhase] = useState('closed');

  useEffect(() => {
    if (open) {
      setPhase('entering');
      const t = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')));
      closeButtonRef.current?.focus?.();
      const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
      window.addEventListener('keydown', onKey);
      return () => { cancelAnimationFrame(t); window.removeEventListener('keydown', onKey); };
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
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
        background: visible ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0)',
        backdropFilter: visible ? 'blur(14px)' : 'blur(0px)',
        transition: `background ${DURATION}ms ease, backdrop-filter ${DURATION}ms ease`,
      }}
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      {/* orange radial glow */}
      <div style={{
        position: 'absolute', width: 560, height: 360,
        background: 'radial-gradient(ellipse at center, rgba(255,107,53,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
        opacity: visible ? 1 : 0,
        transition: `opacity ${DURATION}ms ease`,
      }} />

      {/* AnimatedContent wraps the card for the entrance slide */}
      <AnimatedContent
        immediate
        distance={20}
        direction="vertical"
        duration={0.32}
        ease="power3.out"
        scale={0.97}
        style={{ width: '100%', maxWidth, position: 'relative', zIndex: 1 }}
      >
        <div
          role="dialog"
          aria-modal="true"
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255,107,53,0.12)',
            borderRadius: 20,
            width: '100%',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,53,0.06)',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            overflow: 'hidden',
            opacity: visible ? 1 : 0,
            transition: `opacity ${DURATION}ms ease`,
          }}
        >
          {/* subtle corner glow */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

          {/* close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              width: 30, height: 30, borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)', color: '#666',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,53,0.12)'; e.currentTarget.style.color = '#FF6B35'; e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#666'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
            </svg>
          </button>

          <div style={{ position: 'relative', zIndex: 2, padding: 40 }}>
            {children}
          </div>
        </div>
      </AnimatedContent>
    </div>
  );
}
