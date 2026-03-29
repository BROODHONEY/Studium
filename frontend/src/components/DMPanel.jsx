import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { dmAPI } from '../services/api';
import OnlineDot from './OnlineDot';
import MessageMenu from './ui/MessageMenu';
import MessageContent from './ui/MessageContent';
import { formatTime, getDateLabel } from '../utils/time';

const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const COLORS = ['#4f46e5','#0d9488','#7c3aed','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

export default function DMPanel({ conversation, onNewMessage, onViewProfile, onNavigateToGroup }) {
  const { user }   = useAuth();
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const [editingId, setEditingId]   = useState(null);
  const [editText, setEditText]     = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuRect, setMenuRect]     = useState(null);
  const [replyTo, setReplyTo]       = useState(null);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);
  const messageRefs = useRef({});

  const other = conversation?.other;

  const cleanTokens = (t) => (t || '')
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
    .replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, '📎 $1');

  const parsePrivateReply = (content) => {
    if (!content?.startsWith('{{private_reply:')) return null;
    const newlineIdx = content.indexOf('\n');
    if (newlineIdx === -1) return null;
    const tokenLine = content.slice(0, newlineIdx);
    if (!tokenLine.endsWith('}}')) return null;
    const inner = tokenLine.slice('{{private_reply:'.length, -2);
    const c1 = inner.indexOf(':'), r1 = inner.slice(c1+1);
    const c2 = r1.indexOf(':'),   r2 = r1.slice(c2+1);
    const c3 = r2.indexOf(':');
    return {
      groupId:    inner.slice(0, c1),
      groupName:  r1.slice(0, c2).replace(/·/g, ':'),
      senderName: r2.slice(0, c3).replace(/·/g, ':'),
      quoted:     cleanTokens(r2.slice(c3+1)),
      message:    content.slice(newlineIdx+1),
    };
  };

  useEffect(() => {
    if (!openMenuId) return;
    const h = () => setOpenMenuId(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [openMenuId]);

  useEffect(() => {
    if (!conversation) { setMessages([]); setLoading(false); return; }
    setMessages([]); setLoading(true);
    dmAPI.getMessages(conversation.id)
      .then(res => setMessages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [conversation?.id, conversation]);

  useEffect(() => {
    if (!socket || !conversation) return;
    const onDM = ({ conversationId, message }) => {
      if (conversationId !== conversation.id) return;
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === message.id || (m.id?.startsWith?.('temp-') && m.content === message.content && m.sender?.id === message.sender?.id));
        if (idx >= 0) { const n = [...prev]; n[idx] = message; return n; }
        return [...prev, message];
      });
      onNewMessage?.(conversationId, message);
    };
    const onEdited   = ({ conversationId, messageId, content }) => { if (conversationId === conversation.id) setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, edited: true } : m)); };
    const onReaction = ({ conversationId, messageId, reactions }) => { if (conversationId === conversation.id) setMessages(prev => prev.map(m => m.id === messageId ? { ...m, dm_reactions: reactions } : m)); };
    const onDeleted  = ({ conversationId, messageId }) => { if (conversationId === conversation.id) setMessages(prev => prev.filter(m => m.id !== messageId)); };
    const onTyping   = ({ conversationId, userId }) => { if (conversationId === conversation.id && userId === other?.id) setIsTyping(true); };
    const onStop     = ({ conversationId, userId }) => { if (conversationId === conversation.id && userId === other?.id) setIsTyping(false); };
    socket.on('new_dm', onDM); socket.on('dm_message_edited', onEdited); socket.on('dm_message_reaction', onReaction);
    socket.on('dm_message_deleted', onDeleted); socket.on('dm_user_typing', onTyping); socket.on('dm_user_stopped_typing', onStop);
    return () => { socket.off('new_dm', onDM); socket.off('dm_message_edited', onEdited); socket.off('dm_message_reaction', onReaction); socket.off('dm_message_deleted', onDeleted); socket.off('dm_user_typing', onTyping); socket.off('dm_user_stopped_typing', onStop); };
  }, [conversation?.id, socket, other?.id, onNewMessage, conversation]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, isTyping]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;
    const opt = { id: `temp-${Date.now()}`, content: text.trim(), created_at: new Date().toISOString(), read: false, sender: { id: user.id, name: user.name }, replied_message: replyTo ? { id: replyTo.id, content: replyTo.content, sender: { name: replyTo.senderName } } : null };
    setMessages(prev => [...prev, opt]);
    socket.emit('dm_typing_stop', { conversationId: conversation.id, otherId: other?.id });
    socket.emit('send_dm', { conversationId: conversation.id, content: opt.content, replyTo: replyTo?.id || null });
    setText(''); setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleEditSave = async (msgId) => {
    if (!editText.trim()) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editText.trim(), edited: true } : m));
    setEditingId(null); setEditText('');
    try { await dmAPI.editMessage(msgId, editText.trim()); } catch { console.error('edit failed'); }
  };

  const handleReact = async (msgId, emoji) => { setOpenMenuId(null); try { await dmAPI.reactMessage(msgId, emoji); } catch { console.error('react failed'); } };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleTypingInput = (e) => {
    setText(e.target.value);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 130) + 'px'; }
    if (!socket) return;
    socket.emit('dm_typing_start', { conversationId: conversation.id, otherId: other?.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('dm_typing_stop', { conversationId: conversation.id, otherId: other?.id }), 1500);
  };

  if (!conversation) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 13, fontWeight: 300 }}>Select a conversation.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#000000' }}>
        <button onClick={() => onViewProfile?.(other?.id)} style={{ position: 'relative', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff' }}>
            {ini(other?.name)}
          </div>
          <OnlineDot userId={other?.id} className="absolute -bottom-0.5 -right-0.5 ring-2" style={{ '--tw-ring-color': '#000' }}/>
        </button>
        <button onClick={() => onViewProfile?.(other?.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{other?.name}</p>
          <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: 0, textTransform: 'capitalize' }}>{other?.role}</p>
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#111111', flexShrink: 0 }}/>
              <div style={{ height: 40, width: 160, borderRadius: 8, background: '#111111' }}/>
            </div>
          ))
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, color: '#fff' }}>{ini(other?.name)}</div>
            <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{other?.name}</p>
            <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.2)', margin: 0 }}>Start of your conversation</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const label = msg.created_at ? getDateLabel(msg.created_at) : null;
              const prevLabel = i > 0 && messages[i-1].created_at ? getDateLabel(messages[i-1].created_at) : null;
              const isOwn = msg.sender?.id === user?.id;
              const isTemp = msg.id?.startsWith?.('temp-');
              const prevMsg = i > 0 ? messages[i-1] : null;
              const showAvatar = !prevMsg || prevMsg.sender?.id !== msg.sender?.id;
              const reactionMap = {};
              (msg.dm_reactions || []).forEach(r => { if (!reactionMap[r.emoji]) reactionMap[r.emoji] = []; reactionMap[r.emoji].push(r.user_id); });

              return (
                <div key={msg.id}>
                  {label && label !== prevLabel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                      <div style={{ flex: 1, height: 1, background: '#1c1c1c' }}/>
                      <span style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.2)', padding: '2px 10px', border: '1px solid #1c1c1c', borderRadius: 20 }}>{label}</span>
                      <div style={{ flex: 1, height: 1, background: '#1c1c1c' }}/>
                    </div>
                  )}
                  <div ref={el => { if (el) messageRefs.current[msg.id] = el; }}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isOwn ? 'row-reverse' : 'row' }}
                    className="group/msg">
                    {/* Avatar */}
                    <div style={{ width: 28, flexShrink: 0, marginTop: 2 }}>
                      {showAvatar ? (
                        <button onClick={() => onViewProfile?.(isOwn ? user?.id : other?.id)}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: avatarBg(isOwn ? user?.name : other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#fff', border: 'none', cursor: 'pointer' }}>
                          {ini(isOwn ? user?.name : other?.name)}
                        </button>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: 360, alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                        {editingId === msg.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
                            <textarea autoFocus value={editText} onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(msg.id); } if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                              rows={2} style={{ background: '#111111', border: '1px solid #7c3aed', borderRadius: 10, padding: '8px 12px', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.8)', resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif' }}/>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => handleEditSave(msg.id)} style={{ flex: 1, padding: '6px', borderRadius: 8, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 11, fontWeight: 400, cursor: 'pointer' }}>Save</button>
                              <button onClick={() => { setEditingId(null); setEditText(''); }} style={{ flex: 1, padding: '6px', borderRadius: 8, background: '#111111', border: '1px solid #1c1c1c', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 300, cursor: 'pointer' }}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, fontWeight: 300, lineHeight: 1.5, wordBreak: 'break-words', background: isOwn ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : '#111111', color: isOwn ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)' }}>
                            {(() => {
                              const pr = parsePrivateReply(msg.content);
                              if (pr) return (
                                <>
                                  <button onClick={() => pr.groupId && onNavigateToGroup?.(pr.groupId)}
                                    style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, borderRadius: 8, overflow: 'hidden', borderLeft: '3px solid rgba(124,58,237,0.5)', background: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', padding: '6px 10px', cursor: 'pointer', border: 'none' }}>
                                    <p style={{ fontSize: 11, fontWeight: 400, color: isOwn ? 'rgba(196,181,253,0.9)' : 'rgba(124,58,237,0.9)', margin: '0 0 2px' }}>{pr.senderName}{pr.groupName && ` · ${pr.groupName}`}</p>
                                    <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.4)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.quoted}</p>
                                  </button>
                                  <MessageContent content={pr.message} isOwn={isOwn} />
                                </>
                              );
                              return (
                                <>
                                  {msg.replied_message && (
                                    <button onClick={() => { const el = messageRefs.current[msg.replied_message.id]; el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                                      style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, paddingLeft: 8, borderLeft: '2px solid rgba(124,58,237,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                      <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(124,58,237,0.8)', display: 'block' }}>{msg.replied_message.sender?.name}</span>
                                      <span style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>{msg.replied_message.content}</span>
                                    </button>
                                  )}
                                  <MessageContent content={msg.content} isOwn={isOwn} />
                                </>
                              );
                            })()}
                            {msg.edited && <span style={{ fontSize: 10, opacity: 0.4, marginLeft: 4 }}>(edited)</span>}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                              <span style={{ fontSize: 10, color: isOwn ? 'rgba(196,181,253,0.5)' : 'rgba(255,255,255,0.2)', fontWeight: 300 }}>
                                {formatTime(msg.created_at)}{isOwn && msg.read && ' · seen'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Three-dot menu */}
                        {!isTemp && editingId !== msg.id && (
                          <div style={{ position: 'relative', flexShrink: 0 }} className="opacity-0 group-hover/msg:opacity-100 transition">
                            <button onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMenuRect(r); setOpenMenuId(openMenuId === msg.id ? null : msg.id); }}
                              style={{ padding: 6, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', lineHeight: 0 }}>
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
                            </button>
                            {openMenuId === msg.id && menuRect && (
                              <MessageMenu anchorRect={menuRect} isOwn={isOwn} onClose={() => setOpenMenuId(null)}
                                onReact={e => handleReact(msg.id, e)}
                                onReply={() => setReplyTo({ id: msg.id, content: msg.content, senderName: msg.sender?.name })}
                                onEdit={isOwn ? () => { setEditingId(msg.id); setEditText(msg.content); } : undefined}
                                onDelete={() => { setMessages(prev => prev.filter(m => m.id !== msg.id)); dmAPI.deleteMessage(msg.id).catch(console.error); }}/>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Reactions */}
                      {Object.keys(reactionMap).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                          {Object.entries(reactionMap).map(([emoji, userIds]) => (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 300, border: userIds.includes(user?.id) ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.08)', background: userIds.includes(user?.id) ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)', color: userIds.includes(user?.id) ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                              <span>{emoji}</span><span>{userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#fff', flexShrink: 0 }}>{ini(other?.name)}</div>
                <div style={{ background: '#111111', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,150,300].map(d => <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${d}ms` }}/>)}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1c1c1c', flexShrink: 0, background: '#000000' }}>
        {replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111111', borderRadius: 8, padding: '6px 12px', marginBottom: 8, borderLeft: '2px solid rgba(124,58,237,0.5)' }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(124,58,237,0.8)' }}>Replying to {replyTo.senderName}</span>
              <p style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', marginLeft: 8, lineHeight: 0 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea ref={textareaRef} value={text} onChange={handleTypingInput} onKeyDown={handleKeyDown}
            rows={1} placeholder={`Message ${other?.name}…`}
            style={{ flex: 1, background: '#111111', border: '1px solid #1c1c1c', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.8)', resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', minHeight: 42, maxHeight: 130, overflowY: 'auto', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.5)'}
            onBlur={e => e.target.style.borderColor = '#1c1c1c'}/>
          <button onClick={sendMessage} disabled={!text.trim()}
            style={{ padding: '10px 18px', borderRadius: 10, background: text.trim() ? '#7c3aed' : '#111111', border: '1px solid', borderColor: text.trim() ? '#7c3aed' : '#1c1c1c', color: text.trim() ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 400, cursor: text.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s', flexShrink: 0 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
