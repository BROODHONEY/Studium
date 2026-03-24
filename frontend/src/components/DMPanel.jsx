import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { dmAPI } from '../services/api';
import OnlineDot from './OnlineDot';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

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

  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [isTyping, setIsTyping]     = useState(false);

  // Edit & react state
  const [editingId, setEditingId]         = useState(null);
  const [editText, setEditText]           = useState('');
  const [emojiPickerId, setEmojiPickerId] = useState(null);

  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  const other = conversation?.other;

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiPickerId) return;
    const handler = () => setEmojiPickerId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [emojiPickerId]);

  useEffect(() => {
    if (!conversation) { setMessages([]); setLoading(false); return; }
    setMessages([]);
    setLoading(true);
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
        const idx = prev.findIndex(m =>
          m.id === message.id ||
          (m.id.startsWith?.('temp-') && m.content === message.content && m.sender?.id === message.sender?.id)
        );
        if (idx >= 0) { const n = [...prev]; n[idx] = message; return n; }
        return [...prev, message];
      });
      onNewMessage?.(conversationId, message);
    };

    const handleEdited = ({ conversationId, messageId, content }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, edited: true } : m));
    };

    const handleReaction = ({ conversationId, messageId, reactions }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, dm_reactions: reactions } : m));
    };

    const handleTyping = ({ conversationId, userId }) => {
      if (conversationId === conversation.id && userId === other?.id) setIsTyping(true);
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId === conversation.id && userId === other?.id) setIsTyping(false);
    };

    socket.on('new_dm', handleNewDM);
    socket.on('dm_message_edited', handleEdited);
    socket.on('dm_message_reaction', handleReaction);
    socket.on('dm_user_typing', handleTyping);
    socket.on('dm_user_stopped_typing', handleStopTyping);

    return () => {
      socket.off('new_dm', handleNewDM);
      socket.off('dm_message_edited', handleEdited);
      socket.off('dm_message_reaction', handleReaction);
      socket.off('dm_user_typing', handleTyping);
      socket.off('dm_user_stopped_typing', handleStopTyping);
    };
  }, [conversation?.id, socket, other?.id, onNewMessage, conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;
    const optimistic = {
      id: `temp-${Date.now()}`,
      content: text.trim(),
      created_at: new Date().toISOString(),
      read: false,
      sender: { id: user.id, name: user.name, avatar_url: user.avatar_url }
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');
    socket.emit('dm_typing_stop', { conversationId: conversation.id, otherId: other?.id });
    socket.emit('send_dm', { conversationId: conversation.id, content: optimistic.content });
  };

  const handleEditSave = async (msgId) => {
    if (!editText.trim()) return;
    const newContent = editText.trim();
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: newContent, edited: true } : m));
    setEditingId(null);
    setEditText('');
    try { await dmAPI.editMessage(msgId, newContent); }
    catch (err) {
      console.error(err);
      // Revert on failure
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: m.content } : m));
    }
  };

  const handleReact = async (msgId, emoji) => {
    setEmojiPickerId(null);
    try { await dmAPI.reactMessage(msgId, emoji); }
    catch (err) { console.error(err); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTypingInput = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit('dm_typing_start', { conversationId: conversation.id, otherId: other?.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('dm_typing_stop', { conversationId: conversation.id, otherId: other?.id });
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
              const isTemp = msg.id?.startsWith?.('temp-');

              // Build reaction map
              const reactionMap = {};
              (msg.dm_reactions || []).forEach(r => {
                if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
                reactionMap[r.emoji].push(r.user_id);
              });

              return (
                <div key={msg.id}
                  className={`flex gap-2.5 items-end group/msg ${isOwn ? 'flex-row-reverse' : ''}`}>

                  {/* Other avatar */}
                  {!isOwn && (
                    <button onClick={() => onViewProfile?.(other?.id)}
                      className={`w-7 h-7 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mb-1 hover:ring-2 hover:ring-white/20 transition`}>
                      {initials(other?.name)}
                    </button>
                  )}

                  <div className={`flex flex-col max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>

                    {/* Bubble + actions row */}
                    <div className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>

                      {/* Edit mode */}
                      {editingId === msg.id ? (
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                          <textarea
                            autoFocus
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(msg.id); }
                              if (e.key === 'Escape') { setEditingId(null); setEditText(''); }
                            }}
                            rows={2}
                            className="bg-gray-700 border border-indigo-500 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none"
                          />
                          <div className="flex gap-1.5">
                            <button onClick={() => handleEditSave(msg.id)}
                              className="text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition">
                              Save
                            </button>
                            <button onClick={() => { setEditingId(null); setEditText(''); }}
                              className="text-xs px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                          ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
                          {msg.content}
                          {msg.edited && <span className="text-xs opacity-50 ml-1.5">(edited)</span>}
                        </div>
                      )}

                      {/* Hover actions */}
                      {!isTemp && editingId !== msg.id && (
                        <div className={`relative flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition mb-1 flex-shrink-0`}>
                          {/* React */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setEmojiPickerId(emojiPickerId === msg.id ? null : msg.id); }}
                            className="p-1 rounded text-gray-600 hover:text-yellow-400 transition"
                            title="React">
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                              <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/>
                            </svg>
                          </button>

                          {/* Emoji picker */}
                          {emojiPickerId === msg.id && (
                            <div onClick={e => e.stopPropagation()}
                              className={`absolute bottom-8 z-20 flex gap-1 bg-gray-900 border border-gray-700 rounded-xl px-2 py-1.5 shadow-xl ${isOwn ? 'right-0' : 'left-0'}`}>
                              {EMOJI_OPTIONS.map(e => (
                                <button key={e} onClick={() => handleReact(msg.id, e)}
                                  className="text-base hover:scale-125 transition-transform leading-none p-0.5">
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Edit (own only) */}
                          {isOwn && (
                            <button onClick={() => { setEditingId(msg.id); setEditText(msg.content); }}
                              className="p-1 rounded text-gray-600 hover:text-blue-400 transition"
                              title="Edit">
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {Object.keys(reactionMap).length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : ''}`}>
                        {Object.entries(reactionMap).map(([emoji, userIds]) => (
                          <button key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition
                              ${userIds.includes(user?.id)
                                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                            <span>{emoji}</span>
                            <span>{userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-xs text-gray-600 mt-1 px-1">
                      {formatTime(msg.created_at)}
                      {isOwn && msg.read && <span className="ml-1">· seen</span>}
                    </span>
                  </div>

                  {/* Own avatar */}
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
            onChange={handleTypingInput}
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
