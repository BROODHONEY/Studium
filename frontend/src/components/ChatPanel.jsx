import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, groupsAPI } from '../services/api';
import MessageMenu from './ui/MessageMenu';
import ConfirmDialog from './ui/ConfirmDialog';
import MessageContent from './ui/MessageContent';
import FormatToolbar from './ui/FormatToolbar';
import { formatTime, getDateLabel } from '../utils/time';

const EMOJI_OPTIONS = ['ðâ', 'â¤ï¸ ', 'ð', 'ð®', 'ð¢', 'ðâ¥'];

// -- Design tokens - new palette ------------------------
const C = {
  bg:        '#181818',
  surface:   '#1E1E1E',
  raised:    '#252525',
  overlay:   '#2E2E2E',
  border:    '#333333',
  borderHi:  '#444444',
  primary:   '#C0C1FF',
  primaryHi: '#D4D5FF',
  primaryLo: 'rgba(192,193,255,0.12)',
  primaryMid:'rgba(192,193,255,0.22)',
  secondary: '#FFB38E',
  secondaryHi:'#FFC9A8',
  secondaryLo:'rgba(255,179,142,0.12)',
  tertiary:  '#9E9E9E',
  tertiaryHi:'#BDBDBD',
  tertiaryLo:'rgba(158,158,158,0.12)',
  text1:     '#F0F0F0',
  text2:     '#9E9E9E',
  text3:     '#555555',
  danger:    '#EF4444',
  dangerLo:  'rgba(239,68,68,0.10)',
};

