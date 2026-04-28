import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import ShinyButton from './ui/ShinyButton';

const STEPS = [
  {
    n: '01',
    title: 'Enter institution code',
    desc: 'Your institution admin provides a unique access code.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Sign in with credentials',
    desc: 'Use your institution email and password to access your workspace.',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function InstitutionLoginModal({ onClose }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    onClose();
    navigate('/institution-select');
  };

  return (
    <Modal onClose={onClose} maxWidth={480}>
      {/* header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Sign in to Your Institution</h2>
        <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>You'll need your institution code to continue.</p>
      </div>

      {/* steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {STEPS.map(({ n, title, desc, icon }) => (
          <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,107,53,0.25)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,107,53,0.10)', border: '1px solid rgba(255,107,53,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B35', flexShrink: 0 }}>
              {icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#FF6B35', letterSpacing: '0.1em' }}>{n}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{title}</span>
              </div>
              <p style={{ fontSize: 12, color: '#555', margin: 0, lineHeight: 1.55 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <ShinyButton type="button" onClick={onClose} variant="ghost" className="flex-1 py-3">
          Cancel
        </ShinyButton>
        <ShinyButton type="button" onClick={handleContinue} variant="primary" className="flex-[2] py-3">
          Continue →
        </ShinyButton>
      </div>

      {/* footer note */}
      <p style={{ fontSize: 12, color: '#444', textAlign: 'center', margin: '20px 0 0', lineHeight: 1.6 }}>
        No account yet?{' '}
        <a href="#contact" onClick={onClose} style={{ color: '#FF6B35', textDecoration: 'none', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.target.style.opacity = '0.75'} onMouseLeave={e => e.target.style.opacity = '1'}>
          Contact us to get started
        </a>
      </p>
    </Modal>
  );
}
