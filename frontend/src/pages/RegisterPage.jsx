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
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', role: 'student',
    roll_no: '', department: '', year: ''
  });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const isStudent = form.role === 'student';

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (isStudent && !form.roll_no.trim()) return setError('Roll number is required');
    if (isStudent && !form.department)     return setError('Please select your department');
    if (isStudent && !form.year)           return setError('Please select your year');
    setLoading(true);
    try {
      const payload = {
        name: form.name, password: form.password, role: form.role,
        ...(form.email ? { email: form.email } : {}),
        ...(form.phone ? { phone: form.phone } : {}),
        ...(isStudent  ? { roll_no: form.roll_no, department: form.department, year: Number(form.year) } : {})
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

  const inp = "w-full bg-[#111118] border border-[#1f1f2e] rounded-xl px-4 py-3 text-sm text-white font-light placeholder-[#374151] focus:outline-none focus:border-[#4c1d95] transition";
  const lbl = "text-xs font-normal text-[#9ca3af] tracking-wide uppercase";

  return (
    <div className="h-dvh flex bg-[#0a0a0f] font-['Inter',sans-serif] overflow-hidden">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] h-full flex-col justify-between p-10 flex-shrink-0"
        style={{ background: 'radial-gradient(ellipse at 60% 20%, #7c3aed 0%, #4c1d95 35%, #1a0a2e 65%, #0a0a0f 100%)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-medium">S</span>
          </div>
          <span className="text-white/90 text-sm font-medium tracking-wide">Studi+</span>
        </div>
        <div className="space-y-5">
          <h1 className="text-4xl font-light text-white leading-tight tracking-tight">
            Get Started<br />with Us
          </h1>
          <p className="text-white/50 text-sm font-light leading-relaxed max-w-xs">
            Complete these easy steps to register your account.
          </p>
          <div className="flex flex-col gap-2.5 pt-4">
            {[
              { n: '1', label: 'Sign up your account', active: true },
              { n: '2', label: 'Set up your groups' },
              { n: '3', label: 'Set up your profile' },
            ].map(s => (
              <div key={s.n}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm
                  ${s.active ? 'bg-white text-[#0a0a0f] font-medium' : 'bg-white/[0.06] text-white/40 font-light border border-white/[0.06]'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] flex-shrink-0
                  ${s.active ? 'bg-[#0a0a0f] text-white' : 'bg-white/10 text-white/40'}`}>
                  {s.n}
                </span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/20 text-xs font-light">© 2026 Studi+</p>
      </div>

      {/* Right panel — scrollable, content starts from top */}
      <div className="flex-1 h-full overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-10">

          {/* Mobile logo */}
          <div className="lg:hidden w-full max-w-sm flex items-center gap-2.5 mb-8">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-medium">S</span>
            </div>
            <span className="text-white/90 text-sm font-medium tracking-wide">Studi+</span>
          </div>

          <div className="w-full max-w-sm space-y-7">

            <div className="space-y-1.5">
              <h2 className="text-2xl font-light text-white tracking-tight">Create Account</h2>
              <p className="text-[#6b7280] text-sm font-light">Enter your details to register.</p>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-sm font-light">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-1.5">
                <label className={lbl}>I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  {['student', 'teacher'].map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(p => ({ ...p, role: r }))}
                      className={`py-2.5 rounded-xl text-sm transition capitalize border
                        ${form.role === r
                          ? 'bg-white text-[#0a0a0f] font-medium border-white'
                          : 'bg-[#111118] border-[#1f1f2e] text-[#6b7280] font-light hover:border-[#4c1d95]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={lbl}>Full name</label>
                <input className={inp} type="text" name="name"
                  value={form.name} onChange={handleChange} placeholder="eg. Ravi Kumar" required />
              </div>

              {isStudent && (
                <>
                  <div className="space-y-1.5">
                    <label className={lbl}>Roll number</label>
                    <input className={inp} type="text" name="roll_no"
                      value={form.roll_no} onChange={handleChange} placeholder="eg. 21BD1A0512" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Department</label>
                    <select className={inp} name="department"
                      value={form.department} onChange={handleChange} required>
                      <option value="" disabled>Select your department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl}>Year</label>
                    <select className={inp} name="year"
                      value={form.year} onChange={handleChange} required>
                      <option value="" disabled>Select your year</option>
                      {[1,2,3,4].map(y => (
                        <option key={y} value={y}>{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className={lbl}>Email</label>
                <input className={inp} type="email" name="email"
                  value={form.email} onChange={handleChange} placeholder="eg. you@example.com" />
              </div>

              <div className="space-y-1.5">
                <label className={lbl}>Phone <span className="normal-case text-[#4b5563]">(optional)</span></label>
                <input className={inp} type="tel" name="phone"
                  value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>

              <div className="space-y-1.5">
                <label className={lbl}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange} placeholder="Enter your password" required
                    className={inp + ' pr-11'}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b5563] hover:text-[#9ca3af] transition">
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <p className="text-[#4b5563] text-xs font-light">Must be at least 8 characters.</p>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-white text-[#0a0a0f] rounded-xl py-3 text-sm font-medium
                  hover:bg-white/90 disabled:opacity-50 transition mt-1">
                {loading ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-[#6b7280] text-sm font-light pb-4">
              Already have an account?{' '}
              <Link to="/login" className="text-white font-medium hover:text-white/80 transition">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
