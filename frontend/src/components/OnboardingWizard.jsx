import { useState } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { palette as T } from '../constants/theme';

const inp = {
  width: '100%', background: T.raised, border: `1px solid ${T.border}`,
  borderRadius: 9, padding: '10px 14px', color: T.text1, fontSize: 13,
  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};
const lbl = { fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.09em', display: 'block', marginBottom: 6 };

const GRADE_OPTIONS = ['O', 'A+', 'A', 'B+', 'B', 'C', 'F'];

// ── Step indicator ────────────────────────────────────────
function StepDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 7, height: 7, borderRadius: 4,
          background: i === current ? T.primary : i < current ? T.primaryMid : T.border,
          transition: 'all 0.25s',
        }} />
      ))}
    </div>
  );
}

// ── Step 0: Welcome ───────────────────────────────────────
function StepWelcome({ user, onNext }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
      <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, color: T.text1, fontFamily: 'Manrope, Inter, sans-serif', letterSpacing: '-0.02em' }}>
        Welcome, {user?.name?.split(' ')[0]}!
      </h2>
      <p style={{ fontSize: 14, color: T.text2, margin: '0 0 8px', lineHeight: 1.6 }}>
        Let's set up your student profile. It takes about 2 minutes.
      </p>
      <p style={{ fontSize: 12, color: T.text3, margin: '0 0 32px', lineHeight: 1.6 }}>
        Your semester marks are private — only teachers can view them.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={onNext}
          style={{ padding: '13px', borderRadius: 11, border: 'none', background: T.primary, color: '#131313', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Get started →
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Basic profile ─────────────────────────────────
function StepProfile({ user, data, onChange, onNext, onBack }) {
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!data.cgpa && data.cgpa !== 0) { setError('Please enter your CGPA'); return; }
    if (isNaN(Number(data.cgpa)) || Number(data.cgpa) < 0 || Number(data.cgpa) > 10) {
      setError('CGPA must be between 0 and 10'); return;
    }
    setError('');
    onNext();
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: T.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>Your Profile</h2>
      <p style={{ fontSize: 13, color: T.text2, margin: '0 0 24px' }}>Confirm your details and add your CGPA.</p>

      {/* Read-only info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          ['Department', user?.department || 'Not set'], 
          ['Year', user?.year ? `Year ${user.year}` : 'Not set'], 
          ['Roll No', user?.roll_no || 'Not set']
        ].map(([k, v]) => (
          <div key={k} style={{ background: T.raised, borderRadius: 9, padding: '11px 14px', border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 3 }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text1 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* CGPA */}
      <div style={{ marginBottom: 20 }}>
        <label style={lbl}>Current CGPA</label>
        <input style={inp} type="number" min="0" max="10" step="0.01" placeholder="e.g. 8.75"
          value={data.cgpa} onChange={e => onChange({ ...data, cgpa: e.target.value })}
          onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
        {error && <div style={{ fontSize: 12, color: T.danger, marginTop: 6 }}>{error}</div>}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none', color: T.text2, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Back</button>
        <button onClick={handleNext} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: T.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Continue →</button>
      </div>
    </div>
  );
}

