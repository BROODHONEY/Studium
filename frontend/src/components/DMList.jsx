import { useState, useEffect } from 'react';
import { dmAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import OnlineDot from './OnlineDot';

const initials = (name) =>
  name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const COLORS = [
  'bg-indigo-600','bg-teal-600','bg-purple-600',
  'bg-pink-600','bg-amber-600','bg-green-600'
];
const avatarColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

export default function DMList({ activeConvoId, onSelect, onNewDM }) {
  const { user } = useAuth();
  const [convos, setConvos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    dmAPI.getConversations()
      .then(res => setConvos(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Search by email with debounce
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await dmAPI.search(search);
        setResults(res.data);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleStartConvo = async (targetUser) => {
    try {
      const res = await dmAPI.startConversation(targetUser.id);
      const convo = res.data;
      // Add to list if not already there
      setConvos(prev => {
        if (prev.find(c => c.id === convo.id)) return prev;
        return [{ ...convo, other: targetUser, unread_count: 0 }, ...prev];
      });
      setSearch('');
      setResults([]);
      onSelect({ ...convo, other: targetUser });
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full">

      {/* Search bar */}
      <div className="p-3 border-b border-gray-800">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Search results */}
      {search.trim() && (
        <div className="border-b border-gray-800">
          {searching ? (
            <div className="px-4 py-3 text-xs text-gray-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500">No users found</div>
          ) : (
            results.map(u => (
              <button key={u.id} onClick={() => handleStartConvo(u)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 transition text-left">
                <div className="relative flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${avatarColor(u.name)} flex items-center justify-center text-xs font-semibold text-white`}>
                    {initials(u.name)}
                  </div>
                  <OnlineDot userId={u.id} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-gray-950"/>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-gray-600 capitalize ml-auto flex-shrink-0">
                  {u.role}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse"/>
            ))}
          </div>
        ) : convos.length === 0 && !search ? (
          <div className="text-center text-gray-600 text-xs p-6 leading-relaxed">
            Search for someone by email to start a conversation
          </div>
        ) : (
          convos.map(convo => {
            const other = convo.other;
            const isActive = activeConvoId === convo.id;
            return (
              <button key={convo.id} onClick={() => onSelect(convo)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition text-left
                  ${isActive ? 'bg-gray-800' : 'hover:bg-gray-900'}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white`}>
                    {initials(other?.name)}
                  </div>
                  <OnlineDot userId={other?.id} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-gray-950"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">{other?.name}</p>
                    <span className="text-xs text-gray-600 flex-shrink-0 ml-2">
                      {formatTime(convo.last_message?.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      {convo.last_message
                        ? (convo.last_message.sender_id === user?.id ? 'You: ' : '')
                          + convo.last_message.content
                        : 'No messages yet'}
                    </p>
                    {convo.unread_count > 0 && (
                      <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                        {convo.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}