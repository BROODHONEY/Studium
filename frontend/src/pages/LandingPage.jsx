import { useState, useEffect } from 'react';
import DemoRequestModal from '../components/DemoRequestModal';
import InstitutionLoginModal from '../components/InstitutionLoginModal';
import { demoRequestsAPI } from '../services/api';

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ institutionName: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await demoRequestsAPI.create({ institutionName: contactForm.institutionName, email: contactForm.email });
      setContactSubmitted(true);
    } catch {
      setShowDemoModal(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 50,
        transition: 'all 0.3s',
        background: scrolled ? 'rgba(10,10,10,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>Studi+</span>
            <div style={{ display: 'flex', gap: 28, fontSize: 13, color: '#888' }}>
              {['Home','About Us','Services','Contact'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(' ','')}`}
                  style={{ color: '#888', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#888'}
                >{item}</a>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 10, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Looking for a better solution?</span>
            <button
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
              style={{ background: '#A5A6F6', color: '#000', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#9394E8'}
              onMouseLeave={e => e.currentTarget.style.background = '#A5A6F6'}
            >Contact Us</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ paddingTop: 120, paddingBottom: 0, paddingLeft: 32, paddingRight: 32, position: 'relative', overflow: 'hidden' }}>
        {/* ambient glows */}
        <div style={{ position: 'absolute', top: -100, left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(165,166,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(165,166,246,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* eyebrow */}
          <p style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.28em', color: '#555', textTransform: 'uppercase', marginBottom: 24 }}>The Academic Sanctuary</p>

          {/* headline */}
          <h1 style={{ textAlign: 'center', fontSize: 'clamp(52px, 8vw, 88px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 24px', fontFamily: "'Manrope', Inter, sans-serif" }}>
            The Future of<br />
            <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #A5A6F6 0%, #C0C1FF 50%, #e0e0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Academic</em><br />
            Communication.
          </h1>

          {/* sub */}
          <p style={{ textAlign: 'center', color: '#666', fontSize: 16, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.65 }}>
            A focused, 24/7 live workspace for students and teachers to connect, share, and excel. Beyond noise. Beyond distractions.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 72 }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            >Login to Institution</button>
            <button
              onClick={() => setShowDemoModal(true)}
              style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid rgba(165,166,246,0.4)', background: 'rgba(165,166,246,0.08)', color: '#C0C1FF', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(165,166,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(165,166,246,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(165,166,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(165,166,246,0.4)'; }}
            >Request a Demo</button>
          </div>

          {/* Hero visual — dark workspace photo */}
          <div style={{ position: 'relative', borderRadius: '20px 20px 0 0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none' }}>
            {/* fade overlay at bottom */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0A0A0A 0%, rgba(10,10,10,0.3) 40%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #0a0a12 50%, #080810 100%)', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* simulated dark UI preview */}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 0 }}>
                {/* sidebar */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.04)', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 8, width: '60%', background: 'rgba(165,166,246,0.3)', borderRadius: 4, marginBottom: 16 }} />
                  {[80,65,90,55,70].map((w,i) => <div key={i} style={{ height: 6, width: `${w}%`, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />)}
                  <div style={{ marginTop: 12, height: 6, width: '50%', background: 'rgba(165,166,246,0.15)', borderRadius: 3 }} />
                  {[60,75,45].map((w,i) => <div key={i} style={{ height: 6, width: `${w}%`, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />)}
                </div>
                {/* main chat area */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }} />
                  {[
                    { w: '70%', align: 'left', accent: true },
                    { w: '50%', align: 'right', accent: false },
                    { w: '80%', align: 'left', accent: false },
                    { w: '45%', align: 'right', accent: true },
                    { w: '65%', align: 'left', accent: false },
                  ].map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      <div style={{ height: 28, width: m.w, background: m.accent ? 'rgba(165,166,246,0.12)' : 'rgba(255,255,255,0.04)', borderRadius: 8, border: m.accent ? '1px solid rgba(165,166,246,0.15)' : '1px solid rgba(255,255,255,0.04)' }} />
                    </div>
                  ))}
                </div>
                {/* right panel */}
                <div style={{ background: 'rgba(255,255,255,0.015)', borderLeft: '1px solid rgba(255,255,255,0.04)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ height: 8, width: '55%', background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }} />
                  {[1,2,3].map(i => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ height: 6, width: '80%', background: 'rgba(255,255,255,0.07)', borderRadius: 3, marginBottom: 6 }} />
                      <div style={{ height: 5, width: '55%', background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS (2-col) ── */}
      <section style={{ padding: '0 32px 80px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'linear-gradient(135deg, #111118 0%, #0d0d14 100%)', borderRadius: 16, padding: '32px', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(165,166,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
          >
            <div style={{ width: 36, height: 36, background: 'rgba(165,166,246,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="18" height="18" fill="none" stroke="#A5A6F6" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 10px', fontFamily: "'Manrope', Inter, sans-serif" }}>Unified Workspace</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>Everything you need in one collaborative space. No more switching between apps.</p>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #111118 0%, #0d0d14 100%)', borderRadius: 16, padding: '32px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(165,166,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
          >
            <div style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, background: 'rgba(165,166,246,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" stroke="#A5A6F6" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div style={{ width: 36, height: 36, background: 'rgba(165,166,246,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg width="18" height="18" fill="none" stroke="#A5A6F6" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 10px', fontFamily: "'Manrope', Inter, sans-serif" }}>Verified Only</h3>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>Secure, institution-verified access ensures only real students and educators participate, ensuring absolute academic integrity.</p>
          </div>
        </div>
      </section>

      {/* ── ABOUT / VALUE PROP ── */}
      <section id="about" style={{ padding: '80px 32px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* left */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.28em', color: '#555', textTransform: 'uppercase', marginBottom: 20 }}>Our Philosophy</p>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: '0 0 24px', fontFamily: "'Manrope', Inter, sans-serif" }}>
              Replacing Noise<br />with{' '}
              <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg, #A5A6F6, #C0C1FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Academic<br />Sanctuary.</em>
            </h2>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, marginBottom: 16 }}>
              We believe that modern education is drowning in the noise of general-purpose social apps. Slack is for corporations. WhatsApp is for friends. Studi+ is for scholars.
            </p>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, marginBottom: 0 }}>
              Our mission is to provide a high-performance environment that treats academic conversation with the respect it deserves — quiet, organized, and always integrated.
            </p>
          </div>

          {/* right — dark visual + stat overlay */}
          <div style={{ position: 'relative' }}>
            {/* main dark card */}
            <div style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #0a0a12 100%)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', height: 320, position: 'relative' }}>
              {/* abstract grid lines */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 25}%`, height: 1, background: 'linear-gradient(90deg, transparent, rgba(165,166,246,0.5), transparent)' }} />
                ))}
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${i * 25}%`, width: 1, background: 'linear-gradient(180deg, transparent, rgba(165,166,246,0.3), transparent)' }} />
                ))}
              </div>
              {/* center glow */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 200, height: 200, background: 'radial-gradient(circle, rgba(165,166,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              {/* writing icon */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.12 }}>
                <svg width="80" height="80" fill="none" stroke="#A5A6F6" strokeWidth="1" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
            </div>

            {/* stat card overlay */}
            <div style={{ position: 'absolute', bottom: -20, right: -20, background: 'linear-gradient(135deg, #A5A6F6 0%, #9394E8 100%)', borderRadius: 16, padding: '24px 28px', color: '#000', boxShadow: '0 20px 60px rgba(165,166,246,0.25)' }}>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, fontFamily: "'Manrope', Inter, sans-serif" }}>0</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 4, opacity: 0.7 }}>Distractions</div>
            </div>

            {/* 99% card */}
            <div style={{ position: 'absolute', bottom: 60, left: -24, background: '#111', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#A5A6F6', fontFamily: "'Manrope', Inter, sans-serif", lineHeight: 1 }}>99%</div>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>Student Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '80px 32px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 10, letterSpacing: '0.28em', color: '#555', textTransform: 'uppercase', marginBottom: 16 }}>The Ecosystem</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 64px', fontFamily: "'Manrope', Inter, sans-serif" }}>Engineered for Excellence.</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {[
              { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, title: 'Subject Groups', desc: 'Custom study hubs for every course. For small talk, just join common hosts.' },
              { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, title: 'Real-Time Chat', desc: 'Lightning-fast messaging optimized for academic discourse and collaboration.' },
              { color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: 'File Repository', desc: 'Version-controlled storage with clean upload, organization and instant retrieval.' },
              { color: '#A5A6F6', bg: 'rgba(165,166,246,0.1)', icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, title: 'Assignment Tracking', desc: 'Synchronized deadlines and milestones keeping all students within your ecosystem.' },
            ].map(({ color, bg, icon, title, desc }) => (
              <div key={title} style={{ cursor: 'default' }}>
                <div style={{ width: 48, height: 48, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif" }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: '80px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ background: '#111114', borderRadius: 20, padding: '52px 48px 48px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 12px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Institutional Inquiries</h2>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 40px', lineHeight: 1.65, maxWidth: 440 }}>
              Connect your campus to the Studi+ network. Our team will reach out within 24 hours.
            </p>

            <form onSubmit={handleContactSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Institution Name</label>
                  <input
                    type="text" required
                    value={contactForm.institutionName}
                    onChange={e => setContactForm(p => ({ ...p, institutionName: e.target.value }))}
                    placeholder="e.g. Oxford University"
                    style={{ width: '100%', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Professional Email</label>
                  <input
                    type="email" required
                    value={contactForm.email}
                    onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="admin@domain.edu"
                    style={{ width: '100%', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Brief Narrative</label>
                <textarea
                  value={contactForm.message}
                  onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Describe your institutional needs..."
                  rows={5}
                  style={{ width: '100%', background: '#0d0d10', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '13px 16px', color: '#fff', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.2s', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                />
              </div>

              {contactSubmitted ? (
                <div style={{ width: '100%', padding: '16px', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 500, background: 'rgba(165,166,246,0.08)', color: '#A5A6F6', border: '1px solid rgba(165,166,246,0.2)', boxSizing: 'border-box' }}>
                  ✓ Request received — we'll be in touch within 24 hours
                </div>
              ) : (
                <button type="submit"
                  style={{ width: '100%', background: 'rgba(165,166,246,0.75)', color: '#fff', padding: '16px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(165,166,246,0.9)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(165,166,246,0.75)'}
                >Submit Protocol</button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 32px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Studi+</span>
            <span style={{ fontSize: 11, color: '#333' }}>© 2026 Studi+. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#444' }}>
            {['Privacy Policy','Terms of Service','Academic Integrity','Accessibility'].map(l => (
              <a key={l} href="#" style={{ color: '#444', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#444'}
              >{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              <svg key="share" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
              <svg key="globe" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
            ].map((icon, i) => (
              <a key={i} href="#" style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#444'; }}
              >{icon}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showDemoModal && <DemoRequestModal onClose={() => setShowDemoModal(false)} />}
      {showLoginModal && <InstitutionLoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
