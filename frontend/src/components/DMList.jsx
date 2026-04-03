import { useState, useEffect } from 'react';
import { dmAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import OnlineDot from './OnlineDot';
import { formatShort } from '../utils/time';

const ini = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const AVATAR_COLORS = ['#4f46e5','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const cleanPreview = (content) => {
  if (!content) return '';
  if (content.startsWith('{{private_reply:')) {
    const end = content.indexOf('}}');
    const msg = end !== -1 ? content.slice(end + 2).replace(/^\n/, '') : '';
    return (msg
      .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
      .replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, '📎 $1')
      .slice(0, 60)) || 'Private reply';
  }
  return content
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
    .replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, '📎 $1')
    .slice(0, 60);
};

export default function DMList({ activeConvoId, onSelect }) {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const { dmUnreads } = useNotifications();

  const [convos, setConvos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    dmAPI.getConversations()
      .then(res => setConvos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handle = ({ conversationId, message }) => {
      setConvos(prev => {
        const idx = prev.findIndex(c => c.id === conversationId);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], last_message: { ...message, sender_id: message.sender?.id } };
        return [updated, ...prev.filter(c => c.id !== conversationId)];
      });
    };
    socket.on('new_dm', handle);
    return () => socket.off('new_dm', handle);
  }, [socket]);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { const res = await dmAPI.search(search); setResults(res.data); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleStartConvo = async (u) => {
    try {
      const res = await dmAPI.startConversation(u.id);
      const convo = res.data;
      setConvos(prev => prev.find(c => c.id === convo.id) ? prev : [{ ...convo, other: u, unread_count: 0 }, ...prev]);
      setSearch(''); setResults([]);
      onSelect({ ...convo, other: u });
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Search bar — identical to GroupList */}
      <div style={{ padding: '8px 12px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 10, padding: '8px 12px' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}/>
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', lineHeight: 0, padding: 0 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {search.trim() && (
        <div style={{ borderBottom: '1px solid #1c1c1c', flexShrink: 0 }}>
          {searching ? (
            <p style={{ padding: '10px 16px', fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.45)' }}>Searching…</p>
          ) : results.length === 0 ? (
            <p style={{ padding: '10px 16px', fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.45)' }}>No users found</p>
          ) : results.map(u => (
            <button key={u.id} onClick={() => handleStartConvo(u)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarBg(u.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff' }}>
                  {ini(u.name)}
                </div>
                <OnlineDot userId={u.id} style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, border: '1.5px solid #080808' }}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize', flexShrink: 0 }}>{u.role}</span>
            </button>
          ))}
        </div>
      )}

      {/* Conversations list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 56, borderRadius: 8, background: '#0d0d0d', marginBottom: 4 }}/>
          ))
        ) : convos.length === 0 && !search ? (
          <p style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '24px 12px', lineHeight: 1.6 }}>
            Search for someone by email to start a conversation
          </p>
        ) : convos.map(convo => {
          const other    = convo.other;
          const active   = activeConvoId === convo.id;
          const hasUnread = dmUnreads?.has(convo.id) && !active;
          const preview  = convo.last_message
            ? (convo.last_message.sender_id === user?.id ? 'You: ' : '') + cleanPreview(convo.last_message.content)
            : 'No messages yet';
          const timeStr  = convo.last_message?.created_at ? formatShort(convo.last_message.created_at) : '';

          return (
            <button key={convo.id} onClick={() => onSelect(convo)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                textAlign: 'left', background: active ? 'rgba(255,255,255,0.07)' : 'none',
                transition: 'background 0.1s', marginBottom: 2,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff' }}>
                  {ini(other?.name)}
                </div>
                <OnlineDot userId={other?.id} style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, border: '1.5px solid #080808' }}/>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: active ? 400 : 300, color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {other?.name}
                  </p>
                  {timeStr && (
                    <span style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>{timeStr}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 300, color: hasUnread ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {preview}
                  </p>
                  {hasUnread && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }}/>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