// ── Step 2: Semester Marks ────────────────────────────────
function StepSemesterMarks({ user, semesters, onChange, onNext, onBack }) {
  const yearCount = user?.year || 1;
  const semCount  = yearCount * 2;

  const [activeSem, setActiveSem] = useState(1);

  const getSem = (n) => semesters.find(s => s.semester === n) || { semester: n, gpa: '', courses: [] };

  const updateSem = (n, updates) => {
    const existing = semesters.filter(s => s.semester !== n);
    onChange([...existing, { ...getSem(n), ...updates }].sort((a, b) => a.semester - b.semester));
  };

  const addCourse = (semN) => {
    const sem = getSem(semN);
    updateSem(semN, { courses: [...sem.courses, { code: '', name: '', credits: 3, grade: 'A', marks: '' }] });
  };

  const updateCourse = (semN, ci, field, val) => {
    const sem = getSem(semN);
    const courses = sem.courses.map((c, i) => i === ci ? { ...c, [field]: val } : c);
    updateSem(semN, { courses });
  };

  const removeCourse = (semN, ci) => {
    const sem = getSem(semN);
    updateSem(semN, { courses: sem.courses.filter((_, i) => i !== ci) });
  };

  const sem = getSem(activeSem);

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: T.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>Semester Marks</h2>
      <p style={{ fontSize: 13, color: T.text2, margin: '0 0 20px' }}>
        Add your marks for each semester. Only teachers can see this.
      </p>

      {/* Semester tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {Array.from({ length: semCount }, (_, i) => i + 1).map(n => {
          const s = getSem(n);
          const filled = s.courses.length > 0;
          return (
            <button key={n} onClick={() => setActiveSem(n)}
              style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${activeSem === n ? T.primary : T.border}`, background: activeSem === n ? T.primaryLo : 'none', color: activeSem === n ? T.primary : T.text2, fontSize: 12, fontWeight: activeSem === n ? 700 : 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
              Sem {n}
              {filled && <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: T.success }} />}
            </button>
          );
        })}
      </div>

      {/* GPA for this semester */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={lbl}>Semester {activeSem} GPA</label>
          <input style={inp} type="number" min="0" max="10" step="0.01" placeholder="e.g. 8.5"
            value={sem.gpa} onChange={e => updateSem(activeSem, { gpa: e.target.value })}
            onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <button onClick={() => addCourse(activeSem)}
          style={{ padding: '10px 16px', borderRadius: 9, border: `1px solid ${T.primaryMid}`, background: T.primaryLo, color: T.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>
          + Add Course
        </button>
      </div>

      {/* Courses */}
      {sem.courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: T.text3, fontSize: 13, border: `1px dashed ${T.border}`, borderRadius: 10, marginBottom: 16 }}>
          No courses added yet. Click "+ Add Course" to start.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}>
          {sem.courses.map((c, ci) => (
            <div key={ci} style={{ background: T.raised, borderRadius: 9, padding: '12px 14px', border: `1px solid ${T.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 70px 70px 28px', gap: 8, alignItems: 'center' }}>
                <input style={{ ...inp, padding: '6px 8px', fontSize: 11 }} placeholder="Code" value={c.code}
                  onChange={e => updateCourse(activeSem, ci, 'code', e.target.value)} />
                <input style={{ ...inp, padding: '6px 8px', fontSize: 11 }} placeholder="Course name" value={c.name}
                  onChange={e => updateCourse(activeSem, ci, 'name', e.target.value)} />
                <input style={{ ...inp, padding: '6px 8px', fontSize: 11, textAlign: 'center' }} type="number" min="1" max="6" placeholder="Cr" value={c.credits}
                  onChange={e => updateCourse(activeSem, ci, 'credits', Number(e.target.value))} />
                <select style={{ ...inp, padding: '6px 8px', fontSize: 11, appearance: 'none', textAlign: 'center' }} value={c.grade}
                  onChange={e => updateCourse(activeSem, ci, 'grade', e.target.value)}>
                  {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input style={{ ...inp, padding: '6px 8px', fontSize: 11, textAlign: 'center' }} type="number" min="0" max="100" placeholder="Marks" value={c.marks}
                  onChange={e => updateCourse(activeSem, ci, 'marks', e.target.value)} />
                <button onClick={() => removeCourse(activeSem, ci)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.danger, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 70px 70px 28px', gap: 8, marginTop: 3 }}>
                <div style={{ fontSize: 9, color: T.text3, textAlign: 'center' }}>Code</div>
                <div style={{ fontSize: 9, color: T.text3 }}>Name</div>
                <div style={{ fontSize: 9, color: T.text3, textAlign: 'center' }}>Credits</div>
                <div style={{ fontSize: 9, color: T.text3, textAlign: 'center' }}>Grade</div>
                <div style={{ fontSize: 9, color: T.text3, textAlign: 'center' }}>Marks</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none', color: T.text2, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Back</button>
        <button onClick={onNext} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: T.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Continue →</button>
      </div>
    </div>
  );
}

// ── Step 3: Done ──────────────────────────────────────────
function StepDone({ onFinish, saving }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
      <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 800, color: T.text1, fontFamily: 'Manrope, Inter, sans-serif' }}>You're all set!</h2>
      <p style={{ fontSize: 14, color: T.text2, margin: '0 0 32px', lineHeight: 1.6 }}>
        Your profile is saved. You can update it anytime from Settings.
      </p>
      <button onClick={onFinish} disabled={saving}
        style={{ width: '100%', padding: '13px', borderRadius: 11, border: 'none', background: T.primary, color: '#131313', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Go to Dashboard →'}
      </button>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────
export default function OnboardingWizard({ onComplete }) {
  const { user, login, token } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({ cgpa: user?.cgpa ?? '' });
  const [semesters, setSemesters] = useState([]);

  const STEPS = 4; // welcome, profile, marks, done

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save CGPA first (always works)
      const cgpaPayload = {
        cgpa: profileData.cgpa !== '' ? Number(profileData.cgpa) : null,
      };
      let res = await profileAPI.update(cgpaPayload);

      // Try saving semester_marks separately — may fail if column not yet migrated
      if (semesters.length > 0) {
        try {
          res = await profileAPI.update({ semester_marks: semesters });
        } catch (semErr) {
          console.warn('semester_marks column not available yet — run backend/migrations/semester_marks.sql in Supabase', semErr);
        }
      }

      // Update auth context with fresh user data
      login(token, res.data);
      // Mark onboarded in localStorage
      localStorage.setItem(`onboarded_${user.id}`, '1');
      onComplete();
    } catch (err) {
      console.error('Onboarding save failed:', err);
      setSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`onboarded_${user.id}`, '1');
    onComplete();
  };

  const steps = [
    <StepWelcome key="welcome" user={user} onNext={() => setStep(1)} />,
    <StepProfile key="profile" user={user} data={profileData} onChange={setProfileData} onNext={() => setStep(2)} onBack={() => setStep(0)} />,
    <StepSemesterMarks key="marks" user={user} semesters={semesters} onChange={setSemesters} onNext={() => setStep(3)} onBack={() => setStep(1)} />,
    <StepDone key="done" onFinish={handleFinish} saving={saving} />,
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', fontFamily: 'Inter, sans-serif' }}>
      {/* gradient glow */}
      <div style={{ position: 'absolute', width: 540, height: 380, background: 'radial-gradient(ellipse at center, rgba(165,166,246,0.10) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', animation: 'popIn 280ms cubic-bezier(0.34,1.2,0.64,1) both', position: 'relative', zIndex: 1, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        {/* Skip button */}
        {step < 3 && (
          <button onClick={handleSkip}
            style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: T.text3, fontSize: 12, fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text2}
            onMouseLeave={e => e.currentTarget.style.color = T.text3}>
            Skip for now
          </button>
        )}

        <StepDots total={STEPS} current={step} />
        {steps[step]}
      </div>
    </div>
  );
}
