import { useState, useEffect, useMemo } from 'react';
import { duesAPI } from '../services/api';

const P = {
  bg:         '#181818',
  surface:    '#1E1E1E',
  raised:     '#252525',
  overlay:    '#2C2C2C',
  border:     '#333333',
  borderHi:   '#444444',
  primary:    '#C0C1FF',
  primaryLo:  'rgba(192,193,255,0.12)',
  primaryMid: 'rgba(192,193,255,0.22)',
  secondary:  '#FFB38E',
  secondaryLo:'rgba(255,179,142,0.12)',
  text1:      '#F0F0F0',
  text2:      '#9090A8',
  text3:      '#555566',
  danger:     '#EF4444',
  dangerLo:   'rgba(239,68,68,0.10)',
};

export const CATEGORIES = {
  assignment:  { label: 'Assignment',     color: '#C0C1FF', bg: 'rgba(192,193,255,0.14)' },
  quiz:        { label: 'Quiz',           color: '#FFB38E', bg: 'rgba(255,179,142,0.14)' },
  observation: { label: 'Observation',    color: '#22C55E', bg: 'rgba(34,197,94,0.14)'   },
  form:        { label: 'Form / Details', color: '#9E9E9E', bg: 'rgba(158,158,158,0.14)' },
  other:       { label: 'Other',          color: '#555566', bg: 'rgba(85,85,102,0.14)'   },
};

const daysUntil = (d) => {
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return -1;
  if (diff < 86400000) return 0;
  return Math.ceil(diff / 86400000);
};
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function urgencyStyle(days) {
  if (days < 0)   return { color: P.danger,    bg: P.dangerLo,    label: 'Overdue'    };
  if (days === 0) return { color: P.secondary, bg: P.secondaryLo, label: 'Due today'  };
  if (days <= 3)  return { color: P.secondary, bg: P.secondaryLo, label: `${days}d left` };
  if (days <= 7)  return { color: P.primary,   bg: P.primaryLo,   label: `${days}d left` };
  return               { color: P.text3,      bg: 'transparent', label: `${days}d left` };
}

