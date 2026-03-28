import { useState, useEffect } from 'react';
import { dmAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import OnlineDot from './OnlineDot';
import { formatShort } from '../utils/time';

const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const COLORS = ['bg-brand-600','bg-teal-600','bg-purple-600','bg-pink-600','bg-amber-600','bg-green-600'];
const avatarColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const cleanPreview = (content) => {
  if (!content) return '';
  if (content.startsWith('{{private_reply:')) {
    const end = content.indexOf('}}');
    const msg = end !== -1 ? content.slice(end + 2).replace(/^\n/, '') : '';
    return msg
      .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
      .replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, '📎 $1')
      .slice(0, 60) || '📎 Private reply';
  }
  return content
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
    .replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, '📎 $1')
    .slice(0, 60);
};

export default function DMList({ activeConvoId, onSelect }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { dmUnreads } = useNotifications();
  const [convos, setConvos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    dmAPI.getConversations()
      .then(res => setConvos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Bubble convo to top on new DM
  useEffect(() => {
    if (!socket) return;
    const handle = ({ conversationId, message }) => {
      setConvos(prev => {
        const idx = prev.findIndex(c => c.id === conversationId);
        if (idx === -1) return prev; // unknown convo, skip
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

  const formatTime = (ts) => ts ? formatShort(ts) : '';

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b dark:border-brand-900/30 border-gray-100 flex-shrink-0">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="form-input text-sm" />
      </div>

      {/* Search results */}
      {search.trim() && (
        <div className="border-b dark:border-brand-900/30 border-gray-100 flex-shrink-0">
          {searching ? (
            <div className="px-4 py-3 text-xs dark:text-gray-500 text-gray-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs dark:text-gray-500 text-gray-400">No users found</div>
          ) : results.map(u => (
            <button key={u.id} onClick={() => handleStartConvo(u)}
              className="w-full flex items-center gap-3 px-3 py-2.5 transition text-left
                dark:hover:bg-surface-3 hover:bg-gray-50">
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-xs font-semibold text-white`}>
                  {initials(u.name)}
                </div>
                <OnlineDot userId={u.id} className="absolute -bottom-0.5 -right-0.5 ring-2 dark:ring-surface-1 ring-white"/>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm dark:text-white text-gray-900 font-medium truncate">{u.name}</p>
                <p className="text-xs dark:text-gray-500 text-gray-400 truncate">{u.email}</p>
              </div>
              <span className="text-xs dark:text-gray-600 text-gray-400 capitalize flex-shrink-0">{u.role}</span>
            </button>
          ))}
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse dark:bg-surface-3 bg-gray-100"/>
          ))
        ) : convos.length === 0 && !search ? (
          <div className="text-center dark:text-gray-600 text-gray-400 text-xs p-6 leading-relaxed">
            Search for someone by email to start a conversation
          </div>
        ) : convos.map(convo => {
          const other = convo.other;
          const active = activeConvoId === convo.id;
          const hasUnread = dmUnreads?.has(convo.id) && !active;
          return (
            <button key={convo.id} onClick={() => onSelect(convo)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left
                ${active
                  ? 'dark:bg-brand-900/60 dark:border dark:border-brand-700/40 bg-brand-50 border border-brand-200'
                  : 'dark:hover:bg-surface-3 hover:bg-gray-50'}`}>
              <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white`}>
                  {initials(other?.name)}
                </div>
                <OnlineDot userId={other?.id} className="absolute -bottom-0.5 -right-0.5 ring-2 dark:ring-surface-1 ring-white"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium truncate ${active ? 'dark:text-brand-300 text-brand-700' : 'dark:text-white text-gray-900'}`}>
                    {other?.name}
                  </p>
                  <span className="text-xs dark:text-gray-600 text-gray-400 flex-shrink-0 ml-2">
                    {formatTime(convo.last_message?.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className={`text-xs truncate ${hasUnread ? 'dark:text-white text-gray-800 font-medium' : 'dark:text-gray-500 text-gray-400'}`}>
                    {convo.last_message
                      ? (convo.last_message.sender_id === user?.id ? 'You: ' : '') + cleanPreview(convo.last_message.content)
                      : 'No messages yet'}
                  </p>
                  {hasUnread && (
                    <span className="ml-2 flex-shrink-0 w-2 h-2 rounded-full bg-brand-500"/>
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
