import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

export default function DemoRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    institutionName: '',
    contactName: '',
    email: '',
    phone: '',
    studentCount: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.post(`${apiUrl}/institutions/demo-requests`, form);
      
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit demo request');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', background: '#1E1E1E', border: '1px solid #2E2E2E',
    borderRadius: 12, padding: '11px 14px', fontSize: 13, fontWeight: 300,
    color: '#F0F0F0', outline: 'none', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };
  const lbl = {
    fontSize: 11, fontWeight: 500, color: '#666', textTransform: 'uppercase',
    letterSpacing: '0.08em', display: 'block', marginBottom: 6,
  };

  if (success) {
    return (
      <AuthLayout
        tagline="Request submitted successfully!"
        sub="We'll get back to you soon."
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#F0F0F0', margin: '0 0 8px' }}>
            Thank you for your interest!
          </h2>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
            Our team will review your request and contact you shortly.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      tagline="Request a demo for your institution."
      sub="Fill out the form below and we'll get in touch."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
            Request Demo
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Tell us about your institution and we'll set up a demo.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Institution Name</label>
            <input 
              style={inp}
              type="text" 
              name="institutionName"
              value={form.institutionName}
              onChange={handleChange}
              placeholder="Your College/University Name"
              required
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'}
            />
          </div>

          <div>
            <label style={lbl}>Contact Person Name</label>
            <input 
              style={inp}
              type="text" 
              name="contactName"
              value={form.contactName}
              onChange={handleChange}
              placeholder="Your Full Name"
              required
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'}
            />
          </div>

          <div>
            <label style={lbl}>Email</label>
            <input 
              style={inp}
              type="email" 
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="contact@institution.edu"
              required
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'}
            />
          </div>

          <div>
            <label style={lbl}>Phone</label>
            <input 
              style={inp}
              type="tel" 
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              required
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'}
            />
          </div>

          <div>
            <label style={lbl}>Approximate Student Count</label>
            <input 
              style={inp}
              type="number" 
              name="studentCount"
              value={form.studentCount}
              onChange={handleChange}
              placeholder="e.g., 5000"
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'}
            />
          </div>

          <div>
            <label style={lbl}>Message (Optional)</label>
            <textarea 
              style={{ ...inp, minHeight: 80, resize: 'vertical' }}
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Tell us about your requirements..."
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-auth" style={{ marginTop: 4 }}>
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>

        <button
          onClick={() => navigate('/institution-select')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#666',
            fontSize: 13,
            fontWeight: 400,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'underline',
            padding: 0,
            textAlign: 'center'
          }}
        >
          Back to Institution Select
        </button>
      </div>
    </AuthLayout>
  );
}
