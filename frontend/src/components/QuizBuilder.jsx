import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { quizzesAPI } from '../services/api';

const T = {
  bg: '#181818', surface: '#1E1E1E', card: '#252525', cardHi: '#2C2C2C',
  border: '#333333', borderHi: '#444444',
  primary: '#C0C1FF', primaryLo: 'rgba(192,193,255,0.12)',
  green: '#22C55E', greenLo: 'rgba(34,197,94,0.12)',
  red: '#EF4444', redLo: 'rgba(239,68,68,0.12)',
  amber: '#F59E0B',
  text1: '#F0F0F0', text2: '#9E9E9E', text3: '#555555',
};

const inp = {
  width: '100%', background: T.card, border: `1px solid ${T.border}`,
  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: T.text1,
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const emptyQuestion = () => ({ question: '', options: ['', '', '', ''], correct_index: 0 });

export default function QuizBuilder({ groupId, onCreated, onCancel }) {
  const { addToast } = useToast();
  const [meta, setMeta] = useState({ title: '', description: '', duration_mins: 10, start_date: '', start_time: '', end_date: '', end_time: '', show_score: true });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('meta'); // meta | questions

  const setQ = (i, field, val) => setQuestions(qs => qs.map((q, qi) => qi === i ? { ...q, [field]: val } : q));
  const setOpt = (qi, oi, val) => setQuestions(qs => qs.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q));
  const addQ = () => setQuestions(qs => [...qs, emptyQuestion()]);
  const removeQ = (i) => setQuestions(qs => qs.filter((_, qi) => qi !== i));

  const handleSubmit = async () => {
    if (!meta.title || !meta.start_date || !meta.end_date) { addToast({ type: 'error', message: 'Fill all required fields' }); return; }
    if (questions.some(q => !q.question || q.options.some(o => !o))) { addToast({ type: 'error', message: 'Complete all questions and options' }); return; }
    const starts_at = new Date(`${meta.start_date}T${meta.start_time || '00:00'}`).toISOString();
    const ends_at   = new Date(`${meta.end_date}T${meta.end_time || '23:59'}`).toISOString();
    if (new Date(ends_at) <= new Date(starts_at)) { addToast({ type: 'error', message: 'Closing date/time must be after opening date/time' }); return; }
    setLoading(true);
    try {
      const res = await quizzesAPI.create(groupId, { title: meta.title, description: meta.description, duration_mins: Number(meta.duration_mins), starts_at, ends_at, questions, show_score: meta.show_score });
      addToast({ type: 'success', message: 'Quiz created' });
      onCreated(res.data);
    } catch { addToast({ type: 'error', message: 'Failed to create quiz' }); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.12em', flex: 1 }}>Quiz Builder</span>
        <button onClick={() => setStep('meta')} style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${step === 'meta' ? T.primary : T.border}`, background: step === 'meta' ? T.primaryLo : 'none', color: step === 'meta' ? T.primary : T.text3, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Details</button>
        <button onClick={() => setStep('questions')} style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${step === 'questions' ? T.primary : T.border}`, background: step === 'questions' ? T.primaryLo : 'none', color: step === 'questions' ? T.primary : T.text3, fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Questions ({questions.length})</button>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {step === 'meta' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Title *</label>
              <input style={inp} placeholder="Quiz title" value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
                onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</label>
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} placeholder="Instructions..." value={meta.description}
                onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Duration (minutes) *</label>
              <input type="number" min="1" max="180" style={{ ...inp, width: 120 }} value={meta.duration_mins}
                onChange={e => setMeta(m => ({ ...m, duration_mins: e.target.value }))}
                onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}` }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: T.text1, margin: 0 }}>Show score to students</p>
                <p style={{ fontSize: 11, color: T.text3, margin: '2px 0 0' }}>Students will see their score after submitting</p>
              </div>
              <button type="button" onClick={() => setMeta(m => ({ ...m, show_score: !m.show_score }))}
                style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: meta.show_score ? T.green : T.border, transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: meta.show_score ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Opens Date *</label>                <input type="date" style={inp} value={meta.start_date} onChange={e => setMeta(m => ({ ...m, start_date: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Opens Time</label>
                <input type="time" style={inp} value={meta.start_time} onChange={e => setMeta(m => ({ ...m, start_time: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Closes Date *</label>
                <input type="date" style={inp} value={meta.end_date}
                  min={meta.start_date || undefined}
                  onChange={e => setMeta(m => ({ ...m, end_date: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Closes Time</label>
                <input type="time" style={inp} value={meta.end_time}
                  min={meta.end_date && meta.end_date === meta.start_date ? (meta.start_time || undefined) : undefined}
                  onChange={e => setMeta(m => ({ ...m, end_time: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={() => setStep('questions')} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: T.primary, color: '#131313', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Next: Questions  · </button>
            </div>
          </>
        )}

        {step === 'questions' && (
          <>
            {questions.map((q, qi) => (
              <div key={qi} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', flex: 1 }}>Q{qi + 1}</span>
                  {questions.length > 1 && (
                    <button onClick={() => removeQ(qi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, fontSize: 11, fontFamily: 'Inter, sans-serif', padding: '2px 6px' }}
                      onMouseEnter={e => e.currentTarget.style.color = T.red}
                      onMouseLeave={e => e.currentTarget.style.color = T.text3}>Remove</button>
                  )}
                </div>
                <input style={inp} placeholder="Question text" value={q.question} onChange={e => setQ(qi, 'question', e.target.value)}
                  onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Options  · ·  click radio to mark correct answer</label>
                  {q.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button onClick={() => setQ(qi, 'correct_index', oi)} title="Mark as correct"
                        style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${q.correct_index === oi ? T.green : T.border}`, background: q.correct_index === oi ? T.green : 'transparent', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }} />
                      <input style={{ ...inp, flex: 1 }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} value={opt}
                        onChange={e => setOpt(qi, oi, e.target.value)}
                        onFocus={e => e.target.style.borderColor = q.correct_index === oi ? T.green : T.primary}
                        onBlur={e => e.target.style.borderColor = T.border} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={addQ}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, border: `1px dashed ${T.border}`, background: 'none', color: T.text3, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
              Add Question
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button onClick={() => setStep('meta')} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${T.border}`, background: 'none', color: T.text2, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}> · · Back</button>
              <button onClick={handleSubmit} disabled={loading} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: T.primary, color: '#131313', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
