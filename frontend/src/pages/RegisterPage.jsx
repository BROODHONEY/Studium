import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, institutionsAPI } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import { getStoredInstitution, clearStoredInstitution } from '../utils/institution';
import ShinyButton from '../components/ui/ShinyButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', role: 'student',
    roll_no: '', department: '', year: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [devBypass, setDevBypass] = useState(false);
  const [registered, setRegistered] = useState(false);
  const isStudent = form.role === 'student';

  useEffect(() => {
    const inst = getStoredInstitution();
    if (!inst) {
      navigate('/institution-select');
      return;
    }
    setInstitution(inst);

    const fetchDepartments = async () => {
      setLoadingDepts(true);
      try {
        const res = await institutionsAPI.departments(inst.id);
        setDepartments(res.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, [navigate]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (isStudent && !form.roll_no.trim()) return setError('Roll number is required');
    if (isStudent && !form.department) return setError('Please select your department');
    if (isStudent && !form.year) return setError('Please select your year');
    if (!isStudent && !form.department) return setError('Please select your department');

    // Client-side domain check
    if (institution?.emailDomain && !devBypass) {
      const domain = institution.emailDomain.startsWith('@') ? institution.emailDomain : `@${institution.emailDomain}`;
      if (!form.email.toLowerCase().endsWith(domain.toLowerCase())) {
        return setError(`Only ${domain} email addresses are allowed for ${institution.name}`);
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name, password: form.password, role: form.role,
        institutionId: institution?.id,
        devBypass,
        ...(form.email ? { email: form.email } : {}),
        ...(form.phone ? { phone: form.phone } : {}),
        ...(isStudent ? { roll_no: form.roll_no, department: form.department, year: Number(form.year) } : { department: form.department })
      };
      const res = await authAPI.register(payload);

      if (res.data.requiresVerification) {
        setRegistered(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }) => visible
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  // Email sent screen
  if (registered) {
    return (
      <AuthLayout tagline="Check your inbox." sub="">
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F0', margin: '0 0 10px' }}>Verify your email</h2>
          <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6, margin: '0 0 24px' }}>
            We sent a verification link to <span style={{ color: '#FF6B35' }}>{form.email}</span>.<br />
            Click the link in the email to activate your account.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      tagline="Elevate your academic ecosystem."
      sub="Complete the form to register your account."
      institution={institution}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F0F0F0', margin: '0 0 6px', letterSpacing: '-0.02em', fontFamily: "'Manrope','Inter',sans-serif" }}>
            Create Account
          </h2>
          <p style={{ fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Enter your details to get started.
            {institution?.emailDomain && !devBypass && (
              <span style={{ color: '#6366F1', marginLeft: 4 }}>
                Requires {institution.emailDomain} email.
              </span>
            )}
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13, fontWeight: 300 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">I am a</label>
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
            <label className="form-label">Full name</label>
            <input className="form-input" type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="eg. Ravi Kumar" required />
          </div>

          <div>
            <label className="form-label">Department</label>
            <select className="form-input" style={{ colorScheme: 'dark' }} name="department"
              value={form.department} onChange={handleChange} required disabled={loadingDepts}>
              <option value="" disabled>{loadingDepts ? 'Loading departments...' : 'Select your department'}</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          {isStudent && (
            <>
              <div>
                <label className="form-label">Roll number</label>
                <input className="form-input" type="text" name="roll_no" value={form.roll_no}
                  onChange={handleChange} placeholder="eg. 21BD1A0512" required />
              </div>
              <div>
                <label className="form-label">Year</label>
                <select className="form-input" style={{ colorScheme: 'dark' }} name="year"
                  value={form.year} onChange={handleChange} required>
                  <option value="" disabled>Select your year</option>
                  {[1, 2, 3, 4].map(y => (
                    <option key={y} value={y}>{y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : '4th'} Year</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder={institution?.emailDomain ? `you${institution.emailDomain}` : 'you@example.com'}
              required />
          </div>

          <div>
            <label className="form-label">Phone <span style={{ color: '#444', fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input className="form-input" type="tel" name="phone" value={form.phone}
              onChange={handleChange} placeholder="+91 98765 43210" />
          </div>

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" style={{ paddingRight: 42 }}
                type={showPw ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="At least 8 characters" required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#555', lineHeight: 0 }}>
                {showPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <ShinyButton type="submit" disabled={loading} className="w-full py-3" style={{ marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </ShinyButton>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', paddingBottom: 8 }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 300, color: '#666', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#FF6B35', fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
          </p>
          <button
            onClick={() => {
              clearStoredInstitution();
              navigate('/institution-select');
            }}
            style={{ background: 'transparent', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline', padding: 0 }}
          >
            Change institution
          </button>

          {/* DEV ONLY: bypass domain + email verification */}
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => setDevBypass(v => !v)}
              style={{
                marginTop: 4,
                padding: '5px 12px',
                borderRadius: 6,
                border: `1px dashed ${devBypass ? '#f59e0b' : '#333'}`,
                background: devBypass ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: devBypass ? '#f59e0b' : '#444',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {devBypass ? '⚠ DEV BYPASS ON' : '🔧 DEV: bypass domain check'}
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

