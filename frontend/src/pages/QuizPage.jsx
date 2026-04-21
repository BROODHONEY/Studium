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

// ââââ Pre-start alert modal ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function StartAlertModal({ quiz, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.amberLo, border: `1px solid ${T.amber}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill={T.amber}><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: T.text1, margin: '0 0 6px' }}>Before you begin</p>
          <p style={{ fontSize: 13, color: T.text2, margin: '0 0 20px', lineHeight: 1.6 }}>
            Read the rules carefully before starting.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {[
              { icon: 'â ±', text: `You have ${quiz?.duration_mins} minute${quiz?.duration_mins !== 1 ? 's' : ''} to complete this quiz.` },
              { icon: 'ð«', text: 'The quiz cannot be paused or stopped once started.' },
              { icon: 'ðââ', text: 'Closing or refreshing the tab will not stop the timer.' },
              { icon: 'ðâ', text: `${quiz?.questions?.length} question${quiz?.questions?.length !== 1 ? 's' : ''} ââ answer all before submitting.` },
              { icon: 'ââ¦', text: 'You can navigate between questions freely before submitting.' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                <span style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'none', border: `1px solid ${T.border}`, color: T.text2, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '11px', borderRadius: 10, background: T.green, border: 'none', color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            I understand ââ Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

// ââââ Unanswered warning modal ââââââââââââââââââââââââââââââââââââââââââââââââââââ
function UnansweredModal({ unanswered, total, onGoTo, onSubmitAnyway, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: T.redLo, border: `1px solid ${T.red}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill={T.red}><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.text1, margin: '0 0 6px' }}>
            {unanswered.length} question{unanswered.length !== 1 ? 's' : ''} unanswered
          </p>
          <p style={{ fontSize: 13, color: T.text2, margin: '0 0 16px', lineHeight: 1.5 }}>
            You haven't answered {unanswered.length === total ? 'any' : 'all'} questions. Unanswered questions will be marked incorrect.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {unanswered.map(n => (
              <button key={n} onClick={() => onGoTo(n - 1)}
                style={{ width: 36, height: 36, borderRadius: 8, background: T.redLo, border: `1px solid ${T.red}50`, color: T.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'none', border: `1px solid ${T.border}`, color: T.text2, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Go back
          </button>
          <button onClick={onSubmitAnyway} style={{ flex: 1, padding: '11px', borderRadius: 10, background: T.red, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            Submit anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { groupId, quizId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [quiz, setQuiz]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [phase, setPhase]       = useState('loading'); // loading | confirm | waiting | active | done | already
  const [answers, setAnswers]   = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const timerRef = useRef(null);

  const submit = useCallback(async (ans) => {
    if (submitting) return;
    setSubmitting(true);
    setShowUnanswered(false);
    clearInterval(timerRef.current);
    try {
      const res = await quizzesAPI.attempt(groupId, quizId, { answers: ans });
      setResult(res.data);
      setPhase('done');
      localStorage.removeItem(`quiz_started_${quizId}`);
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
        if (r.data.my_attempt) { setPhase('already'); localStorage.removeItem(`quiz_started_${quizId}`); }
        else {
          const now = Date.now();
          const start = new Date(r.data.starts_at).getTime();
          const end   = new Date(r.data.ends_at).getTime();
          if (now < start) { setPhase('waiting'); }
          else if (now > end) { setPhase('done'); }
          else {
            const storageKey = `quiz_started_${quizId}`;
            const startedAt = localStorage.getItem(storageKey);
            if (startedAt) {
              // Already started before ââ jump straight in
              const elapsed = Math.floor((now - Number(startedAt)) / 1000);
              const remaining = Math.max(0, r.data.duration_mins * 60 - elapsed);
              setTimeLeft(remaining);
              setPhase('active');
            } else {
              // First time ââ show confirm modal
              setPhase('confirm');
            }
          }
        }
      })
      .catch(e => setError(e?.response?.data?.error || 'Could not load quiz'))
      .finally(() => setLoading(false));
  }, [authLoading, user, groupId, quizId]);

  const handleConfirmStart = () => {
    const now = Date.now();
    localStorage.setItem(`quiz_started_${quizId}`, String(now));
    setTimeLeft(quiz.duration_mins * 60);
    setPhase('active');
  };

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

  const handleSubmitClick = () => {
    if (!quiz?.questions) return;
    const unanswered = quiz.questions
      .map((q, i) => answers[q.id] === undefined ? i + 1 : null)
      .filter(Boolean);
    if (unanswered.length > 0) { setShowUnanswered(true); return; }
    submit(answers);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft < 60 ? T.red : timeLeft < 180 ? T.amber : T.green;
  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'ââ';

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

  const questions = quiz?.questions || [];
  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Inter, sans-serif', color: T.text1 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {/* Pre-start confirm modal */}
      {phase === 'confirm' && (
        <StartAlertModal quiz={quiz} onConfirm={handleConfirmStart} onCancel={() => window.close()} />
      )}

      {/* Unanswered warning */}
      {showUnanswered && (
        <UnansweredModal
          unanswered={questions.map((q, i) => answers[q.id] === undefined ? i + 1 : null).filter(Boolean)}
          total={questions.length}
          onGoTo={(idx) => { setCurrentQ(idx); setShowUnanswered(false); }}
          onSubmitAnyway={() => submit(answers)}
          onCancel={() => setShowUnanswered(false)}
        />
      )}

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

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 100px' }}>

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
            {result && result.show_score !== false && result.score != null && (
              <p style={{ fontSize: 15, color: T.primary, margin: '0 0 6px' }}>
                Score: {result.score} / {result.total}
                {result.total > 0 && <span style={{ color: T.text2, fontSize: 13 }}> ({Math.round((result.score / result.total) * 100)}%)</span>}
              </p>
            )}
            {result && result.show_score === false && (
              <p style={{ fontSize: 13, color: T.text2, margin: '0 0 6px' }}>Your score will not be shown for this quiz.</p>
            )}
            <p style={{ fontSize: 12, color: T.text3 }}>This tab will close automaticallyâ¦</p>
            <button onClick={() => window.close()} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, border: 'none', background: T.primary, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Close Now</button>
          </div>
        )}

        {/* ACTIVE ââ one question at a time */}
        {phase === 'active' && q && (
          <>
            {/* Question number nav */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {questions.map((qq, i) => {
                const answered = answers[qq.id] !== undefined;
                const isCurrent = i === currentQ;
                return (
                  <button key={qq.id} onClick={() => setCurrentQ(i)}
                    style={{
                      width: 36, height: 36, borderRadius: 9, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${isCurrent ? T.primary : answered ? T.green : T.border}`,
                      background: isCurrent ? T.primaryLo : answered ? T.greenLo : T.card,
                      color: isCurrent ? T.primary : answered ? T.green : T.text3,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.12s',
                    }}>
                    {i + 1}
                  </button>
                );
              })}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: T.text3, alignSelf: 'center' }}>
                {answeredCount}/{questions.length} answered
              </span>
            </div>

            {/* Question card */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '28px 28px 24px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: T.text3, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Question {currentQ + 1} of {questions.length}
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: T.text1, margin: '0 0 24px', lineHeight: 1.6 }}>
                {q.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(q.options || []).map((opt, oi) => {
                  const selected = answers[q.id] === oi;
                  return (
                    <button key={oi} onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 11, border: `1.5px solid ${selected ? T.primary : T.border}`, background: selected ? T.primaryLo : T.card, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${selected ? T.primary : T.border}`, background: selected ? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: selected ? '#131313' : T.text3, transition: 'all 0.15s' }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span style={{ fontSize: 14, color: selected ? T.primary : T.text2, fontWeight: selected ? 500 : 300, lineHeight: 1.5 }}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prev / Next navigation */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCurrentQ(i => Math.max(0, i - 1))} disabled={currentQ === 0}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'none', color: currentQ === 0 ? T.text3 : T.text2, fontSize: 13, cursor: currentQ === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: currentQ === 0 ? 0.4 : 1 }}>
                â Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ(i => i + 1)}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${T.primary}60`, background: T.primaryLo, color: T.primary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Next ââ
                </button>
              ) : (
                <button onClick={handleSubmitClick} disabled={submitting}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: T.green, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Submittingâ¦' : 'Submit Quiz'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Fixed submit bar (always visible during active) */}
      {phase === 'active' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, zIndex: 9 }}>
          <span style={{ fontSize: 12, color: T.text3 }}>
            {answeredCount} / {questions.length} answered
          </span>
          <button onClick={handleSubmitClick} disabled={submitting}
            style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: T.green, color: '#131313', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Submittingâ¦' : 'Submit Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}