export default function ChatPanel({ group, onViewProfile, onFileRef, highlightMessageId, onHighlightClear, draft, onDraftChange }) {
  const { user }   = useAuth();
  const { socket, connected } = useSocket();

  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState(draft || '');
  const mentionsRef = useRef({});
  const [loading, setLoading]       = useState(true);
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [pinnedMsgs, setPinnedMsgs] = useState([]);
  const [showPinned, setShowPinned] = useState(false); void showPinned; void setShowPinned;
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch]   = useState(false); void showSearch; void setShowSearch;
  const [typingUsers, setTypingUsers] = useState({});

  const [members, setMembers]           = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionStartRef                 = useRef(null);
  const mentionListRef                  = useRef(null);

  const [fileRefs, setFileRefs] = useState([]);

  const [highlightedMessageId, setHighlightedMessageId] = useState(null); void highlightedMessageId;
  const highlightTimeoutRef = useRef(null);
  const messageRefs = useRef(new Map());

  const [pinTimeModal, setPinTimeModal] = useState({ open: false, messageId: null, pin_ttl_minutes: '', content: '' });

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const editTextareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const bottomRef        = useRef(null);
  const textareaRef      = useRef(null);
  const joinedRoomsRef   = useRef(new Set());
  const previousGroupRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingTimersRef  = useRef({});
  const isTypingRef      = useRef(false);

  const myRole    = group?.my_role;
  const isTeacher = myRole === 'admin' || myRole === 'teacher';
  const canSend   = adminsOnly ? myRole === 'admin' : true;

  const timeline = messages
    .map(m => ({ ...m, _kind: m.type === 'system' ? 'system' : 'message' }))
    .filter(m => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return m.content?.toLowerCase().includes(q) || (m.users || m.sender)?.name?.toLowerCase().includes(q);
    });

  const [editingId, setEditingId]         = useState(null);
  const [editText, setEditText]           = useState('');
  const [openMenuId, setOpenMenuId]       = useState(null);
  const [menuRect, setMenuRect]           = useState(null);
  const [replyTo, setReplyTo]             = useState(null);
  const [privateReply, setPrivateReply]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
    if (!group) return;
    setMessages([]); setLoading(true);
    messagesAPI.list(group.id).then(res => setMessages(res.data)).catch(console.error).finally(() => setLoading(false));
    messagesAPI.pinned(group.id).then(res => setPinnedMsgs(res.data)).catch(console.error);
    groupsAPI.get(group.id).then(res => { setAdminsOnly(res.data.admins_only || false); setMembers(res.data.members || []); }).catch(console.error);
  }, [group?.id]);

  useEffect(() => {
    if (!group || !socket) return;
    if (!joinedRoomsRef.current.has(group.id)) { socket.emit('join_group', group.id); joinedRoomsRef.current.add(group.id); }
    socket.off('new_message'); socket.off('system_message'); socket.off('admins_only_changed');
    socket.off('message_deleted'); socket.off('message_pinned'); socket.off('message_unpinned');
    socket.off('user_typing'); socket.off('user_stopped_typing'); socket.off('message_edited'); socket.off('message_reaction');

    socket.on('new_message', (msg) => {
      setMessages(prev => {
        const tempIdx = prev.findIndex(m => m.id?.startsWith('temp-') && m.content === msg.content && m.group_id === msg.group_id);
        if (tempIdx >= 0) { const next = [...prev]; next[tempIdx] = msg; return next; }
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    socket.on('system_message', (event) => {
      setMessages(prev => {
        if (prev.find(m => m.id === event.id)) return prev;
        return [...prev, { id: event.id, content: event.text, type: 'system', subtype: event.subtype, created_at: event.timestamp }];
      });
    });
    socket.on('admins_only_changed', ({ enabled }) => setAdminsOnly(enabled));
    socket.on('message_deleted', ({ messageId }) => setMessages(prev => prev.filter(m => m.id !== messageId)));
    socket.on('message_pinned', ({ messageId, content, pin_time }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: true, pin_time } : m));
      setPinnedMsgs(prev => {
        const exists = prev.find(m => m.id === messageId);
        const next = { id: messageId, content, pin_time: pin_time ?? null };
        if (exists) return prev.map(m => m.id === messageId ? { ...m, content: content ?? m.content, pin_time: pin_time ?? null } : m);
        return [next, ...prev];
      });
    });
    socket.on('message_unpinned', ({ messageId }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: false, pin_time: null } : m));
      setPinnedMsgs(prev => prev.filter(m => m.id !== messageId));
    });
    socket.on('user_typing', ({ userId, userName }) => {
      if (typingTimersRef.current[userId]) clearTimeout(typingTimersRef.current[userId]);
      setTypingUsers(prev => ({ ...prev, [userId]: userName || 'Someone' }));
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
    socket.on('message_edited', ({ messageId, content }) => setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, edited: true } : m)));
    socket.on('message_reaction', ({ messageId, reactions }) => setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_reactions: reactions } : m)));

    return () => {
      socket.off('new_message'); socket.off('system_message'); socket.off('admins_only_changed');
      socket.off('message_deleted'); socket.off('message_pinned'); socket.off('message_unpinned');
      socket.off('user_typing'); socket.off('user_stopped_typing'); socket.off('message_edited'); socket.off('message_reaction');
    };
  }, [group?.id, socket]);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  useEffect(() => {
    if (!highlightMessageId || loading) return;
    const attempt = (tries) => {
      if (tries <= 0) return;
      const el = messageRefs.current.get(highlightMessageId);
      if (!el) { setTimeout(() => attempt(tries - 1), 200); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(highlightMessageId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => { setHighlightedMessageId(null); onHighlightClear?.(); }, 2000);
    };
    attempt(8);
  }, [highlightMessageId, loading]);

  useEffect(() => {
    if (highlightMessageId) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length]);

  const scrollToMessage = (messageId) => {
    if (!messageId) return;
    const attempt = (n) => {
      const el = messageRefs.current.get(messageId) || document.getElementById(`message-${messageId}`);
      if (!el) { if (n > 0) setTimeout(() => attempt(n - 1), 250); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => setHighlightedMessageId(null), 1800);
    };
    attempt(2);
  };

  const sendMessage = () => {
    if ((!text.trim() && fileRefs.length === 0) || !socket || !connected || !canSend) return;
    const fileTokens = fileRefs.map(f => `{{file:${f.id}:${f.filename}:${f.file_url}}}`).join(' ');
    const encoded = encodeForSend(text.trim());
    const content = [encoded, fileTokens].filter(Boolean).join(' ');
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, content, type: 'text', created_at: new Date().toISOString(), group_id: group.id, users: user, sender: user, ...(replyTo ? { replied_message: { id: replyTo.id, content: replyTo.content, users: { name: replyTo.senderName } } } : {}) };
    setMessages(prev => [...prev, optimistic]);
    socket.emit('send_message', { groupId: group.id, content, type: 'text', ...(replyTo ? { replyTo: replyTo.id } : {}) });
    setText(''); mentionsRef.current = {}; setFileRefs([]); setReplyTo(null);
    onDraftChange?.('');
    clearTimeout(typingTimeoutRef.current); isTypingRef.current = false;
    socket.emit('typing_stop', { groupId: group.id });
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handlePrivateReply = async () => {
    if (!privateReply || (!text.trim() && fileRefs.length === 0)) return;
    try {
      const fileTokens = fileRefs.map(f => `{{file:${f.id}:${f.filename}:${f.file_url}}}`).join(' ');
      const encoded = encodeForSend(text.trim());
      const content = [encoded, fileTokens].filter(Boolean).join(' ');
      await messagesAPI.replyPrivate({ targetUserId: privateReply.senderId, content, quotedContent: privateReply.content, quotedSenderName: privateReply.senderName, groupId: group?.id, groupName: group?.name });
      setText(''); mentionsRef.current = {}; setFileRefs([]); setPrivateReply(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = (messageId) => setDeleteConfirm(messageId);

  const confirmDelete = async () => {
    const messageId = deleteConfirm;
    setDeleteConfirm(null);
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try { await messagesAPI.delete(messageId); }
    catch { messagesAPI.list(group.id).then(res => setMessages(res.data)).catch(console.error); }
  };

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) return;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: editText.trim(), edited: true } : m));
    setEditingId(null); setEditText('');
    try { await messagesAPI.edit(messageId, editText.trim()); }
    catch (err) { console.error(err); messagesAPI.list(group.id).then(res => setMessages(res.data)).catch(console.error); }
  };

  const handleReact = async (messageId, emoji) => {
    setOpenMenuId(null);
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = [...(m.message_reactions || [])];
      const existing = reactions.findIndex(r => r.emoji === emoji && r.user_id === user?.id);
      if (existing >= 0) reactions.splice(existing, 1);
      else reactions.push({ emoji, user_id: user?.id });
      return { ...m, message_reactions: reactions };
    }));
    try { await messagesAPI.react(messageId, emoji); } catch (err) {
      console.error(err);
      // Revert on error by re-fetching
      messagesAPI.list(group.id).then(res => setMessages(res.data)).catch(console.error);
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      await messagesAPI.unpin(messageId);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: false, pin_time: null } : m));
      setPinnedMsgs(prev => prev.filter(m => m.id !== messageId));
    } catch (err) { console.error(err); }
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
        if (exists) return prev.map(m => m.id === messageId ? { ...m, content: content ?? m.content, pin_time: serverPinTime } : m);
        return [next, ...prev];
      });
    } catch (err) { console.error(err); }
  };

  const getPinExpiry = (pinTime) => { if (!pinTime) return null; const d = new Date(pinTime); return isNaN(d.getTime()) ? null : d; };
  const getRemainingMinutes = (pinTime) => { const d = getPinExpiry(pinTime); if (!d) return null; const diff = d.getTime() - Date.now(); return diff <= 0 ? 0 : Math.ceil(diff / 60000); };
  const formatPinLabel = (pinTime) => { const r = getRemainingMinutes(pinTime); if (r === null) return null; if (r === 0) return 'Unpinning soon'; if (r < 60) return `${r}m left`; return `${Math.ceil(r/60)}h left`; };

  const handleKeyDown = (e) => {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => (i + 1) % filteredMembers.length); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex(i => (i - 1 + filteredMembers.length) % filteredMembers.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filteredMembers[mentionIndex]); return; }
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (privateReply) handlePrivateReply(); else sendMessage(); }
    if (e.key === 'Escape') { setReplyTo(null); setPrivateReply(null); }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    onDraftChange?.(val);
    if (!val) mentionsRef.current = {};
    const pos = e.target.selectionStart;
    const textUpToCaret = val.slice(0, pos);
    const mentionMatch = textUpToCaret.match(/@(\w*)$/);
    if (mentionMatch) { mentionStartRef.current = pos - mentionMatch[0].length; setMentionQuery(mentionMatch[1].toLowerCase()); setMentionIndex(0); }
    else setMentionQuery(null);
    if (!socket || !group || !connected) return;
    if (!isTypingRef.current) { isTypingRef.current = true; socket.emit('typing_start', { groupId: group.id }); }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { isTypingRef.current = false; socket.emit('typing_stop', { groupId: group.id }); }, 2000);
  };

  const filteredMembers = mentionQuery !== null
    ? members.map(m => m.users).filter(u => u && u.id !== user?.id && u.name?.toLowerCase().includes(mentionQuery)).slice(0, 6)
    : [];

  const encodeForSend = (t) => { let out = t; for (const [display, encoded] of Object.entries(mentionsRef.current)) out = out.split(display).join(encoded); return out; };

  const insertMention = (member) => {
    const caretPos = textareaRef.current?.selectionStart ?? mentionStartRef.current;
    const before = text.slice(0, mentionStartRef.current);
    const after  = text.slice(caretPos);
    const displayToken = `@${member.name}`;
    mentionsRef.current[displayToken] = `@[${member.name}](${member.id})`;
    const newText = before + displayToken + ' ' + after;
    setText(newText); setMentionQuery(null);
    setTimeout(() => { if (textareaRef.current) { const pos = before.length + displayToken.length + 1; textareaRef.current.focus(); textareaRef.current.setSelectionRange(pos, pos); } }, 0);
  };

  const initials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const AVATAR_PALETTE = ['#C0C1FF','#FFB38E','#9E9E9E','#22C55E','#D4D5FF','#FFC9A8'];
  const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) || 0) % AVATAR_PALETTE.length];

  if (!group) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: 'Inter, sans-serif' }}>
      <p style={{ color: C.text3, fontSize: 13, fontWeight: 300 }}>Select a group to start chatting</p>
    </div>
  );

  // -- Inline file preview ------------------------------
  const FilePreview = ({ file }) => {
    if (!file) return null;
    const isImage = file.file_type?.startsWith('image/');
    const isPdf   = file.file_type === 'application/pdf';
    const sizeStr = file.size_bytes ? file.size_bytes < 1048576 ? `${(file.size_bytes/1024).toFixed(1)} KB` : `${(file.size_bytes/1048576).toFixed(1)} MB` : '';
    if (isImage) return (
      <a href={file.file_url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 8 }}>
        <img src={file.file_url} alt={file.filename} style={{ maxWidth: 280, maxHeight: 200, borderRadius: 10, border: `1px solid ${C.border}`, objectFit: 'cover', display: 'block' }}/>
      </a>
    );
    return (
      <a href={file.file_url} target="_blank" rel="noreferrer"
        style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, textDecoration: 'none', maxWidth: 280, transition: 'border-color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
        <span style={{ fontSize: 20 }}>{isPdf ? 'ðâ' : 'ðâ'}</span>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 12, color: C.text1, fontWeight: 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</p>
          {sizeStr && <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>{sizeStr}</p>}
        </div>
      </a>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>

      {/* -- Modals -- */}
      <ConfirmDialog open={!!deleteConfirm} title="Delete message" description="This message will be permanently deleted." confirmText="Delete" cancelText="Cancel" danger onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />

      {/* Edit modal */}
      {editingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', padding: 16 }}
          onClick={() => { setEditingId(null); setEditText(''); }}>
          <div style={{ width: '100%', maxWidth: 500, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>Edit message</span>
              <button onClick={() => { setEditingId(null); setEditText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 0, padding: 4 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
              </button>
            </div>
            <div style={{ margin: '14px 20px', background: C.raised, border: `1px solid ${C.primary}50`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px 0', borderBottom: `1px solid ${C.border}` }}>
                <FormatToolbar textareaRef={editTextareaRef} setText={setEditText} />
              </div>
              <textarea ref={editTextareaRef} autoFocus value={editText} onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditMessage(editingId); } if (e.key === 'Escape') { setEditingId(null); setEditText(''); } }}
                rows={3} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '10px 14px', fontSize: 13, fontWeight: 300, color: C.text1, resize: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'; }} />
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
              <button onClick={() => handleEditMessage(editingId)} disabled={!editText.trim()}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: editText.trim() ? C.primary : C.raised, border: `1px solid ${editText.trim() ? C.primary : C.border}`, color: editText.trim() ? '#fff' : C.text3, fontSize: 13, fontWeight: 500, cursor: editText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
                Save changes
              </button>
              <button onClick={() => { setEditingId(null); setEditText(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.text2, fontSize: 13, fontWeight: 300, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pin time modal */}
      {pinTimeModal.open && (() => {
        const PRESETS = [{ label: '1 hour', value: '60' }, { label: '8 hours', value: '480' }, { label: '24 hours', value: '1440' }, { label: 'Until removed', value: '' }];
        const isCustom = !PRESETS.some(p => p.value === pinTimeModal.pin_ttl_minutes);
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', padding: 16 }}
            onClick={() => setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' })}>
            <div style={{ width: '100%', maxWidth: 320, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 16, padding: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
              onClick={e => e.stopPropagation()}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text1, margin: '0 0 4px' }}>Pin message</p>
              <p style={{ fontSize: 12, color: C.text3, margin: '0 0 16px' }}>How long should this stay pinned?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => setPinTimeModal(s => ({ ...s, pin_ttl_minutes: p.value }))}
                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, fontSize: 13, border: `1px solid ${pinTimeModal.pin_ttl_minutes === p.value && !isCustom ? C.primary : C.border}`, background: pinTimeModal.pin_ttl_minutes === p.value && !isCustom ? C.primaryLo : C.raised, color: pinTimeModal.pin_ttl_minutes === p.value && !isCustom ? C.primaryHi : C.text2, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {p.label}{p.value && <span style={{ color: C.text3, fontSize: 11, marginLeft: 8 }}>({Number(p.value) >= 60 ? `${Number(p.value)/60}h` : `${p.value}m`})</span>}
                  </button>
                ))}
                <button onClick={() => setPinTimeModal(s => ({ ...s, pin_ttl_minutes: isCustom ? s.pin_ttl_minutes : '30' }))}
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, fontSize: 13, border: `1px solid ${isCustom ? C.primary : C.border}`, background: isCustom ? C.primaryLo : C.raised, color: isCustom ? C.primaryHi : C.text2, cursor: 'pointer', transition: 'all 0.15s' }}>
                  Custom time
                </button>
                {isCustom && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input autoFocus type="number" min="1" step="1" value={pinTimeModal.pin_ttl_minutes}
                      onChange={e => setPinTimeModal(s => ({ ...s, pin_ttl_minutes: e.target.value }))}
                      style={{ flex: 1, background: C.raised, border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: C.text1, outline: 'none', fontFamily: 'Inter, sans-serif' }}
                      placeholder="Minutes" />
                    <span style={{ fontSize: 12, color: C.text3 }}>min</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' })}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, background: C.raised, border: `1px solid ${C.border}`, color: C.text2, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={async () => { const { messageId, pin_ttl_minutes, content } = pinTimeModal; setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' }); await handlePinWithTime(messageId, pin_ttl_minutes, content); scrollToMessage(messageId); }}
                  disabled={!pinTimeModal.messageId}
                  style={{ flex: 1, padding: '10px', borderRadius: 10, background: C.primary, border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Pin
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* -- Admins-only banner -- */}
      {adminsOnly && (
        <div style={{ margin: '10px 16px 0', padding: '8px 14px', borderRadius: 8, background: C.secondaryLo, border: `1px solid 40`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill={C.secondary}><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
          <span style={{ fontSize: 12, fontWeight: 300, color: C.secondary }}>Admins only ââ only admins can send messages</span>
        </div>
      )}

      {/* -- Reconnecting banner -- */}
      {socket && !connected && (
        <div style={{ margin: '8px 16px 0', padding: '8px 14px', borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, color: C.text3, fontSize: 12, textAlign: 'center', flexShrink: 0 }}>
          Reconnecting? messages may be delayed
        </div>
      )}

      {/* -- Outer row: [left col] [right sidebar]  · both span full height -- */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/* -- Left column: timeline + input -- */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Message timeline */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div ref={scrollContainerRef} onScroll={handleScroll}
              style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 2 }}>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '8px 0' }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: C.raised, flexShrink: 0 }}/>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                        <div style={{ height: 10, background: C.raised, borderRadius: 6, width: 90 }}/>
                        <div style={{ height: 38, background: C.raised, borderRadius: 10, width: '55%' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : timeline.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <p style={{ color: C.text3, fontSize: 13, fontWeight: 300 }}>No messages yet. Say hello!</p>
                </div>
              ) : (
                timeline.flatMap((item, i) => {
                  const label = item.created_at ? getDateLabel(item.created_at) : null;
                  const prevLabel = i > 0 && timeline[i-1].created_at ? getDateLabel(timeline[i-1].created_at) : null;
                  const showSep = label && label !== prevLabel;
                  const els = [];

                  if (showSep) els.push(
                    <div key={`sep-${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
                      <div style={{ flex: 1, height: 1, background: C.border }}/>
                      <span style={{ fontSize: 11, color: C.text3, background: C.bg, padding: '3px 14px', borderRadius: 20, border: `1px solid ${C.border}`, flexShrink: 0, fontWeight: 400, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
                      <div style={{ flex: 1, height: 1, background: C.border }}/>
                    </div>
                  );

                  if (item._kind === 'system') {
                    els.push(
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                        <div style={{ flex: 1, height: 1, background: C.border }}/>
                        <span style={{ fontSize: 11, color: item.subtype === 'kick' ? C.danger : item.subtype === 'leave' ? C.tertiary : C.text3, background: C.bg, padding: '2px 12px', borderRadius: 20, border: `1px solid ${item.subtype === 'kick' ? C.dangerLo : item.subtype === 'leave' ? C.tertiaryLo : C.border}`, flexShrink: 0 }}>
                          {item.content}
                        </span>
                        <div style={{ flex: 1, height: 1, background: C.border }}/>
                      </div>
                    );
                    return els;
                  }

                  const sender  = item.users || item.sender;
                  const isOwn   = sender?.id === user?.id;
                  const roll    = sender?.roll_no;
                  const rollSuffix = roll ? ` · ${String(roll).slice(-3)}` : '';
                  const senderName = sender?.name ? `${sender.name}${sender.role === 'student' ? rollSuffix : ''}` : 'Unknown';
                  const canDelete = isOwn || myRole === 'admin';
                  const canEdit   = isOwn && item.type !== 'system';
                  const reactionMap = {};
                  (item.message_reactions || []).forEach(r => { if (!reactionMap[r.emoji]) reactionMap[r.emoji] = []; reactionMap[r.emoji].push(r.user_id); });

                  // Grouping: same sender, within 5 minutes, no date separator between
                  const prevItem   = i > 0 ? timeline[i - 1] : null;
                  const nextItem   = i < timeline.length - 1 ? timeline[i + 1] : null;
                  const prevSender = prevItem?._kind !== 'system' ? (prevItem?.users || prevItem?.sender) : null;
                  const nextSender = nextItem?._kind !== 'system' ? (nextItem?.users || nextItem?.sender) : null;
                  const prevDateLabel = prevItem?.created_at ? getDateLabel(prevItem.created_at) : null;
                  const timeDiffPrev = prevItem?.created_at ? (new Date(item.created_at) - new Date(prevItem.created_at)) / 60000 : Infinity;
                  const timeDiffNext = nextItem?.created_at ? (new Date(nextItem.created_at) - new Date(item.created_at)) / 60000 : Infinity;
                  const sameGroupAsPrev = !showSep && prevSender?.id === sender?.id && timeDiffPrev < 5 && prevDateLabel === label;
                  const sameGroupAsNext = nextSender?.id === sender?.id && timeDiffNext < 5 && (nextItem?.created_at ? getDateLabel(nextItem.created_at) : null) === label && nextItem?._kind !== 'system';
                  const showSenderName = !sameGroupAsPrev;
                  // Show time inside bubble only on the last message of a group (or standalone)
                  const showTimeInBubble = !sameGroupAsNext;

                  const nameColor = sender?.role === 'admin' ? C.tertiary : sender?.role === 'teacher' ? C.primaryHi : isOwn ? C.secondary : C.text2;

                  els.push(
                    <div key={item.id} id={`message-${item.id}`}
                      ref={(el) => { if (el) messageRefs.current.set(item.id, el); else messageRefs.current.delete(item.id); }}
                      className={`group/msg${item.id?.startsWith('temp-') ? ' msg-enter' : ''}`}
                      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start', padding: sameGroupAsPrev ? '1px 8px' : '3px 8px', borderRadius: 10, transition: 'background 0.12s', marginLeft: -8, marginRight: -8, marginTop: sameGroupAsPrev ? 1 : 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = `${C.primary}06`}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* Avatar ââ top-aligned, shown only when sender changes */}
                      <div style={{ flexShrink: 0, width: 34, alignSelf: 'flex-start', paddingTop: 2 }}>
                        {showSenderName ? (
                          <button onClick={() => onViewProfile?.(isOwn ? user?.id : sender?.id)}
                            style={{ width: 34, height: 34, borderRadius: 10, background: avatarBg(isOwn ? user?.name : sender?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            {initials(isOwn ? user?.name : sender?.name)}
                          </button>
                        ) : <div style={{ width: 34 }} />}
                      </div>

                      {/* Bubble + meta */}
                      <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 3 }}>

                        {/* Sender name row · others only */}
                        {!isOwn && showSenderName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: nameColor }}>{senderName}</span>
                            {sender?.role === 'teacher' && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: C.primaryLo, color: C.primaryHi, textTransform: 'uppercase', letterSpacing: '0.07em', border: `1px solid ${C.primary}30` }}>INSTRUCTOR</span>}
                            {sender?.role === 'admin' && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: C.tertiaryLo, color: C.tertiary, textTransform: 'uppercase', letterSpacing: '0.07em', border: `1px solid ${C.tertiary}30` }}>ADMIN</span>}
                          </div>
                        )}

                        {/* Reply preview */}
                        {item.replied_message && (() => {
                          const raw = item.replied_message.content || '';
                          const clean = raw
                            .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
                            .replace(/\{\{file:[^:]+:([^:]+):[^}]+\}\}/g, 'ðâ $1')
                            .slice(0, 80);
                          return (
                            <button onClick={() => scrollToMessage(item.replied_message.id)}
                              style={{
                                display: 'block', width: '100%', textAlign: isOwn ? 'right' : 'left',
                                marginBottom: 4, padding: '6px 10px', borderRadius: 8,
                                borderLeft: isOwn ? 'none' : `3px solid ${C.secondary}`,
                                borderRight: isOwn ? `3px solid ${C.secondary}` : 'none',
                                borderTop: 'none', borderBottom: 'none',
                                background: isOwn ? 'rgba(255,179,142,0.10)' : C.secondaryLo,
                                cursor: 'pointer',
                              }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: C.secondary, display: 'block' }}>
                                {item.replied_message.users?.name || 'Unknown'}
                              </span>
                              <span style={{ fontSize: 11, color: C.text2, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                                {clean}{raw.length > 80 ? 'â¦' : ''}
                              </span>
                            </button>
                          );
                        })()}

                        {/* Bubble row: menu button sits beside the bubble */}
                        <div style={{ display: 'flex', flexDirection: isOwn ? 'row' : 'row-reverse', alignItems: 'center', gap: 4 }}>
                          {/* Three-dot menu ââ beside bubble, shown on hover */}
                          {editingId !== item.id && (
                            <div className="opacity-0 group-hover/msg:opacity-100 transition" style={{ position: 'relative', flexShrink: 0 }}>
                              <button onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMenuRect(r); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                                style={{ padding: '4px 6px', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 0, display: 'flex', alignItems: 'center' }}
                                onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.color = C.text1; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.text3; }}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
                              </button>
                              {openMenuId === item.id && menuRect && (
                                <MessageMenu anchorRect={menuRect} isOwn={isOwn} onClose={() => setOpenMenuId(null)}
                                  onReact={(e) => handleReact(item.id, e)}
                                  onReply={(!adminsOnly || myRole === 'admin') ? () => { setReplyTo({ id: item.id, content: item.content, senderName: sender?.name, senderId: sender?.id }); setPrivateReply(null); } : undefined}
                                  onPrivateReply={(!adminsOnly || myRole === 'admin') && !isOwn ? () => { setPrivateReply({ id: item.id, content: item.content, senderName: sender?.name, senderId: sender?.id }); setReplyTo(null); } : undefined}
                                  onPin={() => { if (pinnedMsgs.find(p => p.id === item.id)) handleUnpinMessage(item.id); else setPinTimeModal({ open: true, messageId: item.id, pin_ttl_minutes: '', content: item.content }); }}
                                  pinned={!!pinnedMsgs.find(p => p.id === item.id)} pinDisabled={false}
                                  onEdit={(!adminsOnly || myRole === 'admin') && canEdit ? () => { setEditingId(item.id); setEditText(item.content?.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1') ?? ''); } : undefined}
                                  onDelete={(!adminsOnly || myRole === 'admin') && canDelete ? () => handleDeleteMessage(item.id) : undefined}
                                />
                              )}
                            </div>
                          )}

                          {/* Message bubble */}
                          <div style={{
                            padding: '9px 14px',
                            borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                            background: isOwn ? C.primaryMid : C.raised,
                            border: isOwn ? `1px solid ${C.primary}40` : `1px solid ${C.border}`,
                            fontSize: 14, fontWeight: 300,
                            color: isOwn ? C.primaryHi : C.text1,
                            lineHeight: 1.6, wordBreak: 'break-words',
                          }}>
                            <MessageContent content={item.content} isOwn={isOwn} onFileRef={onFileRef} />
                            {item.edited && <span style={{ fontSize: 10, color: isOwn ? `${C.primary}90` : C.text3, marginLeft: 6 }}>(edited)</span>}
                            {showTimeInBubble && (
                              <span style={{ display: 'block', fontSize: 10, color: isOwn ? `${C.primary}90` : C.text3, fontWeight: 300, marginTop: 4, textAlign: isOwn ? 'right' : 'left' }}>
                                {formatTime(item.created_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* File attachment */}
                        {item.files && <FilePreview file={item.files} />}

                        {/* Reactions */}
                        {Object.keys(reactionMap).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                            {Object.entries(reactionMap).map(([emoji, userIds]) => (
                              <button key={emoji} onClick={() => handleReact(item.id, emoji)}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 12, border: `1px solid ${userIds.includes(user?.id) ? C.primary + '60' : C.border}`, background: userIds.includes(user?.id) ? C.primaryLo : C.raised, color: userIds.includes(user?.id) ? C.primaryHi : C.text2, cursor: 'pointer', transition: 'all 0.1s' }}>
                                <span>{emoji}</span><span style={{ fontSize: 11 }}>{userIds.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                  return els;
                })
              )}
              <div ref={bottomRef}/>
            </div>

            {showScrollBtn && (
              <button onClick={scrollToBottom}
                style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, width: 34, height: 34, borderRadius: '50%', background: C.surface, border: `1px solid ${C.borderHi}`, color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.raised}
                onMouseLeave={e => e.currentTarget.style.background = C.surface}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>
              </button>
            )}
          </div>
          {/* end timeline */}

          {/* -- Input area -- */}
          <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.bg }}>

            {(replyTo || privateReply) && (() => {
              const r = replyTo || privateReply;
              const isPrivate = !!privateReply;
              const displayContent = (r.content || '').replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, 'ðâ $1').slice(0, 60);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 12px', borderRadius: 9, borderLeft: `3px solid `, background: C.surface }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: C.secondary }}>{isPrivate ? 'â© Private reply to ' : 'â© Replying to '}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: C.text2 }}>{r.senderName}</span>
                    <p style={{ fontSize: 11, color: C.text3, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayContent}{(r.content?.length || 0) > 60 ? ' ÂÂ·' : ''}</p>
                  </div>
                  <button onClick={() => { setReplyTo(null); setPrivateReply(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>Ãââ</button>
                </div>
              );
            })()}

            {fileRefs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {fileRefs.map(f => (
                  <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: C.raised, border: `1px solid ${C.border}`, fontSize: 11, color: C.text2 }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill={C.text3}><path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/></svg>
                    <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</span>
                    <button onMouseDown={e => { e.preventDefault(); setFileRefs(prev => prev.filter(r => r.id !== f.id)); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 1, padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = C.danger}
                      onMouseLeave={e => e.currentTarget.style.color = C.text3}>Ãââ</button>
                  </span>
                ))}
              </div>
            )}

            {canSend ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'visible', transition: 'border-color 0.15s', position: 'relative' }}
                onFocusCapture={e => e.currentTarget.style.borderColor = `${C.primary}70`}
                onBlurCapture={e => e.currentTarget.style.borderColor = C.border}>

                {showToolbar && (
                  <div style={{ padding: '8px 12px 0', borderBottom: `1px solid ${C.border}` }}>
                    <FormatToolbar textareaRef={textareaRef} setText={setText} groupId={group?.id}
                      onFilePick={file => setFileRefs(prev => prev.find(f => f.id === file.id) ? prev : [...prev, file])} />
                  </div>
                )}

                {mentionQuery !== null && filteredMembers.length > 0 && (
                  <div ref={mentionListRef}
                    style={{ position: 'absolute', bottom: '100%', left: 0, width: 240, zIndex: 50, background: C.surface, border: `1px solid ${C.borderHi}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.7)', marginBottom: 6 }}>
                    {filteredMembers.map((m, i) => (
                      <button key={m.id} onMouseDown={e => { e.preventDefault(); insertMention(m); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: i === mentionIndex ? C.primaryLo : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}>
                        <span style={{ width: 26, height: 26, borderRadius: 8, background: avatarBg(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials(m.name)}</span>
                        <span style={{ fontSize: 13, fontWeight: 400, color: C.text1, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                        <span style={{ fontSize: 10, color: C.text3, textTransform: 'capitalize', flexShrink: 0 }}>{m.role}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={() => setShowToolbar(v => !v)} title="Attach / Format"
                    style={{ flexShrink: 0, width: 44, alignSelf: 'stretch', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', color: showToolbar ? C.primary : C.text3, transition: 'color 0.15s' }}
                    onMouseEnter={e => { if (!showToolbar) e.currentTarget.style.color = C.text2; }}
                    onMouseLeave={e => { if (!showToolbar) e.currentTarget.style.color = C.text3; }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/></svg>
                  </button>
                  <textarea ref={textareaRef} value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} rows={1}
                    placeholder={connected ? 'Share your thoughts · use @ to mention' : 'Reconnecting ÂÂ·'}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '12px 8px', fontSize: 13, fontWeight: 300, color: C.text1, resize: 'none', fontFamily: 'Inter, sans-serif', minHeight: 46, maxHeight: 130, overflowY: 'auto', boxSizing: 'border-box', lineHeight: 1.5 }}
                    onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px'; }}
                    disabled={!connected} />
                  <button style={{ flexShrink: 0, width: 36, alignSelf: 'stretch', border: 'none', background: 'none', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, opacity: 0.4 }}>ð</button>
                  <div style={{ padding: '8px 8px 8px 0', flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={privateReply ? handlePrivateReply : sendMessage}
                      disabled={(!text.trim() && fileRefs.length === 0) || (!connected && !privateReply)}
                      style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: (text.trim() || fileRefs.length > 0) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (text.trim() || fileRefs.length > 0) ? C.primary : C.raised, color: (text.trim() || fileRefs.length > 0) ? '#181818' : C.text3, transition: 'all 0.15s', flexShrink: 0 }}
                      onMouseEnter={e => { if (text.trim() || fileRefs.length > 0) e.currentTarget.style.background = C.primaryHi; }}
                      onMouseLeave={e => { e.currentTarget.style.background = (text.trim() || fileRefs.length > 0) ? C.primary : C.raised; }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: 12, fontWeight: 300, color: C.text3, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                Only admins can send messages in this group right now
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 6, paddingLeft: 4 }}>
              {Object.keys(typingUsers).length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2].map(i => <span key={i} className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: C.secondary, display: 'inline-block' }}/>)}
                  </div>
                  <span style={{ fontSize: 11, color: C.text3 }}>{Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ fontSize: 10, color: C.text3 }}>â  Return to send</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>â§â  New line</span>
                  <span style={{ fontSize: 10, color: C.text3 }}>@ Mention</span>
                </div>
              )}
            </div>
          </div>
          {/* end input */}

        </div>
        {/* end left column */}

        {/* -- Right sidebar · full height -- */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: `1px solid ${C.border}`, background: C.surface, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* PINNED NOTES */}
          <div style={{ padding: '18px 16px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <svg width="11" height="11" viewBox="0 0 16 16" fill={C.primary}><path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Pinned Notes</span>
            </div>
            {pinnedMsgs.length === 0 ? (
              <p style={{ fontSize: 12, color: C.text3, margin: 0, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.5 }}>No pinned messages</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                {pinnedMsgs.map(pm => (
                  <div key={pm.id} onClick={() => scrollToMessage(pm.id)}
                    style={{ borderRadius: 12, background: '#1A1A1A', border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.primary}`, cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.raised; e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.borderLeftColor = C.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.borderLeftColor = C.primary; }}>
                    <div style={{ padding: '12px 14px 10px' }}>
                      <p style={{ fontSize: 13, color: C.text1, margin: '0 0 2px', lineHeight: 1.5, fontWeight: 300, fontStyle: 'italic', wordBreak: 'break-word' }}>
                        "{pm.content?.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1').replace(/\{\{file:[^}]+\}\}/g, 'ðâ').slice(0, 80)}{(pm.content?.length ?? 0) > 80 ? 'â¦' : ''}"
                      </p>
                      {pm.pin_time && (
                        <p style={{ fontSize: 10, color: C.tertiary, margin: '4px 0 0', fontWeight: 400 }}>{formatPinLabel(pm.pin_time)}</p>
                      )}
                    </div>
                    {myRole === 'admin' && (
                      <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { const r = getRemainingMinutes(pm.pin_time); setPinTimeModal({ open: true, messageId: pm.id, pin_ttl_minutes: r === null ? '' : String(r), content: pm.content }); }}
                          style={{ fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 8, background: 'rgba(192,193,255,0.08)', border: '1px solid rgba(192,193,255,0.15)', color: C.primaryHi, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,193,255,0.16)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(192,193,255,0.08)'}>
                          Expiry
                        </button>
                        <button onClick={() => handleUnpinMessage(pm.id)}
                          style={{ fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#FF6B6B', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}>
                          Unpin
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEARCH IN GROUP */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill={C.primary}><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text1, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Search</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.raised, border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 10px', transition: 'border-color 0.15s' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = `${C.primary}60`}
              onBlurCapture={e => e.currentTarget.style.borderColor = C.border}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill={C.text3} style={{ flexShrink: 0 }}><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/></svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages ÂÂ·"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 300, color: C.text1, fontFamily: 'Inter, sans-serif', minWidth: 0 }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, lineHeight: 0, padding: 0, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = C.text1}
                  onMouseLeave={e => e.currentTarget.style.color = C.text3}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/></svg>
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <p style={{ fontSize: 11, color: C.text3, margin: '8px 0 0', fontWeight: 300 }}>
                {timeline.filter(m => m._kind !== 'system').length} result{timeline.filter(m => m._kind !== 'system').length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* SPACER · pushes invite code to bottom */}
          <div style={{ flex: 1 }} />

          {/* INVITE CODE · pinned to bottom */}
          {isTeacher && group.invite_code && (
            <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px' }}>Invite Code</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: C.primary, letterSpacing: '0.2em' }}>{group.invite_code}</span>
                <button onClick={() => navigator.clipboard.writeText(group.invite_code)}
                  style={{ padding: '5px 12px', borderRadius: 7, background: C.raised, border: `1px solid ${C.borderHi}`, color: C.primaryHi, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.borderHi}
                  onMouseLeave={e => e.currentTarget.style.background = C.raised}>Copy</button>
              </div>
            </div>
          )}
          {adminsOnly && (
            <div style={{ margin: '0 16px 14px', padding: '9px 12px', borderRadius: 9, background: C.tertiaryLo, border: `1px solid ${C.tertiary}30` }}>
              <p style={{ fontSize: 11, color: C.tertiary, margin: 0, fontWeight: 600 }}>Admins only mode</p>
              <p style={{ fontSize: 10, color: `${C.tertiary}80`, margin: '2px 0 0', fontWeight: 300 }}>Only admins can send messages</p>
            </div>
          )}

        </div>
        {/* end right sidebar */}

      </div>
      {/* end outer row */}

    </div>
  );
}
