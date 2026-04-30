import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import { getStoredInstitution, clearStoredInstitution } from '../utils/institution';
import ShinyButton from '../components/ui/ShinyButton';

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [institution, setInstitution] = useState(null);

  useEffect(() => {
    const inst = getStoredInstitution();
    if (!inst) { navigate('/institution-select'); return; }
    setInstitution(inst);
  }, [navigate]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ ...form, ...(institution ? { institutionId: institution.id } : {}) });
      login(res.data.token, res.data.user);
      const { role, institution_id } = res.data.user;
      if (role === 'admin') navigate(institution_id ? '/admin/dashboard' : '/superadmin');
      else if (role === 'teacher') navigate('/teacher');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }) => visible
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <AuthLayout tagline="Elevate your academic ecosystem." sub="Sign in to continue where you left off." institution={institution}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
            Welcome back
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Enter your credentials to access your account.
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="auth-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="auth-field">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" style={{ paddingRight: 42 }}
                type={showPw ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Enter your password" required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', lineHeight: 0 }}>
                <EyeIcon visible={showPw} />
              </button>
            </div>
          </div>

          <ShinyButton type="submit" disabled={loading} className="w-full py-3" style={{ marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </ShinyButton>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#FFAA6E', fontWeight: 500, textDecoration: 'none' }}>Sign up</Link>
          </p>
          <button onClick={() => { clearStoredInstitution(); navigate('/institution-select'); }}
            style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline', padding: 0 }}>
            Change institution
          </button>
          {import.meta.env.DEV && (
            <div style={{ marginTop: 4, padding: '5px 12px', borderRadius: 6, border: '1px dashed #333', color: '#444', fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>
              🔧 DEV: use /verify-email?token=... to verify accounts
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

