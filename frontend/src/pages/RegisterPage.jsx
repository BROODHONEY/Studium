import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

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

  const inp = "w-full border rounded-xl px-4 py-3 text-sm font-light focus:outline-none transition";
  const lbl = "text-xs font-normal tracking-wide uppercase";

  return (
    <div className="h-dvh flex font-['Inter',sans-serif] overflow-hidden" style={{ backgroundColor: 'var(--bg-void)', color: 'var(--text-1)' }}>

      {/* Left panel — always dark purple gradient */}
      <div className="hidden lg:flex lg:w-[45%] h-full flex-col justify-between p-10 flex-shrink-0"
        style={{ background: 'radial-gradient(ellipse at 60% 20%, #7c3aed 0%, #4c1d95 35%, #1a0a2e 65%, #000000 100%)' }}>
        <div className="flex items-center gap-3">
          <img src={logo} alt="Studi+" className="w-12 h-12 rounded-xl object-contain" />
          <span className="text-white/90 text-xl font-medium tracking-wide">Studi+</span>
        </div>
        <div className="space-y-5">
          <h1 className="text-4xl font-light text-white leading-tight tracking-tight">
            Get Started<br />with Us
          </h1>
          <p className="text-white/50 text-sm font-light leading-relaxed max-w-xs">
            Complete these easy steps to register your account.
          </p>
        </div>
        <p className="text-white/20 text-xs font-light">© 2026 Studi+</p>
      </div>

      {/* Right panel — scrollable */}
      <div className="flex-1 h-full overflow-y-auto" style={{ backgroundColor: 'var(--bg-void)' }}>
        <div className="flex flex-col items-center px-6 py-10">

          {/* Mobile logo */}
          <div className="lg:hidden w-full max-w-sm flex items-center gap-2.5 mb-8">
            <img src={logo} alt="Studi+" className="w-7 h-7 rounded-lg object-contain" />
            <span className="text-sm font-medium tracking-wide" style={{ color: 'var(--text-1)' }}>Studi+</span>
          </div>

          <div className="w-full max-w-sm space-y-7">

            <div className="space-y-1.5">
              <h2 className="text-2xl font-light tracking-tight" style={{ color: 'var(--text-1)' }}>Create Account</h2>
              <p className="text-sm font-light" style={{ color: 'var(--text-2)' }}>Enter your details to register.</p>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-500 text-sm font-light">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-1.5">
                <label className={lbl} style={{ color: 'var(--text-2)' }}>I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  {['student', 'teacher'].map(r => (
                    <button key={r} type="button"
                      onClick={() => setForm(p => ({ ...p, role: r }))}
                      style={form.role === r
                        ? { background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', borderColor: 'transparent' }
                        : { backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-2)' }}
                      className="py-2.5 rounded-xl text-sm transition capitalize border font-light">
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={lbl} style={{ color: 'var(--text-2)' }}>Full name</label>
                <input className={inp} type="text" name="name"
                  style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-1)' }}
                  value={form.name} onChange={handleChange} placeholder="eg. Ravi Kumar" required />
              </div>

              {isStudent && (
                <>
                  <div className="space-y-1.5">
                    <label className={lbl} style={{ color: 'var(--text-2)' }}>Roll number</label>
                    <input className={inp} type="text" name="roll_no"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-1)' }}
                      value={form.roll_no} onChange={handleChange} placeholder="eg. 21BD1A0512" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl} style={{ color: 'var(--text-2)' }}>Department</label>
                    <select className={inp} name="department"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-1)' }}
                      value={form.department} onChange={handleChange} required>
                      <option value="" disabled>Select your department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={lbl} style={{ color: 'var(--text-2)' }}>Year</label>
                    <select className={inp} name="year"
                      style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-1)' }}
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
                <label className={lbl} style={{ color: 'var(--text-2)' }}>Email</label>
                <input className={inp} type="email" name="email"
                  style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-1)' }}
                  value={form.email} onChange={handleChange} placeholder="eg. you@example.com" />
              </div>

              <div className="space-y-1.5">
                <label className={lbl} style={{ color: 'var(--text-2)' }}>Phone <span className="normal-case" style={{ color: 'var(--text-3)' }}>(optional)</span></label>
                <input className={inp} type="tel" name="phone"
                  style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-1)' }}
                  value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>

              <div className="space-y-1.5">
                <label className={lbl} style={{ color: 'var(--text-2)' }}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange} placeholder="Enter your password" required
                    className={inp + ' pr-11'}
                    style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-1)' }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition" style={{ color: 'var(--text-3)' }}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <p className="text-xs font-light" style={{ color: 'var(--text-3)' }}>Must be at least 8 characters.</p>
              </div>

              <button type="submit" disabled={loading} className="btn-primary mt-1">
                {loading ? 'Creating account…' : 'Sign Up'}
              </button>
            </form>

            <p className="text-center text-sm font-light pb-4" style={{ color: 'var(--text-2)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium transition" style={{ color: 'var(--accent)' }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
