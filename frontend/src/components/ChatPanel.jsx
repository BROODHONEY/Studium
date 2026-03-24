import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, groupsAPI } from '../services/api';

export default function ChatPanel({ group, onViewProfile }) {
  const { user }   = useAuth();
  const { socket, connected } = useSocket();

  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [pinnedMsgs, setPinnedMsgs] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch]   = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: { name, timer } }

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const highlightTimeoutRef = useRef(null);
  const messageRefs = useRef(new Map()); // messageId -> HTMLElement

  const [pinTimeModal, setPinTimeModal] = useState({
    open: false,
    messageId: null,
    pin_ttl_minutes: '',
    content: ''
  });

  const typingTimersRef = useRef({});

  const bottomRef        = useRef(null);
  const joinedRoomsRef   = useRef(new Set());
  const previousGroupRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef      = useRef(false);

  const myRole  = group?.my_role;
  const canSend = adminsOnly ? myRole === 'admin' : true;

  // Build timeline from messages — system messages are already in the same array
  const timeline = messages
    .map(m => ({ ...m, _kind: m.type === 'system' ? 'system' : 'message' }))
    .filter(m => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return m.content?.toLowerCase().includes(q) ||
        (m.users || m.sender)?.name?.toLowerCase().includes(q);
    });

  // Leave old room when switching groups
  useEffect(() => {
    const prevId = previousGroupRef.current;
    previousGroupRef.current = group?.id;

    return () => {
      if (prevId && socket && prevId !== group?.id) {
        socket.emit('leave_group', prevId);
        joinedRoomsRef.current.delete(prevId);
      }
    };
  }, [group?.id, socket]);

  useEffect(() => {
    if (!group || !socket) return;

    setMessages([]);
    setLoading(true);

    // Fetch message history — includes system messages from DB
    messagesAPI.list(group.id)
      .then(res => setMessages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch pinned messages
    messagesAPI.pinned(group.id)
      .then(res => setPinnedMsgs(res.data))
      .catch(console.error);

    // Fetch fresh group state for admins_only
    groupsAPI.get(group.id)
      .then(res => setAdminsOnly(res.data.admins_only || false))
      .catch(console.error);

    // Join socket room only once per group per session
    if (!joinedRoomsRef.current.has(group.id)) {
      socket.emit('join_group', group.id);
      joinedRoomsRef.current.add(group.id);
    }

    // Clear stale listeners before registering fresh ones
    socket.off('new_message');
    socket.off('system_message');
    socket.off('admins_only_changed');
    socket.off('message_deleted');
    socket.off('message_pinned');
    socket.off('message_unpinned');
    socket.off('user_typing');
    socket.off('user_stopped_typing');

    socket.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('system_message', (event) => {
      setMessages(prev => {
        if (prev.find(m => m.id === event.id)) return prev;
        return [...prev, {
          id: event.id,
          content: event.text,
          type: 'system',
          subtype: event.subtype,
          created_at: event.timestamp
        }];
      });
    });

    socket.on('admins_only_changed', ({ enabled }) => {
      setAdminsOnly(enabled);
    });

    socket.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on('message_pinned', ({ messageId, content, pin_time }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: true, pin_time } : m));
      setPinnedMsgs(prev => {
        const exists = prev.find(m => m.id === messageId);
        const next = { id: messageId, content, pin_time: pin_time ?? null };

        if (exists) {
          return prev.map(m => m.id === messageId ? { ...m, content: content ?? m.content, pin_time: pin_time ?? null } : m);
        }

        return [next, ...prev];
      });
    });

    socket.on('message_unpinned', ({ messageId }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: false, pin_time: null } : m));
      setPinnedMsgs(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on('user_typing', ({ userId, userName }) => {
      // Clear any existing auto-stop timer for this user
      if (typingTimersRef.current[userId]) clearTimeout(typingTimersRef.current[userId]);
      setTypingUsers(prev => ({ ...prev, [userId]: userName || 'Someone' }));
      // Auto-clear after 3s in case stop event is missed
      typingTimersRef.current[userId] = setTimeout(() => {
        setTypingUsers(prev => { const n = { ...prev }; delete n[userId]; return n; });
        delete typingTimersRef.current[userId];
      }, 3000);
    });

    socket.on('user_stopped_typing', ({ userId }) => {
      if (typingTimersRef.current[userId]) clearTimeout(typingTimersRef.current[userId]);
      delete typingTimersRef.current[userId];
      setTypingUsers(prev => { const n = { ...prev }; delete n[userId]; return n; });
    });

    return () => {
      socket.off('new_message');
      socket.off('system_message');
      socket.off('admins_only_changed');
      socket.off('message_deleted');
      socket.off('message_pinned');
      socket.off('message_unpinned');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [group?.id, socket]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length]);

  const scrollToMessage = (messageId) => {
    if (!messageId) return;

    const attempt = (remainingAttempts) => {
      const el = messageRefs.current.get(messageId) || document.getElementById(`message-${messageId}`);
      if (!el) {
        if (remainingAttempts > 0) setTimeout(() => attempt(remainingAttempts - 1), 250);
        return;
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => setHighlightedMessageId(null), 1800);
    };

    attempt(2);
  };

  const sendMessage = () => {
    if (!text.trim() || !socket || !connected || !canSend) return;
    socket.emit('send_message', {
      groupId: group.id,
      content: text.trim(),
      type: 'text'
    });
    setText('');
    // Stop typing indicator
    clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    socket.emit('typing_stop', { groupId: group.id });
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteMessage = async (messageId) => {
    setConfirmDeleteId(null);
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await messagesAPI.delete(messageId);
    } catch {
      messagesAPI.list(group.id).then(res => setMessages(res.data)).catch(console.error);
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      await messagesAPI.unpin(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: false, pin_time: null } : m));
      setPinnedMsgs(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePinWithTime = async (messageId, pinTtlMinutes, content) => {
    try {
      const ttlNum = pinTtlMinutes === '' ? null : Number(pinTtlMinutes);
      const resp = await messagesAPI.pin(messageId, { pin_ttl_minutes: ttlNum });
      const serverPinTime = resp?.data?.pin_time ?? null;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: true, pin_time: serverPinTime } : m));
      setPinnedMsgs(prev => {
        const exists = prev.find(m => m.id === messageId);
        const next = { id: messageId, content, pin_time: serverPinTime };
        if (exists) {
          return prev.map(m => m.id === messageId ? { ...m, content: content ?? m.content, pin_time: serverPinTime } : m);
        }
        return [next, ...prev];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getPinExpiry = (pinTime) => {
    if (!pinTime) return null;
    const d = new Date(pinTime);
    return isNaN(d.getTime()) ? null : d;
  };

  const getRemainingMinutes = (pinTime) => {
    const d = getPinExpiry(pinTime);
    if (!d) return null;
    const diffMs = d.getTime() - Date.now();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / 60000);
  };

  const formatPinLabel = (pinTime) => {
    const remaining = getRemainingMinutes(pinTime);
    if (remaining === null) return null;
    if (remaining === 0) return 'Auto-unpin now';
    if (remaining < 60) return `Auto-unpin in ${remaining}m`;
    const hours = Math.ceil(remaining / 60);
    return `Auto-unpin in ${hours}h`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!socket || !group || !connected) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing_start', { groupId: group.id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing_stop', { groupId: group.id });
    }, 2000);
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const initials = (name) =>
    name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const avatarColors = [
    'bg-indigo-600', 'bg-teal-600', 'bg-purple-600',
    'bg-pink-600',   'bg-amber-600', 'bg-green-600'
  ];
  const avatarColor = (name) =>
    avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  if (!group) return (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <p className="text-gray-600 text-sm">Select a group to start chatting</p>
    </div>
  );

  // ── Inline file preview helper ──────────────────────
  const FilePreview = ({ file }) => {
    if (!file) return null;
    const isImage = file.file_type?.startsWith('image/');
    const isPdf   = file.file_type === 'application/pdf';
    const sizeStr = file.size_bytes
      ? file.size_bytes < 1024 * 1024
        ? `${(file.size_bytes / 1024).toFixed(1)} KB`
        : `${(file.size_bytes / (1024 * 1024)).toFixed(1)} MB`
      : '';

    if (isImage) {
      return (
        <a href={file.file_url} target="_blank" rel="noreferrer" className="block mt-1.5">
          <img src={file.file_url} alt={file.filename}
            className="max-w-xs rounded-xl border border-gray-700 hover:opacity-90 transition cursor-pointer"
            style={{ maxHeight: 200, objectFit: 'cover' }}/>
        </a>
      );
    }
    return (
      <a href={file.file_url} target="_blank" rel="noreferrer"
        className="mt-1.5 flex items-center gap-2.5 px-3 py-2.5 bg-gray-700/50 border border-gray-600/50 rounded-xl hover:bg-gray-700 transition max-w-xs">
        <span className="text-xl flex-shrink-0">{isPdf ? '📄' : '📎'}</span>
        <div className="min-w-0">
          <p className="text-xs text-white font-medium truncate">{file.filename}</p>
          {sizeStr && <p className="text-xs text-gray-400 mt-0.5">{sizeStr}</p>}
        </div>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="#6b7280" className="flex-shrink-0 ml-auto">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
      </a>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">

      {/* Pin time modal (teacher only) */}
      {pinTimeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm mx-4 p-4">
            <div className="text-sm text-white font-semibold">Pin message</div>
            <div className="text-xs text-gray-400 mt-1">
              Choose how long before the pin disappears.
            </div>

            <div className="mt-3">
              <input
                type="number"
                min="0"
                step="1"
                value={pinTimeModal.pin_ttl_minutes}
                onChange={(e) => setPinTimeModal(s => ({ ...s, pin_ttl_minutes: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Minutes"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' })}
                className="text-xs px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition text-gray-300 border border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const { messageId, pin_ttl_minutes, content } = pinTimeModal;
                  setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' });
                  await handlePinWithTime(messageId, pin_ttl_minutes, content);
                  scrollToMessage(messageId);
                }}
                className="text-xs px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition text-white font-medium"
                disabled={!pinTimeModal.messageId}
              >
                Pin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admins only banner */}
      {adminsOnly && (
        <div className="mx-4 mt-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs text-center flex-shrink-0">
          Admins only mode is on — only admins can send messages
        </div>
      )}

      {/* Connection status */}
      {socket && !connected && (
        <div className="mx-4 mt-2 px-4 py-2 bg-gray-800/60 border border-gray-700/60 rounded-lg text-gray-300 text-xs text-center flex-shrink-0">
          Reconnecting... messages may be delayed
        </div>
      )}

      {/* Pinned messages banner */}
      {pinnedMsgs.length > 0 && (
        <div className="mx-4 mt-2 flex-shrink-0">
          <div
            role="button"
            tabIndex={0}
            onClick={() => scrollToMessage(pinnedMsgs[0]?.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') scrollToMessage(pinnedMsgs[0]?.id);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-gray-900/60 border border-gray-800/70 rounded-lg text-indigo-300 text-xs hover:bg-gray-900/80 transition cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
            </svg>
            <span className="flex-1 min-w-0 text-left">
              <span className="block truncate">
                {pinnedMsgs[0]?.content}
              </span>
              {pinnedMsgs[0]?.pin_time && (
                <span className="block text-[11px] text-gray-400 mt-0.5">
                  {formatPinLabel(pinnedMsgs[0]?.pin_time)}
                </span>
              )}
            </span>
            <span className="text-indigo-400/60 flex-shrink-0">{pinnedMsgs.length} pinned</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPinned(v => !v); }}
              className="p-1 rounded hover:bg-gray-800/60 transition flex-shrink-0"
              title={showPinned ? 'Hide pinned' : 'Show pinned'}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"
                className={`transition-transform ${showPinned ? 'rotate-180' : ''}`}>
                <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
              </svg>
            </button>
          </div>
          {showPinned && (
            <div className="mt-1 bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800 overflow-hidden">
              {pinnedMsgs.map(pm => (
                <div
                  key={pm.id}
                  className="px-3 py-2 text-xs text-gray-300 flex items-start gap-2 hover:bg-gray-800/20 transition cursor-pointer"
                  onClick={() => scrollToMessage(pm.id)}
                >
                  <span className="flex-1 min-w-0 leading-relaxed">
                    <span className="block truncate">{pm.content}</span>
                    {pm.pin_time && (
                      <span className="block text-[11px] text-gray-500 mt-0.5">
                        {formatPinLabel(pm.pin_time)}
                      </span>
                    )}
                  </span>
                  {myRole === 'admin' && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          const remaining = getRemainingMinutes(pm.pin_time);
                          setPinTimeModal({
                            open: true,
                            messageId: pm.id,
                            pin_ttl_minutes: remaining === null ? '' : String(remaining),
                            content: pm.content
                          });
                        }}
                        className="text-gray-300 hover:text-white transition text-[11px] px-2 py-1 rounded bg-gray-800/50 border border-gray-700"
                        title="Set expiry duration"
                      >
                        Set
                      </button>
                      <button
                        onClick={() => handleUnpinMessage(pm.id)}
                        className="text-gray-600 hover:text-red-400 transition flex-shrink-0 mt-0.5"
                        title="Unpin"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className="mx-4 mt-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="#6b7280">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="text-gray-600 hover:text-gray-400 transition text-xs">✕</button>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="text-gray-600 hover:text-gray-400 transition text-xs ml-1">Close</button>
          </div>
          {searchQuery && (
            <p className="text-xs text-gray-600 mt-1 px-1">
              {timeline.filter(m => m._kind !== 'system').length} result{timeline.filter(m => m._kind !== 'system').length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-gray-800 animate-pulse flex-shrink-0"/>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-800 rounded animate-pulse w-20"/>
                  <div className="h-10 bg-gray-800 rounded-xl animate-pulse w-48"/>
                </div>
              </div>
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          timeline.map(item => {

            // ── System message ──────────────────────────────
            if (item._kind === 'system') {
              return (
                <div key={item.id} className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gray-800"/>
                  <span className={`text-xs px-3 py-1 rounded-full flex-shrink-0 select-none
                    ${item.subtype === 'kick'
                      ? 'text-red-400/70 bg-red-500/5 border border-red-500/10'
                      : item.subtype === 'leave'
                      ? 'text-orange-400/70 bg-orange-500/5 border border-orange-500/10'
                      : 'text-gray-600 bg-gray-800/50 border border-gray-700/30'}`}>
                    {item.content}
                  </span>
                  <div className="flex-1 h-px bg-gray-800"/>
                </div>
              );
            }

            // ── Regular message ─────────────────────────────
            const sender  = item.users || item.sender;
            const isOwn   = sender?.id === user?.id;
            const roll    = sender?.roll_no;
            const rollSuffix = roll ? ` · ${String(roll).slice(-3)}` : '';
            const senderName = sender?.name
              ? `${sender.name}${sender.role === 'student' ? rollSuffix : ''}`
              : 'Unknown';
            const canDelete = isOwn || myRole === 'admin';

            return (
              <div
                key={item.id}
                id={`message-${item.id}`}
                ref={(el) => {
                  if (el) messageRefs.current.set(item.id, el);
                  else messageRefs.current.delete(item.id);
                }}
                className={`flex gap-2.5 items-end group/msg ${isOwn ? 'flex-row-reverse' : ''}`}
              >

                {/* Avatar */}
                {!isOwn && (
                  <button
                    onClick={() => onViewProfile?.(sender?.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center
                      text-xs font-semibold text-white flex-shrink-0 mb-1
                      ${avatarColor(senderName)} hover:ring-2 hover:ring-white/20 transition`}>
                    {initials(sender?.name)}
                  </button>
                )}

                {/* Bubble group */}
                <div className={`flex flex-col max-w-xs lg:max-w-md xl:max-w-lg
                  ${isOwn ? 'items-end' : 'items-start'}`}>

                  {/* Sender name — only for others */}
                  {!isOwn && (
                    <span className="text-xs text-gray-500 mb-1 px-1">
                      {senderName}
                    </span>
                  )}

                  {/* Bubble + delete button */}
                  <div className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed break-words
                      ${isOwn
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm'}
                      ${highlightedMessageId === item.id ? 'ring-2 ring-indigo-400/70 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]' : ''}`}>
                      {item.content}
                      {item.files && <FilePreview file={item.files} />}
                    </div>
                    {canDelete && confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1 mb-1 flex-shrink-0">
                        <button onClick={() => handleDeleteMessage(item.id)}
                          className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition">
                          Delete
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition mb-1 flex-shrink-0`}>
                        {myRole === 'admin' && (
                          <button
                            onClick={() => {
                              if (item.pinned) return handleUnpinMessage(item.id);
                              setPinTimeModal({
                                open: true,
                                messageId: item.id,
                                pin_ttl_minutes: '10',
                                content: item.content
                              });
                            }}
                            className={`p-1 rounded transition ${item.pinned ? 'text-indigo-400' : 'text-gray-600 hover:text-indigo-400'}`}
                            title={item.pinned ? 'Unpin' : 'Pin'}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1 rounded text-gray-600 hover:text-red-400 transition">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66H14.5a.5.5 0 0 0 0-1h-.996a.59.59 0 0 0-.01 0zM3.04 3.5h9.92l-.845 10.56a1 1 0 0 1-.997.94h-6.23a1 1 0 0 1-.997-.94z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-gray-600 mt-1 px-1">
                    {formatTime(item.created_at)}
                  </span>
                </div>

                {/* Own avatar on the right */}
                {isOwn && (
                  <button
                    onClick={() => onViewProfile?.(user?.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center
                      text-xs font-semibold text-white flex-shrink-0 mb-1
                      ${avatarColor(user?.name)} hover:ring-2 hover:ring-white/20 transition`}>
                    {initials(user?.name)}
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Typing indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="px-5 pb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
            </div>
            <span className="text-xs text-gray-500">
              {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing
            </span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        {canSend ? (
          <div className="flex gap-2 items-end">
            <button onClick={() => { setShowSearch(v => !v); setSearchQuery(''); }}
              className={`p-2.5 rounded-xl transition flex-shrink-0 ${showSearch ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
              title="Search messages">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
              </svg>
            </button>
            <textarea
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={connected ? 'Type a message... (Enter to send)' : 'Disconnected... reconnecting'}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5
                text-sm text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                resize-none transition"
              disabled={!connected}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || !connected}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40
                disabled:cursor-not-allowed text-white px-5 py-2.5
                rounded-xl text-sm font-medium transition">
              Send
            </button>
          </div>
        ) : (
          <div className="text-center py-2.5 text-gray-600 text-sm">
            Only admins can send messages in this group right now
          </div>
        )}
      </div>
    </div>
  );
}