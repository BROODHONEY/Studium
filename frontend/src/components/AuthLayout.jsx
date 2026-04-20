import { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.png';

// ââââ Add / remove slides here ââââââââââââââââââââââââââââââââââââââââââââââââââââ
import slide1 from '../assets/carousel/1.jpeg';
import slide2 from '../assets/carousel/2.jpeg';
import slide3 from '../assets/carousel/3.jpeg';
import slide4 from '../assets/carousel/4.jpeg';
import slide5 from '../assets/carousel/5.jpeg';

const SLIDES   = [slide1, slide2, slide3, slide4, slide5];
const INTERVAL = 4500;

// ââââ Carousel ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
// Each slide is absolutely positioned; the active one translates to 0,
// the previous slides sit at -100% and incoming at +100%.
function BgCarousel({ slides, cur, prev }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {slides.map((src, i) => {
        let x = '100%';
        if (i === cur)  x = '0%';
        else if (i === prev) x = '-100%';
        return (
          <img key={i} src={src} alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              transform: `translateX(${x})`,
              transition: (i === cur || i === prev)
                ? 'transform 0.75s cubic-bezier(0.77, 0, 0.175, 1)'
                : 'none',
              willChange: 'transform',
            }} />
        );
      })}
    </div>
  );
}

// ââââ Layout shell ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export default function AuthLayout({ children, tagline, sub, institution }) {
  const [cur, setCur]   = useState(0);
  const [prev, setPrev] = useState(null);
  const curRef = useRef(0);

  const goTo = (n) => {
    if (n === curRef.current) return;
    setPrev(curRef.current);
    curRef.current = n;
    setCur(n);
  };

  useEffect(() => {
    if (SLIDES.length < 2) return;
    const id = setInterval(() => {
      goTo((curRef.current + 1) % SLIDES.length);
    }, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0E0E0F', fontFamily: 'Inter, sans-serif',
      padding: '24px', boxSizing: 'border-box', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', width: '100%', maxWidth: 980,
        height: '100%', maxHeight: 700,
        borderRadius: 28, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* ââââ Left panel ââââ */}
        <div className="auth-left-panel" style={{
          position: 'relative', flexShrink: 0, overflow: 'hidden',
          borderRadius: '28px 0 0 28px',
        }}>
          <BgCarousel slides={SLIDES} cur={cur} prev={prev} />

          {/* Gradient overlays */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            background: 'linear-gradient(to bottom, rgba(10,10,14,0.38) 0%, rgba(10,10,14,0.08) 45%, rgba(10,10,14,0.82) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.28) 0%, transparent 65%)',
          }} />

          {/* Content ââ logo top, dots + text bottom */}
          <div style={{
            position: 'relative', zIndex: 3, height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '28px 32px',
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={logo} alt="Studi+" style={{ width: 32, height: 32, borderRadius: 9, objectFit: 'contain' }} />
              <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Studi+</span>
            </div>

            {/* Bottom block: dots sit above text, no overlap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Dots */}
              {SLIDES.length > 1 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {SLIDES.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      style={{
                        width: i === cur ? 22 : 6, height: 6, borderRadius: 3, padding: 0,
                        background: i === cur ? '#fff' : 'rgba(255,255,255,0.28)',
                        border: 'none', cursor: 'pointer',
                        transition: 'width 0.35s ease, background 0.35s ease',
                      }} />
                  ))}
                </div>
              )}
              {/* Tagline */}
              <div>
                <h2 style={{
                  fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px',
                  lineHeight: 1.2, letterSpacing: '-0.02em',
                  fontFamily: "'Manrope', 'Inter', sans-serif",
                }}>{tagline}</h2>
                <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>{sub}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ââââ Right panel ââ scrollable ââââ */}
        <div style={{
          flex: 1, overflowY: 'auto', backgroundColor: '#131313',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 48px',
          position: 'relative'
        }}>
          {/* Institution badge in top right */}
          {institution && (
            <div style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#C0C1FF' }}>
                {institution.name}
              </span>
            </div>
          )}
          
          <div style={{ width: '100%', maxWidth: 360, margin: 'auto 0' }} className="anim-slide-up">
            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
