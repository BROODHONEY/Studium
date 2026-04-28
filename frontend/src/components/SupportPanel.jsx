import { useState } from 'react';

const FAQS = [
  { q: 'How do I join a group?', a: 'Ask your teacher for the invite code, then tap "New group / folder" > "Create or join group" and enter the code.' },
  { q: 'How do I create a group?', a: 'Only teachers can create groups. Go to Groups > New group / folder > Create or join group.' },
  { q: 'Why am I not receiving notifications?', a: 'Make sure notifications are enabled in Settings > Personalise. Also check your browser notification permissions.' },
  { q: 'How do I send a direct message?', a: 'Go to the Messages tab, search for a user by email, and start a conversation.' },
  { q: 'Can I delete a message?', a: 'Yes. hover over a message and click the three-dot menu, then select Delete. Admins can delete any message.' },
  { q: 'How do I change my password?', a: 'Go to Settings > Security > Change Password.' },
  { q: 'How do I leave or delete a group?', a: 'Go to the group > Members tab. Scroll to the bottom to find Leave group. Only the group creator can delete it.' },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #333333', borderRadius: 10, overflow: 'hidden', background: '#252525', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(192,193,255,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#333333'}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 13, fontWeight: 400, color: '#F0F0F0' }}>{q}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
          style={{ flexShrink: 0, color: '#555555', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #333333' }}>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#9E9E9E', margin: '12px 0 0', lineHeight: 1.6 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPanel() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#181818', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 400, background: 'radial-gradient(ellipse at top right, rgba(255,107,53,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 400, height: 300, background: 'radial-gradient(ellipse at top left, rgba(192,193,255,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px', position: 'relative' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#FF6B35' }}>
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#F0F0F0', margin: 0 }}>Support</h1>
            <p style={{ fontSize: 13, fontWeight: 300, color: '#555555', margin: 0 }}>Help & frequently asked questions</p>
          </div>
        </div>

        {/* Contact card */}
        <div style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.10), rgba(192,193,255,0.05))', border: '1px solid rgba(255,107,53,0.20)', borderRadius: 14, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#F0F0F0', margin: '0 0 4px' }}>Need more help?</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: '#9E9E9E', margin: 0 }}>Reach out and we'll get back to you.</p>
          </div>
          <a href="mailto:support@studiplus.app"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 9, background: '#FF6B35', color: '#131313', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'opacity 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/>
            </svg>
            Contact support
          </a>
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 32 }}>
          {[
            {
              icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>,
              label: 'Getting started', desc: 'New to Studi+?',
            },
            {
              icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/></svg>,
              label: 'Notifications', desc: 'Manage alerts',
            },
            {
              icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>,
              label: 'Privacy & security', desc: 'Account safety',
            },
            {
              icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>,
              label: 'Report a bug', desc: 'Something broken?',
            },
          ].map(item => (
            <button key={item.label}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 10, border: '1px solid #333333', background: '#252525', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(192,193,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#333333'}>
              <span style={{ color: '#FF6B35', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#F0F0F0', margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 11, fontWeight: 300, color: '#555555', margin: 0 }}>{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* FAQ */}
        <h2 style={{ fontSize: 11, fontWeight: 700, color: '#F0F0F0', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
        </div>

        <p style={{ fontSize: 11, fontWeight: 300, color: '#555555', marginTop: 40, textAlign: 'center' }}>
          Studi+ &middot; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}



