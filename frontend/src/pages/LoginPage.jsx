import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { login }   = useAuth();
  const { dark, toggle } = useTheme();
  const navigate    = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
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

  return (
    <div className="min-h-dvh flex items-center justify-center px-4
      dark:bg-surface bg-gray-50 transition-colors duration-300">

      {/* Theme toggle */}
      <button onClick={toggle}
        className="fixed top-4 right-4 p-2 rounded-xl border transition
          dark:bg-surface-2 dark:border-brand-900/50 dark:text-gray-400 dark:hover:text-brand-300
          bg-white border-gray-200 text-gray-500 hover:text-brand-600 shadow-sm">
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="auth-card w-full">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4
            bg-gradient-to-br from-brand-600 to-brand-800 shadow-neon-purple">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">Studi+</h1>
          <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">Welcome back — sign in to continue</p>
        </div>

        {error && <div className="error-box mb-5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com" required />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center dark:text-gray-500 text-gray-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 transition font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
