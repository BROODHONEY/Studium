import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, groupsAPI } from '../services/api';

export default function ChatPanel({ group }) {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [pinnedMsgs, setPinnedMsgs] = useState([]);
  const [showPinned, setShowPinned] = useState(false);

  const bottomRef        = useRef(null);
  const joinedRoomsRef   = useRef(new Set());
  const previousGroupRef = useRef(null);

  const myRole  = group?.my_role;
  const canSend = adminsOnly ? myRole === 'admin' : true;

  // Build timeline from messages — system messages are already in the same array
  const timeline = messages.map(m => ({
    ...m,
    _kind: m.type === 'system' ? 'system' : 'message'
  }));

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

    socket.on('message_pinned', ({ messageId, content }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: true } : m));
      setPinnedMsgs(prev => prev.find(m => m.id === messageId) ? prev : [{ id: messageId, content }, ...prev]);
    });

    socket.on('message_unpinned', ({ messageId }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: false } : m));
      setPinnedMsgs(prev => prev.filter(m => m.id !== messageId));
    });

    return () => {
      socket.off('new_message');
      socket.off('system_message');
      socket.off('admins_only_changed');
      socket.off('message_deleted');
      socket.off('message_pinned');
      socket.off('message_unpinned');
    };
  }, [group?.id, socket]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length]);

  const sendMessage = () => {
    if (!text.trim() || !socket || !canSend) return;
    socket.emit('send_message', {
      groupId: group.id,
      content: text.trim(),
      type: 'text'
    });
    setText('');
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

  const handleTogglePin = async (msg) => {
    try {
      if (msg.pinned) {
        await messagesAPI.unpin(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: false } : m));
        setPinnedMsgs(prev => prev.filter(m => m.id !== msg.id));
      } else {
        await messagesAPI.pin(msg.id);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: true } : m));
        setPinnedMsgs(prev => prev.find(m => m.id === msg.id) ? prev : [{ id: msg.id, content: msg.content }, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  return (
    <div className="flex flex-col h-full bg-gray-950">

      {/* Admins only banner */}
      {adminsOnly && (
        <div className="mx-4 mt-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs text-center flex-shrink-0">
          Admins only mode is on — only admins can send messages
        </div>
      )}

      {/* Pinned messages banner */}
      {pinnedMsgs.length > 0 && (
        <div className="mx-4 mt-2 flex-shrink-0">
          <button onClick={() => setShowPinned(v => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs hover:bg-indigo-500/15 transition">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
            </svg>
            <span className="flex-1 text-left truncate">
              {pinnedMsgs[0]?.content}
            </span>
            <span className="text-indigo-400/60">{pinnedMsgs.length} pinned</span>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"
              className={`transition-transform ${showPinned ? 'rotate-180' : ''}`}>
              <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>
          </button>
          {showPinned && (
            <div className="mt-1 bg-gray-900 border border-gray-800 rounded-lg divide-y divide-gray-800 overflow-hidden">
              {pinnedMsgs.map(pm => (
                <div key={pm.id} className="px-3 py-2 text-xs text-gray-300 flex items-start gap-2">
                  <span className="flex-1 leading-relaxed">{pm.content}</span>
                  {myRole === 'admin' && (
                    <button onClick={() => handleTogglePin({ ...pm, pinned: true })}
                      className="text-gray-600 hover:text-red-400 transition flex-shrink-0 mt-0.5">✕</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
              <div key={item.id}
                className={`flex gap-2.5 items-end group/msg ${isOwn ? 'flex-row-reverse' : ''}`}>

                {/* Avatar */}
                {!isOwn && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center
                    text-xs font-semibold text-white flex-shrink-0 mb-1
                    ${avatarColor(senderName)}`}>
                    {initials(sender?.name)}
                  </div>
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
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                      ${isOwn
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
                      {item.content}
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
                          <button onClick={() => handleTogglePin(item)}
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
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center
                    text-xs font-semibold text-white flex-shrink-0 mb-1
                    ${avatarColor(user?.name)}`}>
                    {initials(user?.name)}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        {canSend ? (
          <div className="flex gap-3 items-end">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message... (Enter to send)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5
                text-sm text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                resize-none transition"
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim()}
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