import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { dmAPI } from '../services/api';
import OnlineDot from './OnlineDot';
import MessageMenu from './ui/MessageMenu';
import MessageContent from './ui/MessageContent';
import FormatToolbar from './ui/FormatToolbar';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatTime, getDateLabel } from '../utils/time';

const ini = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const COLORS = ['#4f46e5','#0d9488','#6366F1','#db2777','#d97706','#16a34a'];
const avatarBg = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const PIN_MAX = 4;
const pinKey = (convId) => `dm_pins_${convId}`;
const loadPins = (convId) => { try { return JSON.parse(localStorage.getItem(pinKey(convId))) || []; } catch { return []; } };
const savePins = (convId, pins) => localStorage.setItem(pinKey(convId), JSON.stringify(pins));

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
  const [pinnedIds, setPinnedIds]   = useState([]);
  const [showPins, setShowPins]     = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]); // [{ name, url, type }]
  const [uploading, setUploading]   = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);
  const messageRefs = useRef({});
  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const editTextareaRef = useRef(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const other = conversation?.other;

  const cleanTokens = (t) => (t || '')
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
    .replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, '?? $1');

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
      groupName:  r1.slice(0, c2).replace(/�/g, ':'),
      senderName: r2.slice(0, c3).replace(/�/g, ':'),
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
    setPinnedIds(loadPins(conversation.id));
    setShowPins(false);
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
    if (!text.trim() && attachedFiles.length === 0) return;
    if (!socket) return;
    const fileTokens = attachedFiles.map(f => `{{file:${f.id}:${f.name}:${f.url}}}`).join(' ');
    const content = [text.trim(), fileTokens].filter(Boolean).join(' ');
    const opt = { id: `temp-${Date.now()}`, content, created_at: new Date().toISOString(), read: false, sender: { id: user.id, name: user.name }, replied_message: replyTo ? { id: replyTo.id, content: replyTo.content, sender: { name: replyTo.senderName } } : null };
    setMessages(prev => [...prev, opt]);
    socket.emit('dm_typing_stop', { conversationId: conversation.id, otherId: other?.id });
    socket.emit('send_dm', { conversationId: conversation.id, content, replyTo: replyTo?.id || null });
    setText(''); setReplyTo(null); setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleEditSave = async (msgId) => {
    if (!editText.trim()) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editText.trim(), edited: true } : m));
    setEditingId(null); setEditText('');
    try { await dmAPI.editMessage(msgId, editText.trim()); } catch { console.error('edit failed'); }
  };

  const handleReact = async (msgId, emoji) => { setOpenMenuId(null); try { await dmAPI.reactMessage(msgId, emoji); } catch { console.error('react failed'); } };

  const handleConfirmDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setMessages(prev => prev.filter(m => m.id !== id));
    try { await dmAPI.deleteMessage(id); } catch { console.error('delete failed'); }
  };

  const togglePin = (msgId) => {
    setPinnedIds(prev => {
      let next;
      if (prev.includes(msgId)) {
        next = prev.filter(id => id !== msgId);
      } else {
        if (prev.length >= PIN_MAX) return prev; // max 4
        next = [...prev, msgId];
      }
      savePins(conversation.id, next);
      return next;
    });
    setOpenMenuId(null);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      // Upload to a temporary/DM bucket via a FormData POST
      const formData = new FormData();
      formData.append('file', file);
      const res = await dmAPI.uploadFile(formData);
      setAttachedFiles(prev => [...prev, { id: res.data.id, name: res.data.filename, url: res.data.file_url, type: res.data.file_type }]);
    } catch {
      // fallback: attach as a local object URL (no server upload)
      const url = URL.createObjectURL(file);
      setAttachedFiles(prev => [...prev, { id: `local-${Date.now()}`, name: file.name, url, type: file.type }]);
    } finally {
      setUploading(false);
    }
  };

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
      <p style={{ color: 'var(--text-3)', fontSize: 13, fontWeight: 300 }}>Select a conversation.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A36', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#111116' }}>
        <button onClick={() => onViewProfile?.(other?.id)} style={{ position: 'relative', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff' }}>
            {ini(other?.name)}
          </div>
          <OnlineDot userId={other?.id} className="absolute -bottom-0.5 -right-0.5 ring-2" style={{ '--tw-ring-color': '#000' }}/>
        </button>
        <button onClick={() => onViewProfile?.(other?.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-1)', margin: 0 }}>{other?.name}</p>
          <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--text-3)', margin: 0, textTransform: 'capitalize' }}>{other?.role}</p>
        </button>
        {/* Pin toggle button */}
        {pinnedIds.length > 0 && (
          <button onClick={() => setShowPins(v => !v)} title="Pinned messages"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 7, background: showPins ? 'rgba(99,102,241,0.15)' : 'none', border: `1px solid ${showPins ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`, color: showPins ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 400 }}>{pinnedIds.length}</span>
          </button>
        )}
      </div>

      {/* Pinned messages panel */}
      {showPins && pinnedIds.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', flexShrink: 0, maxHeight: 180, overflowY: 'auto' }}>
          <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pinned � {pinnedIds.length}/{PIN_MAX}</span>
          </div>
          {pinnedIds.map(pid => {
            const msg = messages.find(m => m.id === pid);
            if (!msg) return null;
            return (
              <button key={pid} onClick={() => { const el = messageRefs.current[pid]; el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setShowPins(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '6px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(99,102,241,0.6)', flexShrink: 0 }}>
                  <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
                </svg>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-2)', display: 'block' }}>{msg.sender?.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 300, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{msg.content}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); togglePin(pid); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, lineHeight: 0, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
                </button>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={scrollContainerRef} onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-raised)', flexShrink: 0 }}/>
              <div style={{ height: 40, width: 160, borderRadius: 8, background: 'var(--bg-raised)' }}/>
            </div>
          ))
        ) : messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, color: '#fff' }}>{ini(other?.name)}</div>
            <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)', margin: 0 }}>{other?.name}</p>
            <p style={{ fontSize: 11, fontWeight: 300, color: 'var(--text-3)', margin: 0 }}>Start of your conversation</p>
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

              // Design tokens
              const C = { primary: '#6366F1', primaryHi: '#8B8EF8', primaryLo: 'rgba(99,102,241,0.14)', raised: '#1C1C26', border: '#2A2A3A', text1: '#EEEEF8', text2: '#9090B0', text3: '#55556E' };

              return (
                <div key={msg.id}>
                  {label && label !== prevLabel && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                      <div style={{ flex: 1, height: 1, background: C.border }}/>
                      <span style={{ fontSize: 11, color: C.text3, background: '#111116', padding: '2px 10px', borderRadius: 20, border: `1px solid ${C.border}` }}>{label}</span>
                      <div style={{ flex: 1, height: 1, background: C.border }}/>
                    </div>
                  )}
                  <div ref={el => { if (el) messageRefs.current[msg.id] = el; }}
                    style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end', padding: '3px 0', borderRadius: 8, transition: 'background 0.1s' }}
                    className="group/msg"
                    onMouseEnter={e => e.currentTarget.style.background = `${C.primary}06`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Avatar � only for others */}
                    <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end', paddingBottom: 2 }}>
                      {!isOwn && showAvatar ? (
                        <button onClick={() => onViewProfile?.(other?.id)}
                          style={{ width: 32, height: 32, borderRadius: 10, background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer' }}>
                          {ini(other?.name)}
                        </button>
                      ) : <div style={{ width: 32 }} />}
                    </div>

                    {/* Bubble + meta */}
                    <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 3 }}>

                      {/* Sender name � others only */}
                      {!isOwn && showAvatar && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text2, paddingLeft: 4 }}>{other?.name}</span>
                      )}

                      {/* Private reply / reply preview */}
                      {(() => {
                        const pr = parsePrivateReply(msg.content);
                        if (pr) return (
                          <button onClick={() => pr.groupId && onNavigateToGroup?.(pr.groupId)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 2, borderRadius: 8, borderLeft: `3px solid ${C.primary}`, background: C.primaryLo, padding: '6px 10px', cursor: 'pointer', border: 'none' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.primaryHi, margin: '0 0 2px' }}>{pr.senderName}{pr.groupName && ` � ${pr.groupName}`}</p>
                            <p style={{ fontSize: 11, color: C.text3, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pr.quoted}</p>
                          </button>
                        );
                        if (msg.replied_message) return (
                          <button onClick={() => { const el = messageRefs.current[msg.replied_message.id]; el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 2, padding: '5px 10px', borderLeft: `3px solid ${C.primary}`, borderTop: 'none', borderRight: 'none', borderBottom: 'none', background: C.primaryLo, borderRadius: 8, cursor: 'pointer' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: C.primaryHi, display: 'block' }}>{msg.replied_message.sender?.name}</span>
                            <span style={{ fontSize: 11, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 240, lineHeight: 1.4 }}>
                              {(msg.replied_message.content || '')
                                .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
                                .replace(/\{\{file:[^:]+:([^:]+):[^}]+\}\}/g, '📎 $1')
                                .slice(0, 80)}
                            </span>
                          </button>
                        );
                        return null;
                      })()}

                      {/* Bubble */}
                      <div style={{
                        padding: '9px 14px',
                        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isOwn ? C.primary : C.raised,
                        border: isOwn ? 'none' : `1px solid ${C.border}`,
                        fontSize: 13, fontWeight: 300,
                        color: isOwn ? '#fff' : C.text1,
                        lineHeight: 1.6, wordBreak: 'break-words',
                      }}>
                        {(() => {
                          const pr = parsePrivateReply(msg.content);
                          return <MessageContent content={pr ? pr.message : msg.content} isOwn={isOwn} />;
                        })()}
                        {msg.edited && <span style={{ fontSize: 10, color: isOwn ? 'rgba(255,255,255,0.5)' : C.text3, marginLeft: 6 }}>(edited)</span>}
                      </div>

                      {/* Time + seen + menu */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: isOwn ? 0 : 4, paddingRight: isOwn ? 4 : 0 }} className="group/msg">
                        {!isTemp && (
                          <div className="opacity-0 group-hover/msg:opacity-100 transition" style={{ position: 'relative', order: isOwn ? 0 : 1 }}>
                            <button onClick={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMenuRect(r); setOpenMenuId(openMenuId === msg.id ? null : msg.id); }}
                              style={{ padding: '2px 5px', borderRadius: 5, background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 0, display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text3; }}>
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
                            </button>
                            {openMenuId === msg.id && menuRect && (
                              <MessageMenu anchorRect={menuRect} isOwn={isOwn} onClose={() => setOpenMenuId(null)}
                                onReact={e => handleReact(msg.id, e)}
                                onReply={() => setReplyTo({ id: msg.id, content: msg.content, senderName: msg.sender?.name })}
                                onEdit={isOwn ? () => { setEditingId(msg.id); setEditText(msg.content); } : undefined}
                                onPin={() => togglePin(msg.id)}
                                pinned={pinnedIds.includes(msg.id)}
                                pinDisabled={!pinnedIds.includes(msg.id) && pinnedIds.length >= PIN_MAX}
                                onDelete={() => setConfirmDeleteId(msg.id)}/>
                            )}
                          </div>
                        )}
                        <span style={{ fontSize: 10, color: C.text3, fontWeight: 300, order: isOwn ? 1 : 0 }}>{formatTime(msg.created_at)}</span>
                        {isOwn && msg.read && <span style={{ fontSize: 10, color: C.primaryHi, order: 2 }}>� seen</span>}
                      </div>

                      {/* Reactions */}
                      {Object.keys(reactionMap).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                          {Object.entries(reactionMap).map(([emoji, userIds]) => (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 12, border: `1px solid ${userIds.includes(user?.id) ? C.primary + '60' : C.border}`, background: userIds.includes(user?.id) ? C.primaryLo : C.raised, color: userIds.includes(user?.id) ? C.primaryHi : C.text2, cursor: 'pointer' }}>
                              <span>{emoji}</span><span style={{ fontSize: 11 }}>{userIds.length}</span>
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
                <div style={{ width: 28, height: 28, borderRadius: 10, background: avatarBg(other?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{ini(other?.name)}</div>
                <div style={{ background: '#1C1C26', border: '1px solid #2A2A36', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,150,300].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#55556E', display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${d}ms` }}/>)}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef}/>
        </div>

        {showScrollBtn && (
          <button onClick={scrollToBottom}
            style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-raised)'}
            title="Scroll to bottom">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #2A2A36', flexShrink: 0, background: '#111116' }}>
        {/* Reply banner */}
        {replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '7px 12px', borderRadius: 8, borderLeft: '3px solid #6366F1', background: '#16161E' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#8B8EF8' }}>? Replying to </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#9090B0' }}>{replyTo.senderName}</span>
              <p style={{ fontSize: 11, color: '#55556E', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.content?.slice(0, 60)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556E', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>�</button>
          </div>
        )}
        {/* Attached file pills */}
        {attachedFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {attachedFiles.map(f => (
              <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: '#1C1C26', border: '1px solid #2A2A36', fontSize: 11, color: '#9090B0' }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#55556E', flexShrink: 0 }}><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/></svg>
                <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <button onMouseDown={e => { e.preventDefault(); setAttachedFiles(prev => prev.filter(r => r.id !== f.id)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556E', lineHeight: 1, padding: 0 }} onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.7)'} onMouseLeave={e => e.currentTarget.style.color = '#55556E'}>�</button>
              </span>
            ))}
          </div>
        )}
        {/* Input pill */}
        <div style={{ background: '#16161E', border: '1px solid #2A2A36', borderRadius: 14, overflow: 'visible', transition: 'border-color 0.15s', position: 'relative' }} onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'} onBlurCapture={e => e.currentTarget.style.borderColor = '#2A2A3A'}>
          {showToolbar && (
            <div style={{ padding: '8px 12px 0', borderBottom: '1px solid #2A2A36', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FormatToolbar textareaRef={textareaRef} setText={setText} />
              <button type="button" title="Upload file" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'none', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', color: uploading ? '#6366F1' : '#55556E' }}>
                {uploading ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.7s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> : <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => setShowToolbar(v => !v)} title="Attach / Format" style={{ flexShrink: 0, width: 44, alignSelf: 'stretch', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', color: showToolbar ? '#6366F1' : '#55556E', transition: 'color 0.15s' }} onMouseEnter={e => { if (!showToolbar) e.currentTarget.style.color = '#9090B0'; }} onMouseLeave={e => { if (!showToolbar) e.currentTarget.style.color = '#55556E'; }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
            </button>
            <textarea ref={textareaRef} value={text} onChange={handleTypingInput} onKeyDown={handleKeyDown} rows={1} placeholder={`Message ${other?.name}�`} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '12px 8px', fontSize: 13, fontWeight: 300, color: '#EEEEF8', resize: 'none', fontFamily: 'Inter, sans-serif', minHeight: 46, maxHeight: 130, overflowY: 'auto', boxSizing: 'border-box', lineHeight: 1.5 }} onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px'; }}/>
            <div style={{ padding: '8px 8px 8px 4px', flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={sendMessage} disabled={!text.trim() && attachedFiles.length === 0} style={{ width: 34, height: 34, borderRadius: 10, border: 'none', cursor: (text.trim() || attachedFiles.length > 0) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (text.trim() || attachedFiles.length > 0) ? '#6366F1' : '#2A2A3A', color: '#fff', transition: 'all 0.15s' }} onMouseEnter={e => { if (text.trim() || attachedFiles.length > 0) e.currentTarget.style.background = '#4f46e5'; }} onMouseLeave={e => { e.currentTarget.style.background = (text.trim() || attachedFiles.length > 0) ? '#6366F1' : '#2A2A3A'; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </div>
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, paddingLeft: 4 }}>
            <div style={{ display: 'flex', gap: 3 }}>{[0,150,300].map(d => <span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366F1', display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${d}ms` }}/>)}</div>
            <span style={{ fontSize: 11, color: '#55556E' }}>{other?.name} is typing</span>
          </div>
        )}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"/>
      </div>
      <ConfirmDialog
        open={!!confirmDeleteId}
        danger
        title="Delete this message?"
        description="This will permanently remove the message."
        confirmText="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Edit message modal */}
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: 16 }}
          onClick={() => { setEditingId(null); setEditText(''); }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#1A1A1F', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.9)', fontFamily: 'Inter, sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #2A2A38' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#EEEEF5' }}>Edit message</span>
              <button onClick={() => { setEditingId(null); setEditText(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#55556E', lineHeight: 0, padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#9898B0'}
                onMouseLeave={e => e.currentTarget.style.color = '#55556E'}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#111116', border: '1px solid #2A2A38', borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}
                onFocusCapture={e => e.currentTarget.style.borderColor = '#6366F1'}
                onBlurCapture={e => e.currentTarget.style.borderColor = '#2A2A38'}>
                <div style={{ padding: '8px 12px 0', borderBottom: '1px solid #2A2A38' }}>
                  <FormatToolbar textareaRef={editTextareaRef} setText={setEditText} />
                </div>
                <textarea ref={editTextareaRef} autoFocus value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(editingId); } if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                  rows={3}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 300, color: '#EEEEF5', resize: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'; }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => handleEditSave(editingId)} disabled={!editText.trim()}
                  style={{ width: '100%', padding: '14px', background: editText.trim() ? 'linear-gradient(135deg, #5B5FEF, #4338CA)' : '#2A2A38', border: 'none', borderRadius: 12, color: editText.trim() ? '#fff' : '#55556E', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: editText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                  Save Changes
                </button>
                <button onClick={() => { setEditingId(null); setEditText(''); }}
                  style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#55556E', fontSize: 13, fontWeight: 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#9898B0'}
                  onMouseLeave={e => e.currentTarget.style.color = '#55556E'}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
