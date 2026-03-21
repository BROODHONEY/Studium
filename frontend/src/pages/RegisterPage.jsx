import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'student'
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name:     form.name,
        password: form.password,
        role:     form.role,
        ...(form.email ? { email: form.email } : {}),
        ...(form.phone ? { phone: form.phone } : {})
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800">

        <h1 className="text-2xl font-semibold text-white mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-8">Join Acadex to get started</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Full name</label>
            <input
              type="text" name="name"
              value={form.name} onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              placeholder="Ravi Kumar"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Email</label>
            <input
              type="email" name="email"
              value={form.email} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">
              Phone <span className="text-gray-600">(optional if email provided)</span>
            </label>
            <input
              type="tel" name="phone"
              value={form.phone} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Password</label>
            <input
              type="password" name="password"
              value={form.password} onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {['student', 'teacher'].map(r => (
                <button
                  key={r} type="button"
                  onClick={() => setForm(prev => ({ ...prev, role: r }))}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition capitalize
                    ${form.role === r
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm transition"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}