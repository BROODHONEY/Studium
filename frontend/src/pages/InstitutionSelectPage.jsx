import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function InstitutionSelectPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length < 6) {
      setError('Please enter the full 6-character institution code');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await axios.get(`${apiUrl}/institutions/verify/${code.trim().toLowerCase()}`);

      // Clear any existing session before switching institution
      logout();
      localStorage.setItem('institutionId', res.data.institutionId);
      localStorage.setItem('institutionName', res.data.name);
      localStorage.setItem('institutionSubdomain', res.data.subdomain);

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

  const handleChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
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
            Enter your institution's unique 6-character code to continue.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
              Institution Code
            </label>

            {/* Character boxes display */}
            <div
              onClick={() => inputRef.current?.focus()}
              style={{ display: 'flex', gap: 8, cursor: 'text' }}
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const isActive = focused && i === code.length;
                const filled = !!code[i];
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      aspectRatio: '1',
                      background: filled ? 'rgba(99,102,241,0.1)' : '#1A1A1A',
                      border: `1.5px solid ${isActive ? '#6366F1' : filled ? 'rgba(99,102,241,0.5)' : '#2A2A2A'}`,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#F0F0F0',
                      fontFamily: "'Manrope','Inter',monospace",
                      transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                      boxShadow: isActive ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                    }}
                  >
                    {code[i] ?? <span style={{ color: '#2E2E2E', fontSize: 18 }}>—</span>}
                  </div>
                );
              })}
            </div>

            {/* Hidden real input */}
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              style={{
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
                width: 1,
                height: 1,
              }}
            />

            <p style={{ fontSize: 11, color: '#555', margin: '8px 0 0', fontWeight: 300, textAlign: 'center' }}>
              {code.length < 6
                ? `${6 - code.length} character${6 - code.length !== 1 ? 's' : ''} remaining`
                : <span style={{ color: '#6366F1' }}>✓ Code complete</span>
              }
            </p>
            <p style={{ fontSize: 11, color: '#444', margin: '4px 0 0', fontWeight: 300, textAlign: 'center' }}>
              Contact your institution admin if you don't have this code
            </p>
          </div>

          <button type="submit" disabled={loading || code.length < 6} className="btn-auth" style={{ marginTop: 4 }}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