//  · · · · Mini calendar  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
function MiniCalendar({ dues, onDayClick, selectedDay }) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const dueDays = useMemo(() => {
    const set = {};
    dues.forEach(d => {
      const dt = new Date(d.due_date);
      if (dt.getFullYear() === viewYear && dt.getMonth() === viewMonth) {
        const day = dt.getDate();
        if (!set[day]) set[day] = [];
        set[day].push(d);
      }
    });
    return set;
  }, [dues, viewYear, viewMonth]);

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday    = (d) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isSelected = (d) => selectedDay && selectedDay.day === d && selectedDay.month === viewMonth && selectedDay.year === viewYear;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  const thisMonthCount = dues.filter(d => {
    const dt = new Date(d.due_date);
    return dt.getFullYear() === viewYear && dt.getMonth() === viewMonth;
  }).length;

  const navBtn = {
    width: 32, height: 32, borderRadius: 9, border: `1px solid ${P.border}`,
    background: P.raised, color: P.text2, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
  };

  return (
    <div style={{ background: P.raised, border: `1px solid ${P.border}`, borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: P.text1, margin: 0, fontFamily: "'Manrope','Inter',sans-serif" }}>
            {MONTHS[viewMonth]} {viewYear}
          </h3>
          {thisMonthCount > 0 && (
            <p style={{ fontSize: 11, color: P.secondary, margin: '3px 0 0', fontWeight: 500 }}>
              {thisMonthCount} deadline{thisMonthCount !== 1 ? 's' : ''} this month
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={prevMonth} style={navBtn}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
          </button>
          <button onClick={nextMonth} style={navBtn}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: P.text3, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const hasDues  = !!dueDays[day];
          const todayCell = isToday(day);
          const selCell   = isSelected(day);
          return (
            <button key={day}
              onClick={() => onDayClick(hasDues ? { day, month: viewMonth, year: viewYear } : null)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '6px 2px', borderRadius: 8, border: 'none',
                cursor: hasDues ? 'pointer' : 'default',
                background: selCell ? P.primaryMid : todayCell ? P.primaryLo : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (hasDues && !selCell) e.currentTarget.style.background = P.primaryLo; }}
              onMouseLeave={e => { if (!selCell) e.currentTarget.style.background = todayCell ? P.primaryLo : 'transparent'; }}
            >
              <span style={{ fontSize: 13, fontWeight: todayCell ? 700 : 400, color: selCell ? P.primary : todayCell ? P.primary : P.text2 }}>
                {day}
              </span>
              {/* Single accent dot for any dues */}
              {hasDues && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: P.primary, marginTop: 2 }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

//  · · · · Due card  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
function DueCard({ due, onNavigate }) {
  const [hov, setHov] = useState(false);
  const days = daysUntil(due.due_date);
  const urg  = urgencyStyle(days);
  const cat  = CATEGORIES[due.category] || CATEGORIES.other;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: P.raised, border: `1px solid ${hov ? P.borderHi : P.border}`,
        borderRadius: 14, padding: '18px 20px', borderLeft: `3px solid ${cat.color}`,
        transition: 'border-color 0.15s', cursor: due.group?.id ? 'pointer' : 'default',
      }}
      onClick={() => due.group?.id && onNavigate?.(due.group.id)}
    >
      {/* Badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          {/* Urgency */}
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: urg.bg, color: urg.color, border: `1px solid ${urg.color}40` }}>
            {urg.label}
          </span>
          {/* Category  · · always accent-colored */}
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: cat.bg, color: cat.color, border: `1px solid ${cat.color}50` }}>
            {cat.label}
          </span>
          {/* Group name */}
          {due.group?.name && (
            <span style={{ fontSize: 11, fontWeight: 500, color: P.text3, letterSpacing: '0.04em' }}>
              {due.group.name}
            </span>
          )}
        </div>
        {due.group?.id && hov && (
          <span style={{ fontSize: 11, color: P.primary, fontWeight: 500, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            Go to group
            <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: P.text1, margin: '0 0 5px', fontFamily: "'Manrope','Inter',sans-serif", lineHeight: 1.3 }}>
        {due.title}
      </h3>

      {/* Description */}
      {due.description && (
        <p style={{ fontSize: 13, fontWeight: 300, color: P.text2, margin: '0 0 12px', lineHeight: 1.6 }}>{due.description}</p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: due.description ? 0 : 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: P.text2 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>
          {fmtDate(due.due_date)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: P.text2 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
          {fmtTime(due.due_date)}
        </span>
        {due.group?.subject && (
          <span style={{ fontSize: 12, color: P.text2 }}>{due.group.subject}</span>
        )}
      </div>
    </div>
  );
}

//  · · · · Filter row (inline dropdowns)  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
function FilterRow({ filter, setFilter, catFilter, setCatFilter }) {
  const statusOptions = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue',  label: 'Overdue'  },
    { key: 'all',      label: 'All Dues' },
  ];
  const catOptions = [
    { key: 'all', label: 'All Categories' },
    ...Object.entries(CATEGORIES).map(([key, c]) => ({ key, label: c.label })),
  ];

  const selStyle = (active) => ({
    padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: active ? 600 : 400,
    cursor: 'pointer', border: `1px solid ${active ? P.primary + '60' : P.border}`,
    background: active ? P.primaryLo : P.raised,
    color: active ? P.primary : P.text2,
    appearance: 'none', WebkitAppearance: 'none',
    fontFamily: 'Inter, sans-serif', outline: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath fill='%23${active ? 'C0C1FF' : '555566'}' d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '10px 10px',
    paddingRight: 28,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select value={filter} onChange={e => setFilter(e.target.value)} style={selStyle(filter !== 'upcoming')}>
        {statusOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selStyle(catFilter !== 'all')}>
        {catOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </div>
  );
}

//  · · · · Main component  · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·
export default function GlobalDuesPanel({ onNavigateToGroup }) {
  const [dues, setDues]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('upcoming');
  const [catFilter, setCatFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setLoading(true);
    duesAPI.listAll()
      .then(res => setDues(res.data))
      .catch(() => setError('Could not load dues'))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();

  const filtered = useMemo(() => {
    let list = [...dues];
    if (selectedDay) {
      return list.filter(d => {
        const dt = new Date(d.due_date);
        return dt.getDate() === selectedDay.day && dt.getMonth() === selectedDay.month && dt.getFullYear() === selectedDay.year;
      });
    }
    if (filter === 'upcoming') list = list.filter(d => new Date(d.due_date).getTime() >= now);
    else if (filter === 'overdue') list = list.filter(d => new Date(d.due_date).getTime() < now);
    if (catFilter !== 'all') list = list.filter(d => (d.category || 'other') === catFilter);
    return list;
  }, [dues, filter, catFilter, selectedDay, now]);

  const overdueCount  = dues.filter(d => new Date(d.due_date).getTime() < now).length;
  const upcomingCount = dues.filter(d => new Date(d.due_date).getTime() >= now).length;
  const todayCount    = dues.filter(d => daysUntil(d.due_date) === 0).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', background: P.bg, fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 400, background: 'radial-gradient(ellipse at top right, rgba(192,193,255,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 400, height: 300, background: 'radial-gradient(ellipse at top left, rgba(255,179,142,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', padding: '32px 28px 48px', position: 'relative' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: P.secondary, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>All Groups</p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: P.text1, margin: '0 0 4px', fontFamily: "'Manrope','Inter',sans-serif", letterSpacing: '-0.03em', lineHeight: 1.1 }}>Due Dates</h1>
          <p style={{ fontSize: 14, fontWeight: 300, color: P.text3, margin: 0 }}>Stay ahead of your academic commitments.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total',     value: dues.length,    color: P.primary   },
            { label: 'Upcoming',  value: upcomingCount,  color: P.primary   },
            { label: 'Overdue',   value: overdueCount,   color: P.danger    },
            { label: 'Due Today', value: todayCount,     color: P.secondary },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, background: P.raised, border: `1px solid ${P.border}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: P.text1, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0, fontFamily: "'Manrope','Inter',sans-serif" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Two-column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Filter row or day selection */}
            {selectedDay ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: P.raised, border: `1px solid ${P.border}`, borderRadius: 12 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill={P.primary}><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/></svg>
                <span style={{ fontSize: 13, fontWeight: 500, color: P.text1, flex: 1 }}>
                  {DAYS[new Date(selectedDay.year, selectedDay.month, selectedDay.day).getDay()]}, {selectedDay.day} {MONTHS[selectedDay.month]} {selectedDay.year}
                </span>
                <button onClick={() => setSelectedDay(null)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, border: `1px solid ${P.border}`, background: 'transparent', color: P.text3, cursor: 'pointer' }}>
                  Clear
                </button>
              </div>
            ) : (
              <FilterRow filter={filter} setFilter={setFilter} catFilter={catFilter} setCatFilter={setCatFilter} />
            )}

            {/* Section title */}
            {!loading && (
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: P.text1, margin: 0, fontFamily: "'Manrope','Inter',sans-serif" }}>
                  {selectedDay
                    ? `${DAYS[new Date(selectedDay.year, selectedDay.month, selectedDay.day).getDay()]} ${selectedDay.day} ${MONTHS[selectedDay.month]}`
                    : filter === 'overdue' ? 'Overdue'
                    : filter === 'upcoming' ? 'Upcoming'
                    : 'All Dues'}
                </h2>
                <span style={{ fontSize: 12, color: P.text3, fontWeight: 400 }}>
                  {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: P.dangerLo, border: '1px solid rgba(239,68,68,0.20)', borderRadius: 10, color: P.danger, fontSize: 12 }}>{error}</div>
            )}

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 100, borderRadius: 14, background: P.raised, border: `1px solid ${P.border}` }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', border: `1px dashed ${P.border}`, borderRadius: 14 }}>
                <svg width="28" height="28" viewBox="0 0 16 16" fill={P.text3} style={{ margin: '0 auto 10px', display: 'block' }}>
                  <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                </svg>
                <p style={{ fontSize: 14, color: P.text3, fontWeight: 300, margin: 0 }}>
                  {selectedDay ? 'No dues on this day' : filter === 'overdue' ? 'No overdue dues' : 'No upcoming dues'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(due => <DueCard key={due.id} due={due} onNavigate={onNavigateToGroup} />)}
              </div>
            )}
          </div>

          {/* Right */}
          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <MiniCalendar dues={dues} onDayClick={setSelectedDay} selectedDay={selectedDay} />

            {/* Overdue alert card */}
            {overdueCount > 0 && (
              <div style={{
                background: 'linear-gradient(145deg, #1E1208 0%, #1A1010 100%)',
                border: '1px solid rgba(255,179,142,0.20)',
                borderRadius: 14, padding: '20px 20px 16px',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Subtle glow */}
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(255,179,142,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <p style={{ fontSize: 10, fontWeight: 700, color: P.secondary, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 8px' }}>
                  Alert
                </p>
                <p style={{ fontSize: 28, fontWeight: 800, color: P.text1, margin: '0 0 10px', fontFamily: "'Manrope','Inter',sans-serif", lineHeight: 1.1 }}>
                  {overdueCount} Overdue
                </p>
                <p style={{ fontSize: 13, fontWeight: 300, color: P.text2, margin: '0 0 16px', lineHeight: 1.6 }}>
                  {(() => {
                    const overdueDues = dues.filter(d => new Date(d.due_date).getTime() < now);
                    const names = [...new Set(overdueDues.map(d => d.title))].slice(0, 2);
                    return `Immediate action required for ${names.join(' and ')}${overdueDues.length > 2 ? ` and ${overdueDues.length - 2} more` : ''}.`;
                  })()}
                </p>
                <button
                  onClick={() => setFilter('overdue')}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10,
                    background: 'rgba(255,179,142,0.12)', border: '1px solid rgba(255,179,142,0.25)',
                    color: P.secondary, fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.10em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,179,142,0.20)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,179,142,0.12)'; }}
                >
                  Review Now
                </button>
              </div>
            )}

            {/* This week */}
            {(() => {
              const weekEnd  = new Date(Date.now() + 7 * 86400000);
              const thisWeek = dues.filter(d => {
                const t = new Date(d.due_date).getTime();
                return t >= Date.now() && t <= weekEnd.getTime();
              });
              if (!thisWeek.length) return null;
              return (
                <div style={{ background: P.raised, border: `1px solid ${P.border}`, borderRadius: 14, padding: '16px 18px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: P.text1, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 14px' }}>
                    This Week
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {thisWeek.slice(0, 5).map(d => {
                      const cat  = CATEGORIES[d.category] || CATEGORIES.other;
                      const days = daysUntil(d.due_date);
                      return (
                        <button key={d.id}
                          onClick={() => d.group?.id && onNavigateToGroup?.(d.group.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: d.group?.id ? 'pointer' : 'default', padding: 0, textAlign: 'left', width: '100%' }}
                        >
                          <div style={{ width: 3, height: 36, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: P.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                            <p style={{ fontSize: 11, color: P.text3, margin: '3px 0 0' }}>
                              {days === 0 ? 'Today' : `${days}d`} · {d.group?.name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
