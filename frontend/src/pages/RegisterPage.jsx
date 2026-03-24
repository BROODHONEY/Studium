import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DEPARTMENTS = [
  'B. Tech Artificial Intelligence and Machine Learning',
  'B. Tech Artificial Intelligence and Data Science',
  'B. Tech Computer Science',
];

export default function RegisterPage() {
  const { login }   = useAuth();
  const { dark, toggle } = useTheme();
  const navigate    = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', role: 'student',
    roll_no: '', department: ''
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const isStudent = form.role === 'student';

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (isStudent && !form.roll_no.trim()) return setError('Roll number is required');
    if (isStudent && !form.department)     return setError('Please select your department');
    setLoading(true);
    try {
      const payload = {
        name: form.name, password: form.password, role: form.role,
        ...(form.email ? { email: form.email } : {}),
        ...(form.phone ? { phone: form.phone } : {}),
        ...(isStudent  ? { roll_no: form.roll_no, department: form.department } : {})
      };
      const res = await authAPI.register(payload);
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center px-4 py-8
      dark:bg-surface bg-gray-50 transition-colors duration-300">

      <button onClick={toggle}
        className="fixed top-4 right-4 p-2 rounded-xl border transition
          dark:bg-surface-2 dark:border-brand-900/50 dark:text-gray-400 dark:hover:text-brand-300
          bg-white border-gray-200 text-gray-500 hover:text-brand-600 shadow-sm">
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="auth-card w-full">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4
            bg-gradient-to-br from-brand-600 to-brand-800 shadow-neon-purple">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">Studi+</h1>
          <p className="dark:text-gray-400 text-gray-500 text-sm mt-1">Create your account to get started</p>
        </div>

        {error && <div className="error-box mb-5">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div>
            <label className="form-label">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['student', 'teacher'].map(r => (
                <button key={r} type="button"
                  onClick={() => setForm(p => ({ ...p, role: r }))}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition capitalize
                    ${form.role === r
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 border-brand-500 text-white shadow-neon-purple'
                      : 'dark:bg-surface-3 dark:border-brand-900/40 dark:text-gray-400 dark:hover:border-brand-700 bg-gray-100 border-gray-300 text-gray-600 hover:border-brand-400'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label">Full name</label>
            <input className="form-input" type="text" name="name"
              value={form.name} onChange={handleChange} placeholder="Ravi Kumar" required />
          </div>

          {isStudent && (
            <>
              <div>
                <label className="form-label">Roll number <span className="text-neon-pink">*</span></label>
                <input className="form-input" type="text" name="roll_no"
                  value={form.roll_no} onChange={handleChange} placeholder="21BD1A0512" required />
              </div>
              <div>
                <label className="form-label">Department <span className="text-neon-pink">*</span></label>
                <select className="form-input" name="department"
                  value={form.department} onChange={handleChange} required>
                  <option value="" disabled>Select your department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email"
              value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </div>

          <div>
            <label className="form-label">
              Phone <span className="dark:text-gray-600 text-gray-400 text-xs">(optional if email given)</span>
            </label>
            <input className="form-input" type="tel" name="phone"
              value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password"
              value={form.password} onChange={handleChange} placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center dark:text-gray-500 text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 transition font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
