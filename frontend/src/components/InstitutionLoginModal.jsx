import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';

export default function InstitutionLoginModal({ onClose }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    onClose();
    navigate('/institution-select');
  };

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Login to Your Institution</h2>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>
        You'll be asked to enter your institution code to continue.
      </p>
      
      <div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: '#aaa', marginBottom: 12, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: '#fff' }}>Step 1:</span> Enter your institution code
          </p>
          <p style={{ fontSize: 13, color: '#aaa', margin: 0, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: '#fff' }}>Step 2:</span> Sign in with your credentials
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: 'rgba(165,166,246,0.75)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(165,166,246,0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(165,166,246,0.75)'}
          >
            Continue
          </button>
        </div>
      </div>

      <div style={{ marginTop: 28, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: 13, color: '#666', textAlign: 'center', margin: 0 }}>
          Don't have an account? <a href="#contact" onClick={onClose} style={{ color: '#A5A6F6', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = '0.8'} onMouseLeave={e => e.target.style.opacity = '1'}>Contact us</a> to get started.
        </p>
      </div>
    </Modal>
  );
}
