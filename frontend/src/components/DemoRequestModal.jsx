import { useState } from 'react';
import Modal from './ui/Modal';
import { demoRequestsAPI } from '../services/api';

export default function DemoRequestModal({ onClose }) {
  const [formData, setFormData] = useState({
    institutionName: '',
    contactName: '',
    email: '',
    phone: '',
    studentCount: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await demoRequestsAPI.create(formData);
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Error submitting demo request:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: '#0d0d10',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: 10,
    fontWeight: 700,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    marginBottom: 10
  };

  if (submitted) {
    return (
      <Modal onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(165,166,246,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="32" height="32" fill="none" stroke="#A5A6F6" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif" }}>Request Submitted!</h3>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>We'll contact you within 24 hours.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Manrope', Inter, sans-serif", letterSpacing: '-0.02em' }}>Request a Demo</h2>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 32px', lineHeight: 1.6 }}>Fill out the form below and our team will reach out shortly.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Institution Name *</label>
          <input
            type="text"
            name="institutionName"
            required
            value={formData.institutionName}
            onChange={handleChange}
            placeholder="e.g. Oxford University"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Contact Name *</label>
          <input
            type="text"
            name="contactName"
            required
            value={formData.contactName}
            onChange={handleChange}
            placeholder="Your full name"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@domain.edu"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone *</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Approximate Student Count</label>
          <input
            type="number"
            name="studentCount"
            value={formData.studentCount}
            onChange={handleChange}
            placeholder="e.g., 5000"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Additional Information</label>
          <textarea
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            placeholder="Tell us about your needs..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = 'rgba(165,166,246,0.45)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
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
            type="submit"
            style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: 'rgba(165,166,246,0.75)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(165,166,246,0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(165,166,246,0.75)'}
          >
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
}
