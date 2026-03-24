import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { dmAPI } from '../services/api';
import OnlineDot from './OnlineDot';

const initials = (name) =>
  name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const COLORS = [
  'bg-indigo-600','bg-teal-600','bg-purple-600',
  'bg-pink-600','bg-amber-600','bg-green-600'
];
const avatarColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

export default function DMPanel({ conversation, onNewMessage, onViewProfile }) {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [isTyping, setIsTyping]   = useState(false);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  const other = conversation?.other;

  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Reset state when conversation changes
    setMessages([]);
    setLoading(true);

    // Load messages
    dmAPI.getMessages(conversation.id)
      .then(res => setMessages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conversation?.id, conversation]);

  useEffect(() => {
    if (!socket || !conversation) return;

    const handleNewDM = ({ conversationId, message }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => {
        // Replace optimistic message with real one, or add if not found
        const existingIndex = prev.findIndex(m => m.id === message.id || (m.id.startsWith('temp-') && m.content === message.content && m.sender.id === message.sender.id));
        if (existingIndex >= 0) {
          // Replace the optimistic message
          const newMessages = [...prev];
          newMessages[existingIndex] = message;
          return newMessages;
        } else {
          // Add new message
          return [...prev, message];
        }
      });
      onNewMessage?.(conversationId, message);
    };

    const handleTyping = ({ conversationId, userId }) => {
      if (conversationId === conversation.id && userId === other?.id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId === conversation.id && userId === other?.id) {
        setIsTyping(false);
      }
    };

    socket.on('new_dm', handleNewDM);
    socket.on('dm_user_typing', handleTyping);
    socket.on('dm_user_stopped_typing', handleStopTyping);

    return () => {
      socket.off('new_dm', handleNewDM);
      socket.off('dm_user_typing', handleTyping);
      socket.off('dm_user_stopped_typing', handleStopTyping);
    };
  }, [conversation?.id, socket, other?.id, onNewMessage, conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;

    const messageContent = text.trim();

    // Optimistically add the message to local state
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      content: messageContent,
      created_at: new Date().toISOString(),
      read: false,
      sender: {
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url
      }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setText('');

    // Stop typing indicator
    socket.emit('dm_typing_stop', {
      conversationId: conversation.id,
      otherId: other?.id
    });

    // Send via socket
    socket.emit('send_dm', {
      conversationId: conversation.id,
      content: messageContent
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket) return;

    socket.emit('dm_typing_start', {
      conversationId: conversation.id,
      otherId: other?.id
    });

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('dm_typing_stop', {
        conversationId: conversation.id,
        otherId: other?.id
      });
    }, 1500);
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!conversation) return (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <p className="text-gray-600 text-sm">Select a conversation</p>
        <p className="text-gray-700 text-xs mt-1">or search for someone to message</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-950">

      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => onViewProfile?.(other?.id)} className="relative flex-shrink-0">
          <div className={`w-8 h-8 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white hover:ring-2 hover:ring-white/20 transition`}>
            {initials(other?.name)}
          </div>
          <OnlineDot userId={other?.id} className="absolute -bottom-0.5 -right-0.5 ring-2 ring-gray-950"/>
        </button>
        <button onClick={() => onViewProfile?.(other?.id)} className="text-left">
          <p className="text-sm font-semibold text-white hover:text-indigo-300 transition">{other?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{other?.role}</p>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-800 animate-pulse"/>
                <div className="h-10 bg-gray-800 rounded-xl animate-pulse w-40"/>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-14 h-14 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xl font-semibold text-white mb-3`}>
              {initials(other?.name)}
            </div>
            <p className="text-white text-sm font-medium">{other?.name}</p>
            <p className="text-gray-600 text-xs mt-1">Start of your conversation</p>
          </div>
        ) : (
          <>
            {messages.map(msg => {
              const isOwn = msg.sender?.id === user?.id;
              return (
                <div key={msg.id}
                  className={`flex gap-2.5 items-end ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {!isOwn && (
                    <button onClick={() => onViewProfile?.(other?.id)}
                      className={`w-7 h-7 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mb-1 hover:ring-2 hover:ring-white/20 transition`}>
                      {initials(other?.name)}
                    </button>
                  )}
                  <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                      ${isOwn
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-600 mt-1 px-1">
                      {formatTime(msg.created_at)}
                      {isOwn && (
                        <span className="ml-1">
                          {msg.read ? '· seen' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  {isOwn && (
                    <button onClick={() => onViewProfile?.(user?.id)}
                      className={`w-7 h-7 rounded-full ${avatarColor(user?.name)} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mb-1 hover:ring-2 hover:ring-white/20 transition`}>
                      {initials(user?.name)}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5 items-end">
                <div className={`w-7 h-7 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                  {initials(other?.name)}
                </div>
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Message ${other?.name}...`}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
          />
          <button onClick={sendMessage} disabled={!text.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}