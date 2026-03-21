import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="auth-card">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">studium</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back — sign in to continue</p>
        </div>

        {error && <div className="error-box mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
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
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}