import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quizzesAPI } from '../services/api';

const T = {
  bg: '#181818', surface: '#1E1E1E', card: '#252525', cardHi: '#2C2C2C',
  border: '#333333', borderHi: '#444444',
  primary: '#C0C1FF', primaryLo: 'rgba(192,193,255,0.12)',
  green: '#22C55E', greenLo: 'rgba(34,197,94,0.12)',
  red: '#EF4444', redLo: 'rgba(239,68,68,0.12)',
  amber: '#F59E0B', amberLo: 'rgba(245,158,11,0.12)',
  text1: '#F0F0F0', text2: '#9E9E9E', text3: '#555555',
};

function pad(n) { return String(n).padStart(2, '0'); }

export default function QuizPage() {
  const { groupId, quizId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [quiz, setQuiz]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [phase, setPhase]     = useState('loading'); // loading | waiting | active | done | already
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]   = useState(null);
  const timerRef = useRef(null);

  const submit = useCallback(async (ans) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const res = await quizzesAPI.attempt(groupId, quizId, { answers: ans });
      setResult(res.data);
      setPhase('done');
    } catch (err) {
      setError(err?.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  }, [groupId, quizId, submitting]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setError('Please log in to take this quiz.'); setLoading(false); return; }
    quizzesAPI.get(groupId, quizId)
      .then(r => {
        setQuiz(r.data);
        if (r.data.my_attempt) { setPhase('already'); }
        else {
          const now = Date.now();
          const start = new Date(r.data.starts_at).getTime();
          const end   = new Date(r.data.ends_at).getTime();
          if (now < start) setPhase('waiting');
          else if (now > end) setPhase('done');
          else { setPhase('active'); setTimeLeft(r.data.duration_mins * 60); }
        }
      })
      .catch(e => setError(e?.response?.data?.error || 'Could not load quiz'))
      .finally(() => setLoading(false));
  }, [authLoading, user, groupId, quizId]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submit(answers); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]); // eslint-disable-line

  // Auto-close after done
  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => window.close(), 4000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 60 ? T.red : timeLeft < 180 ? T.amber : T.green;

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading || authLoading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${T.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <p style={{ fontSize: 16, color: T.red, marginBottom: 8 }}>{error}</p>
        <button onClick={() => window.close()} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'none', color: T.text2, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Close</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text1 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quiz?.title}</p>
          <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>{quiz?.description}</p>
        </div>
        {phase === 'active' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: `${timerColor}18`, border: `1px solid ${timerColor}40` }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill={timerColor}><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>{pad(mins)}:{pad(secs)}</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* WAITING */}
        {phase === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <svg width="40" height="40" viewBox="0 0 16 16" fill={T.amber} style={{ marginBottom: 16 }}><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
            <p style={{ fontSize: 18, fontWeight: 700, color: T.text1, margin: '0 0 8px' }}>Quiz hasn't started yet</p>
            <p style={{ fontSize: 13, color: T.text2 }}>Opens at {fmt(quiz?.starts_at)}</p>
          </div>
        )}

        {/* ALREADY ATTEMPTED */}
        {phase === 'already' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <svg width="40" height="40" viewBox="0 0 16 16" fill={T.green} style={{ marginBottom: 16 }}><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>
            <p style={{ fontSize: 18, fontWeight: 700, color: T.text1, margin: '0 0 8px' }}>Already submitted</p>
            <p style={{ fontSize: 13, color: T.text2, marginBottom: 24 }}>You've already completed this quiz.</p>
            <button onClick={() => window.close()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: T.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Close</button>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <svg width="48" height="48" viewBox="0 0 16 16" fill={T.green} style={{ marginBottom: 16 }}><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>
            <p style={{ fontSize: 22, fontWeight: 800, color: T.text1, margin: '0 0 8px', fontFamily: "'Manrope','Inter',sans-serif" }}>Quiz Submitted!</p>
            {result && <p style={{ fontSize: 15, color: T.primary, margin: '0 0 6px' }}>Score: {result.score} / {result.total}</p>}
            <p style={{ fontSize: 12, color: T.text3 }}>This tab will close automatically…</p>
            <button onClick={() => window.close()} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, border: 'none', background: T.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Close Now</button>
          </div>
        )}

        {/* ACTIVE — questions */}
        {phase === 'active' && quiz?.questions && (
          <>
            <p style={{ fontSize: 11, color: T.text3, marginBottom: 20 }}>{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''} · {quiz.duration_mins} min</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {quiz.questions.map((q, qi) => (
                <div key={q.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: '20px 22px' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.text1, margin: '0 0 16px', lineHeight: 1.5 }}>
                    <span style={{ color: T.text3, marginRight: 8 }}>{qi + 1}.</span>{q.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(q.options || []).map((opt, oi) => {
                      const selected = answers[q.id] === oi;
                      return (
                        <button key={oi} onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${selected ? T.primary : T.border}`, background: selected ? T.primaryLo : T.card, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selected ? T.primary : T.border}`, background: selected ? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: selected ? '#131313' : T.text3, transition: 'all 0.15s' }}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span style={{ fontSize: 13, color: selected ? T.primary : T.text2, fontWeight: selected ? 500 : 300 }}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit bar */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ fontSize: 12, color: T.text3 }}>
                {Object.keys(answers).length} / {quiz.questions.length} answered
              </span>
              <button onClick={() => submit(answers)} disabled={submitting}
                style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: T.green, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit Quiz'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
