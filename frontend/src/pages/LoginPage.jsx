import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

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

  const inputCls = "w-full bg-[#111111] border border-[#181818] rounded-xl px-4 py-3 text-sm text-white font-light placeholder-[#374151] focus:outline-none focus:border-[#4c1d95] transition";

  return (
    <div className="h-dvh flex bg-[#000000] font-['Inter',sans-serif] overflow-hidden">

      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-[45%] h-full flex-col justify-between p-10 flex-shrink-0"
        style={{ background: 'radial-gradient(ellipse at 60% 20%, #7c3aed 0%, #4c1d95 35%, #1a0a2e 65%, #000000 100%)' }}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="Studi+" className="w-12 h-12 rounded-xl object-contain" />
          <span className="text-white/90 text-xl font-medium tracking-wide">Studi+</span>
        </div>
        <div className="space-y-5">
          <h1 className="text-4xl font-light text-white leading-tight tracking-tight">
            Welcome<br />back.
          </h1>
          <p className="text-white/50 text-sm font-light leading-relaxed max-w-xs">
            Sign in to continue where you left off.
          </p>
        </div>
        <p className="text-white/20 text-xs font-light">© 2026 Studi+</p>
      </div>

      {/* Right panel — scrollable */}
      <div className="flex-1 h-full overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 pt-8 pb-2">
          <img src={logo} alt="Studi+" className="w-7 h-7 rounded-lg object-contain" />
          <span className="text-white/90 text-sm font-medium tracking-wide">Studi+</span>
        </div>

        <div className="min-h-full flex items-center justify-center px-5 py-10" style={{ paddingBottom: 'max(40px, env(safe-area-inset-bottom, 40px))' }}>
          <div className="w-full max-w-sm space-y-8">

            <div className="space-y-1.5">
              <h2 className="text-2xl font-light text-white tracking-tight">Sign In</h2>
              <p className="text-[#6b7280] text-sm font-light">Enter your credentials to access your account.</p>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm font-light">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-normal text-[#9ca3af] tracking-wide uppercase">Email</label>
                <input className={inputCls} type="email" name="email"
                  value={form.email} onChange={handleChange} placeholder="eg. you@example.com" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-normal text-[#9ca3af] tracking-wide uppercase">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange} placeholder="Enter your password" required
                    className={inputCls + ' pr-11'}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b5563] hover:text-[#9ca3af] transition">
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-white text-[#000000] rounded-xl py-3 text-sm font-medium
                  hover:bg-white/90 disabled:opacity-50 transition mt-2">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-[#6b7280] text-sm font-light">
              Don't have an account?{' '}
              <Link to="/register" className="text-white font-medium hover:text-white/80 transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
