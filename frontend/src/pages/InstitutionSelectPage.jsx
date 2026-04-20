import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';

export default function InstitutionSelectPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code.trim()) {
      setError('Please enter your institution code');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await axios.get(`${apiUrl}/institutions/verify/${code.trim().toLowerCase()}`);
      
      // Store institution info in localStorage
      localStorage.setItem('institutionId', res.data.institutionId);
      localStorage.setItem('institutionName', res.data.name);
      localStorage.setItem('institutionSubdomain', res.data.subdomain);
      
      // Navigate to login page
      navigate('/login');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Institution not found. Please check your code and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to verify institution');
      }
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

  return (
    <AuthLayout
      tagline="Elevate your academic ecosystem."
      sub="Enter your institution code to continue."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
            Select Institution
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Enter your institution's unique code to access your account.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              Institution Code
            </label>
            <input 
              style={inp}
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="Enter your institution code"
              required
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'}
            />
            <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0', fontWeight: 300 }}>
              Contact your institution admin if you don't have this code
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-auth" style={{ marginTop: 4 }}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
