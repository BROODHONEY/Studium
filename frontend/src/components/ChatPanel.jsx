import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, groupsAPI } from '../services/api';

export default function ChatPanel({ group }) {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [adminsOnly, setAdminsOnly] = useState(group?.admins_only || false);
  const bottomRef = useRef(null);

  const myRole = group?.my_role;
  const canSend = adminsOnly ? myRole === 'admin' : true;

  useEffect(() => {
    if (!group) return;
    setMessages([]);
    setLoading(true);

    // Fetch fresh group state so admins_only is always accurate
    messagesAPI.list(group.id)
        .then(res => setMessages(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));

    groupsAPI.get(group.id)
        .then(res => setAdminsOnly(res.data.admins_only || false))
        .catch(console.error);

    if (socket) {
        socket.emit('join_group', group.id);
        socket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
        });
        socket.on('admins_only_changed', ({ enabled }) => {
        setAdminsOnly(enabled);
        });
    }

    return () => {
        socket?.emit('leave_group', group.id);
        socket?.off('new_message');
        socket?.off('admins_only_changed');
    };
    }, [group?.id, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !socket || !canSend) return;
    socket.emit('send_message', {
      groupId: group.id,
      content: text.trim(),
      type: 'text'
    });
    setText('');
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

  if (!group) return (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <p className="text-gray-600 text-sm">Select a group to start chatting</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-950">

      {/* Admins only banner */}
      {adminsOnly && (
        <div className="mx-4 mt-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs text-center">
          Admins only mode is on — only admins can send messages
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-800 animate-pulse flex-shrink-0"/>
                <div className="h-12 bg-gray-800 rounded-lg animate-pulse w-48"/>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender?.id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>

                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mt-1">
                  {initials(msg.sender?.name)}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-500 mb-1 px-1">
                    {isOwn ? 'You' : msg.sender?.name}
                  </span>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isOwn
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-gray-800 text-gray-100 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-600 mt-1 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        {canSend ? (
          <div className="flex gap-3 items-end">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message... (Enter to send)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
            />
            <button onClick={sendMessage} disabled={!text.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
              Send
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-gray-600 text-sm">
            Only admins can send messages in this group right now
          </div>
        )}
      </div>
    </div>
  );
}