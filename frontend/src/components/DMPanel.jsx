import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { dmAPI } from '../services/api';
import OnlineDot from './OnlineDot';
import MessageMenu from './ui/MessageMenu';
import MessageContent from './ui/MessageContent';
import FormatToolbar from './ui/FormatToolbar';
import { formatTime, getDateLabel } from '../utils/time';

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

  // Edit, react & reply state
  const [editingId, setEditingId]         = useState(null);
  const [editText, setEditText]           = useState('');
  const [openMenuId, setOpenMenuId]       = useState(null);
  const [menuRect, setMenuRect]           = useState(null);
  const [replyTo, setReplyTo]             = useState(null); // { id, content, senderName }
  const [searchQuery, setSearchQuery]     = useState('');
  const [showSearch, setShowSearch]       = useState(false);

  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);
  const typingTimer  = useRef(null);
  const messageRefs  = useRef({});

  const other = conversation?.other;

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

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

    const handleDeleted = ({ conversationId, messageId }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => prev.filter(m => m.id !== messageId));
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
    socket.on('dm_message_deleted', handleDeleted);
    socket.on('dm_user_typing', handleTyping);
    socket.on('dm_user_stopped_typing', handleStopTyping);

    return () => {
      socket.off('new_dm', handleNewDM);
      socket.off('dm_message_edited', handleEdited);
      socket.off('dm_message_reaction', handleReaction);
      socket.off('dm_message_deleted', handleDeleted);
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
      sender: { id: user.id, name: user.name, avatar_url: user.avatar_url },
      replied_message: replyTo ? { id: replyTo.id, content: replyTo.content, sender: { name: replyTo.senderName } } : null
    };
    setMessages(prev => [...prev, optimistic]);
    socket.emit('dm_typing_stop', { conversationId: conversation.id, otherId: other?.id });
    socket.emit('send_dm', { conversationId: conversation.id, content: optimistic.content, replyTo: replyTo?.id || null });
    setText('');
    setReplyTo(null);
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
    setOpenMenuId(null);
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

  // formatTime imported from utils/time

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (!conversation) return (
    <div className="flex-1 flex items-center justify-center dark:bg-surface bg-gray-50">
      <div className="text-center">
        <p className="dark:text-gray-600 text-gray-400 text-sm">Select a conversation</p>
        <p className="dark:text-gray-700 text-gray-300 text-xs mt-1">or search for someone to message</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full dark:bg-surface bg-gray-50">

      {/* Header */}
      <div className="px-5 py-3 border-b dark:border-brand-900/40 border-gray-200 flex items-center gap-3 flex-shrink-0 dark:bg-surface-1 bg-white">
        <button onClick={() => onViewProfile?.(other?.id)} className="relative flex-shrink-0">
          <div className={`w-8 h-8 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white dark:hover:ring-2 dark:hover:ring-white/20 hover:ring-2 hover:ring-gray-300 transition`}>
            {initials(other?.name)}
          </div>
          <OnlineDot userId={other?.id} className="absolute -bottom-0.5 -right-0.5 ring-2 dark:ring-surface ring-white"/>
        </button>
        <button onClick={() => onViewProfile?.(other?.id)} className="text-left">
          <p className="text-sm font-semibold dark:text-white text-gray-900 dark:hover:text-brand-300 hover:text-brand-600 transition">{other?.name}</p>
          <p className="text-xs dark:text-gray-500 text-gray-500 capitalize">{other?.role}</p>
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="mx-4 mt-2 flex-shrink-0">
          <div className="flex items-center gap-2 dark:bg-surface-2 bg-white dark:border-surface-3 border-gray-200 border rounded-lg px-3 py-2">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="#6b7280">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-sm dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="dark:text-gray-600 text-gray-400 dark:hover:text-gray-400 hover:text-gray-600 transition text-xs">✕</button>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}
              className="dark:text-gray-600 text-gray-400 dark:hover:text-gray-400 hover:text-gray-600 transition text-xs ml-1">Close</button>
          </div>
          {searchQuery && (
            <p className="text-xs dark:text-gray-600 text-gray-400 mt-1 px-1">
              {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full dark:bg-surface-3 bg-gray-200 animate-pulse"/>
                <div className="h-10 dark:bg-surface-3 bg-gray-200 rounded-xl animate-pulse w-40"/>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-14 h-14 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xl font-semibold text-white mb-3`}>
              {initials(other?.name)}
            </div>
            <p className="dark:text-white text-gray-900 text-sm font-medium">{other?.name}</p>
            <p className="dark:text-gray-600 text-gray-400 text-xs mt-1">Start of your conversation</p>
          </div>
        ) : (
          <>
            {filteredMessages.flatMap((msg, i) => {
              const label = msg.created_at ? getDateLabel(msg.created_at) : null;
              const prevLabel = i > 0 && messages[i-1].created_at ? getDateLabel(messages[i-1].created_at) : null;
              const showSep = label && label !== prevLabel;

              const isOwn = msg.sender?.id === user?.id;
              const isTemp = msg.id?.startsWith?.('temp-');

              // Build reaction map
              const reactionMap = {};
              (msg.dm_reactions || []).forEach(r => {
                if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
                reactionMap[r.emoji].push(r.user_id);
              });

              const els = [];
              if (showSep) els.push(
                <div key={`sep-${msg.id}`} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px dark:bg-surface-3 bg-gray-200"/>
                  <span className="text-xs dark:text-gray-500 text-gray-400 dark:bg-surface-1 bg-white px-3 py-1 rounded-full dark:border-surface-3/40 border-gray-200 border select-none flex-shrink-0">
                    {label}
                  </span>
                  <div className="flex-1 h-px dark:bg-surface-3 bg-gray-200"/>
                </div>
              );
              els.push(
                <div key={msg.id}
                  ref={el => { if (el) messageRefs.current[msg.id] = el; }}
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
                            className="dark:bg-surface-3 bg-gray-100 border border-brand-500 rounded-xl px-3 py-2 text-sm dark:text-white text-gray-900 resize-none focus:outline-none"
                          />
                          <div className="flex gap-1.5">
                            <button onClick={() => handleEditSave(msg.id)}
                              className="text-xs px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition">
                              Save
                            </button>
                            <button onClick={() => { setEditingId(null); setEditText(''); }}
                              className="text-xs px-3 py-1 rounded-lg dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-300 text-gray-700 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                          ${isOwn
                            ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm'
                            : 'dark:bg-surface-3 bg-gray-100 dark:text-gray-100 text-gray-900 rounded-bl-sm'}`}>
                          {msg.replied_message && (
                            <button
                              onClick={() => {
                                const el = messageRefs.current[msg.replied_message.id];
                                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              className={`block w-full text-left mb-2 pl-2 border-l-2 ${isOwn ? 'border-white/40' : 'border-brand-400'} opacity-70 hover:opacity-100 transition`}>
                              <span className={`text-xs font-semibold block ${isOwn ? 'text-white/80' : 'text-brand-300'}`}>
                                {msg.replied_message.sender?.name}
                              </span>
                              <span className="text-xs truncate block max-w-[200px]">
                                {msg.replied_message.content}
                              </span>
                            </button>
                          )}
                          <MessageContent content={msg.content} isOwn={isOwn} />
                          {msg.edited && <span className="text-xs opacity-50 ml-1.5">(edited)</span>}
                        </div>
                      )}

                      {/* Three-dot menu */}
                      {!isTemp && editingId !== msg.id && (
                        <div className="relative opacity-0 group-hover/msg:opacity-100 transition mb-1 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMenuRect(r); setOpenMenuId(openMenuId === msg.id ? null : msg.id); }}
                            className="p-1.5 rounded-lg dark:text-gray-600 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 dark:hover:bg-surface-3 hover:bg-gray-200 transition"
                            title="Message actions">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                            </svg>
                          </button>
                          {openMenuId === msg.id && menuRect && (
                            <MessageMenu
                              anchorRect={menuRect}
                              isOwn={isOwn}
                              onClose={() => setOpenMenuId(null)}
                              onReact={(e) => handleReact(msg.id, e)}
                              onReply={() => setReplyTo({ id: msg.id, content: msg.content, senderName: msg.sender?.name })}
                              onEdit={isOwn ? () => { setEditingId(msg.id); setEditText(msg.content); } : undefined}
                              onDelete={() => { setMessages(prev => prev.filter(m => m.id !== msg.id)); dmAPI.deleteMessage(msg.id).catch(console.error); }}
                            />
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
                                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                                : 'dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-200 dark:text-gray-400 text-gray-600 dark:hover:border-surface-4 hover:border-gray-300'}`}>
                            <span>{emoji}</span>
                            <span>{userIds.length}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <span className="text-xs dark:text-gray-600 text-gray-400 mt-1 px-1">
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
              return els;
            })}
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5 items-end">
                <div className={`w-7 h-7 rounded-full ${avatarColor(other?.name)} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
                  {initials(other?.name)}
                </div>
                <div className="dark:bg-surface-3 bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 dark:bg-gray-500 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-1.5 h-1.5 dark:bg-gray-500 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-1.5 h-1.5 dark:bg-gray-500 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t dark:border-brand-900/40 border-gray-200 flex-shrink-0">
        {/* Reply banner */}
        {replyTo && (
          <div className="flex items-center justify-between dark:bg-surface-3 bg-gray-100 rounded-lg px-3 py-1.5 mb-2 border-l-2 border-brand-500">
            <div className="min-w-0">
              <span className="text-xs text-brand-400 font-medium">Replying to {replyTo.senderName}</span>
              <p className="text-xs dark:text-gray-400 text-gray-500 truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 ml-2 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
              </svg>
            </button>
          </div>
        )}
        <div className="flex gap-3 items-end">
          <button onClick={() => { setShowSearch(v => !v); setSearchQuery(''); }}
            className={`p-2.5 rounded-xl transition flex-shrink-0 ${showSearch ? 'bg-brand-600 text-white' : 'dark:bg-surface-3 bg-gray-100 dark:text-gray-500 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600'}`}
            title="Search messages">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
          </button>
          <div className="flex-1 flex flex-col">
            <FormatToolbar textareaRef={textareaRef} setText={setText} />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTypingInput}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Message ${other?.name}...`}
              className="dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-200 border rounded-xl px-4 py-2.5 text-sm dark:text-white text-gray-900 dark:placeholder-gray-500 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition"
            />
          </div>
          <button onClick={sendMessage} disabled={!text.trim()}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
