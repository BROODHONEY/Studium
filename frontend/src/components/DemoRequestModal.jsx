import { useState } from 'react';
import Modal from './ui/Modal';
import { demoRequestsAPI } from '../services/api';

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: '#111',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 9, color: '#f0f0f0',
  fontSize: 13, fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, background 0.2s',
};

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: '#555', textTransform: 'uppercase',
  letterSpacing: '0.14em', marginBottom: 8,
};

const FIELDS = [
  { label: 'Institution Name *', name: 'institutionName', type: 'text', placeholder: 'e.g. Oxford University', full: true },
  { label: 'Contact Name *',     name: 'contactName',     type: 'text', placeholder: 'Your full name',        full: true },
  { label: 'Email *',            name: 'email',           type: 'email', placeholder: 'admin@domain.edu' },
  { label: 'Phone *',            name: 'phone',           type: 'tel',   placeholder: '+1 (555) 000-0000' },
  { label: 'Approx. Student Count', name: 'studentCount', type: 'number', placeholder: 'e.g. 5000',          full: true },
];

export default function DemoRequestModal({ onClose }) {
  const [formData, setFormData] = useState({ institutionName: '', contactName: '', email: '', phone: '', studentCount: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await demoRequestsAPI.create(formData);
      setSubmitted(true);
      setTimeout(() => onClose(), 2400);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e) => { e.target.style.borderColor = 'rgba(255,107,53,0.45)'; e.target.style.background = '#161616'; };
  const blurStyle  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.background = '#111'; };

  if (submitted) {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif" }}>Request Submitted</h3>
          <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>We'll reach out within 24 hours.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} maxWidth={540}>
      {/* header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Request a Demo</h2>
        <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>Fill out the form and our team will reach out shortly.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* full-width fields */}
        {FIELDS.filter(f => f.full).map(({ label, name, type, placeholder }) => (
          <div key={name} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{label}</label>
            <input type={type} name={name} required={label.includes('*')} value={formData[name]}
              onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))}
              placeholder={placeholder} style={inputStyle}
              onFocus={focusStyle} onBlur={blurStyle} />
          </div>
        ))}

        {/* email + phone row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {FIELDS.filter(f => !f.full).map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label style={labelStyle}>{label}</label>
              <input type={type} name={name} required={label.includes('*')} value={formData[name]}
                onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))}
                placeholder={placeholder} style={inputStyle}
                onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          ))}
        </div>

        {/* message */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Additional Information</label>
          <textarea name="message" rows={3} value={formData.message}
            onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
            placeholder="Tell us about your needs..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={focusStyle} onBlur={blurStyle} />
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '13px', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, background: 'transparent', color: '#888', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; }}>
            Cancel
          </button>
          <button type="submit" disabled={loading}
            style={{ flex: 2, padding: '13px', borderRadius: 10, border: 'none', background: loading ? 'rgba(255,107,53,0.5)' : '#FF6B35', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', letterSpacing: '0.01em' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#FF8C5A'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#FF6B35'; }}>
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
