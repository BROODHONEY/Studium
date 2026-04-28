import { useState, useEffect } from 'react';
import DemoRequestModal from '../components/DemoRequestModal';
import InstitutionLoginModal from '../components/InstitutionLoginModal';
import Waves from '../components/Waves';
import { demoRequestsAPI } from '../services/api';

const FEATURES = [
  { color: '#FF6B35', bg: 'rgba(255,107,53,0.10)', title: 'Subject Groups', desc: 'Custom study hubs for every course. Organized, focused, distraction-free.',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { color: '#C0C1FF', bg: 'rgba(192,193,255,0.10)', title: 'Real-Time Chat', desc: 'Lightning-fast messaging optimized for academic discourse and collaboration.',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { color: '#22C55E', bg: 'rgba(34,197,94,0.10)', title: 'File Repository', desc: 'Clean upload, organization and instant retrieval for all course materials.',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', title: 'Assignment Tracking', desc: 'Synchronized deadlines keeping every student on track within your ecosystem.',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
];

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ institutionName: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t); };
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await demoRequestsAPI.create({ institutionName: contactForm.institutionName, email: contactForm.email });
      setContactSubmitted(true);
    } catch { setShowDemoModal(true); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* NAV — floating pill */}
      <nav style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 64px)', maxWidth: 900, zIndex: 50, borderRadius: 14,
        transition: 'all 0.3s',
        background: scrolled ? 'rgba(14,9,7,0.94)' : 'rgba(14,9,7,0.78)',
        backdropFilter: 'blur(20px)',
        border: scrolled ? '1px solid rgba(255,107,53,0.22)' : '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 52 }}>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', fontFamily: "'Manrope', Inter, sans-serif" }}>Studi+</span>
          <div style={{ display: 'flex', gap: 28, fontSize: 13, color: '#888' }}>
            {['Home','About','Services','Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#888'}>{item}</a>
            ))}
          </div>
          <button onClick={() => setShowLoginModal(true)}
            style={{ background: '#fff', color: '#0A0A0A', padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Sign in</button>
        </div>
      </nav>

      {/* HERO — full viewport with Waves background */}
      <section id="home" style={{ position: 'relative', height: '100vh', minHeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Waves lineColor="rgba(255,107,53,0.30)" backgroundColor="#0A0A0A" waveSpeedX={0.014} waveSpeedY={0.006} waveAmpX={40} waveAmpY={20} xGap={12} yGap={36} />
        {/* radial vignette */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, rgba(10,10,10,0.75) 100%)', pointerEvents: 'none', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.9s ease, transform 0.9s ease' }}>
          {/* pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '5px 14px 5px 6px', marginBottom: 28 }}>
            <span style={{ background: '#fff', color: '#0A0A0A', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 999 }}>NEW</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>The Academic Sanctuary — now live</span>
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 20px', fontFamily: "'Manrope', Inter, sans-serif", maxWidth: 800 }}>
            The Future of<br />
            <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #FF6B35 0%, #ffb38e 55%, #fff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Academic</em>{' '}
            Communication.
          </h1>

          <p style={{ color: '#777', fontSize: 16, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.65 }}>
            A focused, 24/7 live workspace for students and teachers to connect, share, and excel. Beyond noise. Beyond distractions.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowLoginModal(true)}
              style={{ padding: '13px 30px', borderRadius: 12, border: 'none', background: '#fff', color: '#0A0A0A', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Get started</button>
            <button onClick={() => setShowDemoModal(true)}
              style={{ padding: '13px 30px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#ccc', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}>Request a demo</button>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140, background: 'linear-gradient(to top, #0A0A0A, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      </section>

      {/* FEATURE CARDS */}
      <section style={{ padding: '80px 32px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ color, bg, icon, title, desc }) => (
            <div key={title}
              style={{ background: '#111114', borderRadius: 16, padding: '28px', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.3s, transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}44`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ width: 44, height: 44, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color }}>{icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif" }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '80px 32px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.28em', color: '#555', textTransform: 'uppercase', marginBottom: 20 }}>Our Philosophy</p>
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 24px', fontFamily: "'Manrope', Inter, sans-serif" }}>
              Replacing Noise<br />with{' '}
              <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #FF6B35, #ffb38e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Academic<br />Sanctuary.</em>
            </h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, marginBottom: 16 }}>
              We believe modern education is drowning in the noise of general-purpose social apps. Slack is for corporations. WhatsApp is for friends. Studi+ is for scholars.
            </p>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75 }}>
              Our mission is to provide a high-performance environment that treats academic conversation with the respect it deserves — quiet, organized, and always integrated.
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,107,53,0.15)', height: 320, position: 'relative', background: '#0d0d10' }}>
              <Waves lineColor="rgba(255,107,53,0.18)" backgroundColor="#0d0d10" waveSpeedX={0.008} waveSpeedY={0.004} waveAmpX={28} waveAmpY={14} xGap={14} yGap={40} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(13,13,16,0.65) 100%)', zIndex: 1, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'absolute', bottom: -20, right: -20, background: 'linear-gradient(135deg, #FF6B35 0%, #cc4a1a 100%)', borderRadius: 16, padding: '24px 28px', color: '#fff', boxShadow: '0 20px 60px rgba(255,107,53,0.3)', zIndex: 2 }}>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, fontFamily: "'Manrope', Inter, sans-serif" }}>0</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4, opacity: 0.8 }}>Distractions</div>
            </div>
            <div style={{ position: 'absolute', bottom: 60, left: -24, background: '#111', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 2 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B35', fontFamily: "'Manrope', Inter, sans-serif", lineHeight: 1 }}>99%</div>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Student Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ background: '#111114', borderRadius: 20, padding: '52px 48px 48px', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
            {/* subtle wave accent in contact card */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 200, opacity: 0.4, pointerEvents: 'none', zIndex: 0 }}>
              <Waves lineColor="rgba(255,107,53,0.25)" backgroundColor="transparent" waveSpeedX={0.006} waveSpeedY={0.003} waveAmpX={20} waveAmpY={10} xGap={16} yGap={44} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Institutional Inquiries</h2>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 440 }}>Connect your campus to the Studi+ network. Our team will reach out within 24 hours.</p>
              <form onSubmit={handleContactSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  {[
                    { label: 'Institution Name', key: 'institutionName', type: 'text', placeholder: 'e.g. Oxford University' },
                    { label: 'Professional Email', key: 'email', type: 'email', placeholder: 'admin@domain.edu' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>{label}</label>
                      <input type={type} required value={contactForm[key]} onChange={e => setContactForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                        style={{ width: '100%', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.45)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Brief Narrative</label>
                  <textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your institutional needs..." rows={5}
                    style={{ width: '100%', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,107,53,0.45)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'} />
                </div>
                {contactSubmitted ? (
                  <div style={{ width: '100%', padding: '16px', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 500, background: 'rgba(255,107,53,0.08)', color: '#FF6B35', border: '1px solid rgba(255,107,53,0.2)', boxSizing: 'border-box' }}>
                    ✓ Request received — we'll be in touch within 24 hours
                  </div>
                ) : (
                  <button type="submit"
                    style={{ width: '100%', background: 'rgba(255,107,53,0.80)', color: '#fff', padding: '16px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FF6B35'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,107,53,0.80)'}>Submit</button>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 32px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Manrope', Inter, sans-serif" }}>Studi+</span>
            <span style={{ fontSize: 11, color: '#333' }}>© 2026 Studi+. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#444' }}>
            {['Privacy Policy','Terms of Service','Academic Integrity','Accessibility'].map(l => (
              <a key={l} href="#" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#444'}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {showDemoModal && <DemoRequestModal onClose={() => setShowDemoModal(false)} />}
      {showLoginModal && <InstitutionLoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
