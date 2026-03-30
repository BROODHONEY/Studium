import { useState, useRef, useEffect, useCallback } from 'react';
import { searchAPI } from '../services/api';

const TYPE_COLORS = { pdf: '#ef4444', ppt: '#f97316', doc: '#3b82f6', img: '#10b981' };
const fileColor = (mime = '') => {
  if (mime.includes('pdf')) return TYPE_COLORS.pdf;
  if (mime.includes('powerpoint') || mime.includes('presentation')) return TYPE_COLORS.ppt;
  if (mime.includes('word') || mime.includes('document')) return TYPE_COLORS.doc;
  if (mime.startsWith('image/')) return TYPE_COLORS.img;
  return 'rgba(255,255,255,0.3)';
};
const TAG_COLORS = {
  urgent: 'rgba(239,68,68,0.8)', exam: 'rgba(167,139,250,0.8)',
  assignment: 'rgba(251,191,36,0.8)', event: 'rgba(20,184,166,0.8)',
  general: 'rgba(255,255,255,0.3)',
};

function hl(text = '', query = '') {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'rgba(124,58,237,0.35)', color: 'rgba(196,181,253,0.95)', borderRadius: 3, padding: '0 2px' }}>{p}</mark>
      : p
  );
}

// ── Shared search state via a simple hook ──────────────
export function useSearch(groups) {
  const [query, setQuery]     = useState('');
  const [groupId, setGroupId] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const timerRef = useRef(null);

  const doSearch = useCallback(async (q, gid) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true); setError('');
    try {
      const res = await searchAPI.query(q.trim(), gid || undefined);
      setResults(res.data);
    } catch { setError('Search failed.'); }
    finally { setLoading(false); }
  }, []);

  const handleQuery = (val) => {
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val, groupId), 350);
  };

  const handleGroup = (gid) => {
    setGroupId(gid);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query, gid), 100);
  };

  const clear = () => { setQuery(''); setResults(null); setError(''); };

  return { query, groupId, results, loading, error, handleQuery, handleGroup, clear };
}

// ── Sidebar: input + group filter ─────────────────────
export function SearchSidebar({ groups, searchState }) {
  const { query, groupId, loading, handleQuery, handleGroup, clear } = searchState;
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '12px 12px 10px', flexShrink: 0 }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 0 0 1px rgba(124,58,237,0.08)' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(124,58,237,0.6)', flexShrink: 0 }}>
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input ref={inputRef} value={query} onChange={e => handleQuery(e.target.value)}
            placeholder="Search…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif', minWidth: 0 }}/>
          {loading && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(124,58,237,0.6)', animation: 'spin 0.7s linear infinite', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
          )}
          {query && !loading && (
            <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', lineHeight: 0, padding: 0, flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
            </button>
          )}
        </div>

        {/* Group filter */}
        <select value={groupId} onChange={e => handleGroup(e.target.value)}
          style={{ width: '100%', marginTop: 8, background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 300, color: groupId ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', outline: 'none', fontFamily: 'Inter, sans-serif', appearance: 'none', cursor: 'pointer' }}
          onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
          onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
          <option value="">All groups</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Hint */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.12)', textAlign: 'center', lineHeight: 1.6 }}>
          {query.length === 0 ? 'Type to search messages, files and announcements' :
           query.length < 2 ? 'Type at least 2 characters…' :
           'Results appear in the main panel →'}
        </p>
      </div>
    </div>
  );
}

// ── Main panel: results ────────────────────────────────
export default function SearchResults({ searchState, onNavigate }) {
  const { query, results, error } = searchState;
  const total = results ? results.messages.length + results.files.length + results.announcements.length : 0;

  const Section = ({ title, icon, items, renderItem }) => {
    if (!items?.length) return null;
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          {icon}
          <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
          <span style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>{items.length}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(renderItem)}
        </div>
      </div>
    );
  };

  if (!results && !error) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.45) 0%, rgba(76,29,149,0.2) 35%, transparent 65%)', pointerEvents: 'none' }} />
      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 300, position: 'relative' }}>
        {query.length >= 2 ? 'Searching…' : 'Enter a search term in the sidebar'}
      </p>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {error && <p style={{ fontSize: 13, color: 'rgba(239,68,68,0.7)', marginBottom: 16 }}>{error}</p>}

      {results && total === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
          <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>No results for "{query}"</p>
        </div>
      )}

      {results && total > 0 && (
        <>
          <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)', marginBottom: 20 }}>{total} result{total !== 1 ? 's' : ''} for "{query}"</p>

          <Section title="Messages"
            icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.25)' }}><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12z"/></svg>}
            items={results.messages}
            renderItem={msg => (
              <button key={msg.id} onClick={() => onNavigate({ type: 'message', groupId: msg.group_id, group: msg.group, messageId: msg.id })}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: '#0d0d0d', border: '1px solid #1c1c1c', cursor: 'pointer', transition: 'border-color 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1c1c1c'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(124,58,237,0.7)' }}>{msg.group?.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>{msg.users?.name}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.65)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hl(msg.content?.slice(0, 100), query)}
                </p>
              </button>
            )}
          />

          <Section title="Files"
            icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.25)' }}><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/></svg>}
            items={results.files}
            renderItem={file => (
              <button key={file.id} onClick={() => onNavigate({ type: 'file', groupId: file.group_id, group: file.group, fileId: file.id })}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: '#0d0d0d', border: '1px solid #1c1c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1c1c1c'}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${fileColor(file.file_type)}18`, border: `1px solid ${fileColor(file.file_type)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill={fileColor(file.file_type)}>
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {hl(file.filename, query)}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>{file.group?.name}</p>
                </div>
              </button>
            )}
          />

          <Section title="Announcements"
            icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.25)' }}><path d="M13.5 3a.5.5 0 0 1 .5.5V11H2V3.5a.5.5 0 0 1 .5-.5h11zm-11-1A1.5 1.5 0 0 0 1 3.5V12h14V3.5A1.5 1.5 0 0 0 13.5 2h-11zm-2 13a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1H.5a.5.5 0 0 1-.5-.5z"/></svg>}
            items={results.announcements}
            renderItem={ann => (
              <button key={ann.id} onClick={() => onNavigate({ type: 'announcement', groupId: ann.group_id, group: ann.group })}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, background: '#0d0d0d', border: '1px solid #1c1c1c', cursor: 'pointer', transition: 'border-color 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1c1c1c'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: TAG_COLORS[ann.tag] || TAG_COLORS.general, textTransform: 'capitalize' }}>{ann.tag}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(124,58,237,0.7)' }}>{ann.group?.name}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.75)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hl(ann.title, query)}
                </p>
                <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {hl(ann.content?.slice(0, 80), query)}
                </p>
              </button>
            )}
          />
        </>
      )}
    </div>
  );
}
