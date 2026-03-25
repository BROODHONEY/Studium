const TZ  = 'Asia/Kolkata';
const LOC = 'en-GB';

const opts = (extra = {}) => ({ timeZone: TZ, ...extra });

/**
 * Supabase returns timestamps without a 'Z' suffix, so JS parses them as
 * local time instead of UTC. We append 'Z' if no timezone info is present.
 */
const toUTC = (ts) => {
  if (!ts) return new Date(ts);
  const s = String(ts);
  // Already has timezone info (Z, +, or -)
  if (/[Z+\-]\d*$/.test(s.trim()) || s.endsWith('Z')) return new Date(s);
  return new Date(s + 'Z');
};

/** "9:04 PM" */
export const formatTime = (ts) =>
  toUTC(ts).toLocaleTimeString(LOC, opts({ hour: 'numeric', minute: '2-digit', hour12: true }));

/** "Wed, 25 Mar 2026" */
export const formatDate = (ts) =>
  toUTC(ts).toLocaleDateString(LOC, opts({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));

/** "Wed, 25 Mar 2026 · 9:04 PM" — skips time if midnight in IST */
export const formatDateTime = (ts) => {
  const dt   = toUTC(ts);
  const hm   = dt.toLocaleTimeString(LOC, opts({ hour: 'numeric', minute: '2-digit', hour12: false }));
  const date = dt.toLocaleDateString(LOC, opts({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
  if (hm === '00:00') return date;
  const time = dt.toLocaleTimeString(LOC, opts({ hour: 'numeric', minute: '2-digit', hour12: true }));
  return `${date} · ${time}`;
};

/** "Today" / "Yesterday" / "25 March 2026" — for date separators */
export const getDateLabel = (ts) => {
  const toISTDate = (d) => d.toLocaleDateString('en-CA', opts());
  const d   = toUTC(ts);
  const now = new Date();
  if (toISTDate(d) === toISTDate(now)) return 'Today';
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (toISTDate(d) === toISTDate(yesterday)) return 'Yesterday';
  return d.toLocaleDateString(LOC, opts({ day: 'numeric', month: 'long', year: 'numeric' }));
};

/** "25 Mar" or "9:04 PM" — for DM list preview */
export const formatShort = (ts) => {
  const d   = toUTC(ts);
  const now = new Date();
  const toISTDate = (x) => x.toLocaleDateString('en-CA', opts());
  if (toISTDate(d) === toISTDate(now))
    return d.toLocaleTimeString(LOC, opts({ hour: 'numeric', minute: '2-digit', hour12: true }));
  return d.toLocaleDateString(LOC, opts({ day: 'numeric', month: 'short' }));
};

/** YYYY-MM-DD in IST — for date inputs */
export const toISTDateInput = (ts) =>
  toUTC(ts).toLocaleDateString('en-CA', opts());

/** HH:MM in IST — for time inputs */
export const toISTTimeInput = (ts) =>
  toUTC(ts).toLocaleTimeString(LOC, opts({ hour: '2-digit', minute: '2-digit', hour12: false }));
