import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'B. Tech Artificial Intelligence and Machine Learning',
  'B. Tech Artificial Intelligence and Data Science',
  'B. Tech Computer Science',
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', role: 'student',
    roll_no: '', department: ''
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const isStudent = form.role === 'student';

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Client-side validation for students
    if (isStudent && !form.roll_no.trim()) {
      setError('Roll number is required');
      return;
    }
    if (isStudent && !form.department) {
      setError('Please select your department');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:     form.name,
        password: form.password,
        role:     form.role,
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="auth-card">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Studium</h1>
          <p className="text-gray-400 text-sm mt-1">Create your account to get started</p>
        </div>

        {error && <div className="error-box mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Role selector — first so fields below react immediately */}
          <div>
            <label className="form-label">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['student', 'teacher'].map(r => (
                <button key={r} type="button"
                  onClick={() => setForm(p => ({ ...p, role: r }))}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition capitalize
                    ${form.role === r
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="form-label">Full name</label>
            <input className="form-input" type="text" name="name"
              value={form.name} onChange={handleChange}
              placeholder="Ravi Kumar" required />
          </div>

          {/* Student-only fields */}
          {isStudent && (
            <>
              <div>
                <label className="form-label">
                  Roll number
                  <span className="ml-1 text-red-400">*</span>
                </label>
                <input className="form-input" type="text" name="roll_no"
                  value={form.roll_no} onChange={handleChange}
                  placeholder="21BD1A0512" required />
              </div>

              <div>
                <label className="form-label">
                  Department
                  <span className="ml-1 text-red-400">*</span>
                </label>
                <select className="form-input" name="department"
                  value={form.department} onChange={handleChange} required>
                  <option value="" disabled>Select your department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com" />
          </div>

          {/* Phone */}
          <div>
            <label className="form-label">
              Phone
              <span className="text-gray-600 ml-1">(optional if email given)</span>
            </label>
            <input className="form-input" type="tel" name="phone"
              value={form.phone} onChange={handleChange}
              placeholder="+91 98765 43210" />
          </div>

          {/* Password */}
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}