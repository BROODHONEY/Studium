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


// ── Shared search state via a simple hook ──────────────
export function useSearch() {
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

// ── Sidebar section helper (outside component) ────────
function SideSection({ title, items, renderItem }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', padding: '0 2px' }}>{title} · {items.length}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map(renderItem)}
      </div>
    </div>
  );
}

// ── Sidebar: input + group filter + inline results ────
export function SearchSidebar({ groups, searchState, onNavigate }) {
  const { query, groupId, loading, results, error, handleQuery, handleGroup, clear } = searchState;
  const inputRef = useRef(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const total = results ? results.messages.length + results.files.length + results.announcements.length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {/* Input + filter */}
      <div style={{ padding: '8px 12px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: '8px 12px', boxShadow: '0 0 0 1px rgba(124,58,237,0.08)' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(124,58,237,0.6)', flexShrink: 0 }}>
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input ref={inputRef} value={query} onChange={e => handleQuery(e.target.value)} placeholder="Search…"
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
        <select value={groupId} onChange={e => handleGroup(e.target.value)}
          style={{ width: '100%', marginTop: 8, background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 300, color: groupId ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', outline: 'none', fontFamily: 'Inter, sans-serif', appearance: 'none', cursor: 'pointer' }}
          onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}
          onBlur={e => e.target.style.borderColor = '#1c1c1c'}>
          <option value="">All groups</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 16px' }}>
        {!results && !error && (
          <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.15)', textAlign: 'center', padding: '20px 8px', lineHeight: 1.6 }}>
            {query.length === 0 ? 'Search messages, files and announcements' : query.length < 2 ? 'Type at least 2 characters…' : ''}
          </p>
        )}
        {error && <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.7)', padding: '8px 4px' }}>{error}</p>}
        {results && total === 0 && (
          <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px 8px' }}>No results for "{query}"</p>
        )}
        {results && total > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.2)', padding: '4px 4px 10px', margin: 0 }}>{total} result{total !== 1 ? 's' : ''}</p>
            <SideSection title="Messages" items={results.messages}
              renderItem={msg => (
                <button key={msg.id} onClick={() => onNavigate?.({ type: 'message', groupId: msg.group_id, group: msg.group, messageId: msg.id })}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'none', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <p style={{ fontSize: 10, color: 'rgba(124,58,237,0.7)', margin: '0 0 2px' }}>{msg.group?.name}</p>
                  <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.content?.slice(0, 60)}</p>
                </button>
              )}
            />
            <SideSection title="Files" items={results.files}
              renderItem={file => (
                <button key={file.id} onClick={() => onNavigate?.({ type: 'file', groupId: file.group_id, group: file.group, fileId: file.id })}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'none', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill={fileColor(file.file_type)} style={{ flexShrink: 0 }}><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/></svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.7)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '1px 0 0' }}>{file.group?.name}</p>
                  </div>
                </button>
              )}
            />
            <SideSection title="Announcements" items={results.announcements}
              renderItem={ann => (
                <button key={ann.id} onClick={() => onNavigate?.({ type: 'announcement', groupId: ann.group_id, group: ann.group })}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, background: 'none', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <p style={{ fontSize: 10, color: 'rgba(124,58,237,0.7)', margin: '0 0 2px' }}>{ann.group?.name}</p>
                  <p style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.7)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ann.title}</p>
                  <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ann.content?.slice(0, 50)}</p>
                </button>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
}


// ── Main panel: description ───────────────────────────
function SearchResults() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.35) 0%, rgba(76,29,149,0.15) 35%, transparent 65%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(124,58,237,0.4)', margin: '0 auto 14px', display: 'block' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p style={{ fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>Search</p>
        <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.6 }}>
          Type in the sidebar to search across messages, files and announcements in your groups.
        </p>
      </div>
    </div>
  );
}

