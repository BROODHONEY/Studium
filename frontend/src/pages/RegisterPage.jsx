import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

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
  const focus = e => e.target.style.borderColor = '#6366F1';
  const blur  = e => e.target.style.borderColor = '#2E2E2E';

  return (
    <AuthLayout
      tagline="Elevate your academic ecosystem."
      sub="Complete the form to register your account."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
            Create Account
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Enter your details to get started.
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Role toggle */}
          <div>
            <label style={lbl}>I am a</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['student', 'teacher'].map(r => (
                <button key={r} type="button"
                  onClick={() => setForm(p => ({ ...p, role: r }))}
                  style={{
                    padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 400,
                    cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                    ...(form.role === r
                      ? { background: 'linear-gradient(135deg,#6366F1,#4338ca)', color: '#fff', border: '1px solid transparent' }
                      : { background: '#1E1E1E', border: '1px solid #2E2E2E', color: '#888' })
                  }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Full name</label>
            <input style={inp} type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="eg. Ravi Kumar" required
              onFocus={focus} onBlur={blur} />
          </div>

          {isStudent && (
            <>
              <div>
                <label style={lbl}>Roll number</label>
                <input style={inp} type="text" name="roll_no" value={form.roll_no}
                  onChange={handleChange} placeholder="eg. 21BD1A0512" required
                  onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={lbl}>Department</label>
                <select style={{ ...inp, colorScheme: 'dark' }} name="department"
                  value={form.department} onChange={handleChange} required
                  onFocus={focus} onBlur={blur}>
                  <option value="" disabled>Select your department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Year</label>
                <select style={{ ...inp, colorScheme: 'dark' }} name="year"
                  value={form.year} onChange={handleChange} required
                  onFocus={focus} onBlur={blur}>
                  <option value="" disabled>Select your year</option>
                  {[1,2,3,4].map(y => (
                    <option key={y} value={y}>{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com"
              onFocus={focus} onBlur={blur} />
          </div>

          <div>
            <label style={lbl}>Phone <span style={{ color: '#444', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input style={inp} type="tel" name="phone" value={form.phone}
              onChange={handleChange} placeholder="+91 98765 43210"
              onFocus={focus} onBlur={blur} />
          </div>

          <div>
            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 42 }}
                type={showPw ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="At least 8 characters" required
                onFocus={focus} onBlur={blur} />
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
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#666', margin: 0, paddingBottom: 8 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#C0C1FF', fontWeight: 500, textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
