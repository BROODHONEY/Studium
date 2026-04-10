import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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

  return (
    <AuthLayout
      tagline="Elevate your academic ecosystem."
      sub="Sign in to continue where you left off."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Enter your credentials to access your account.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#2E2E2E'} />
          </div>

          <div>
            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 42 }}
                type={showPw ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Enter your password" required
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#2E2E2E'} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', lineHeight: 0 }}>
                {showPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-auth" style={{ marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#C0C1FF', fontWeight: 500, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
