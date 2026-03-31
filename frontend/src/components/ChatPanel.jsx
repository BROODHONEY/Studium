import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messagesAPI, groupsAPI } from '../services/api';
import MessageMenu from './ui/MessageMenu';
import ConfirmDialog from './ui/ConfirmDialog';
import MessageContent from './ui/MessageContent';
import FormatToolbar from './ui/FormatToolbar';
import { formatTime, getDateLabel } from '../utils/time';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatPanel({ group, onViewProfile, onFileRef, highlightMessageId, onHighlightClear }) {
  const { user }   = useAuth();
  const { socket, connected } = useSocket();

  const [messages, setMessages]     = useState([]);
  const [text, setText]             = useState('');
  const mentionsRef = useRef({}); // { '@Name': '@[Name](id)' } — populated on mention insert
  const [loading, setLoading]       = useState(true);
  const [adminsOnly, setAdminsOnly] = useState(false);
  const [pinnedMsgs, setPinnedMsgs] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch]   = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: { name, timer } }

  // ── @mention state ──────────────────────────────────
  const [members, setMembers]           = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null); // null = closed, string = filter
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionStartRef                 = useRef(null); // caret position where @ was typed
  const mentionListRef                  = useRef(null);

  // ── File reference state ─────────────────────────────
  const [fileRefs, setFileRefs] = useState([]); // [{ id, filename, file_url, file_type }]

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const highlightTimeoutRef = useRef(null);
  const messageRefs = useRef(new Map()); // messageId -> HTMLElement

  const [pinTimeModal, setPinTimeModal] = useState({
    open: false,
    messageId: null,
    pin_ttl_minutes: '',
    content: ''
  });

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const bottomRef        = useRef(null);
  const textareaRef      = useRef(null);
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

  const [editingId, setEditingId]         = useState(null);
  const [editText, setEditText]           = useState('');
  const [openMenuId, setOpenMenuId]       = useState(null); // three-dot menu
  const [menuRect, setMenuRect]           = useState(null);
  // reply_to: { id, content, senderName, senderId }
  const [replyTo, setReplyTo]             = useState(null);
  const [privateReply, setPrivateReply]   = useState(null); // same shape, but sends as DM
  const [deleteConfirm, setDeleteConfirm] = useState(null); // messageId to delete

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
      .then(res => {
        setAdminsOnly(res.data.admins_only || false);
        setMembers(res.data.members || []);
      })
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
    socket.off('message_edited');
    socket.off('message_reaction');

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

    socket.on('message_edited', ({ messageId, content }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, edited: true } : m));
    });

    socket.on('message_reaction', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_reactions: reactions } : m));
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
      socket.off('message_edited');
      socket.off('message_reaction');
    };
  }, [group?.id, socket]);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => { setOpenMenuId(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  // Auto-scroll to a specific message when navigated from search
  useEffect(() => {
    if (!highlightMessageId || loading) return;
    const attempt = (tries) => {
      if (tries <= 0) return;
      const el = messageRefs.current.get(highlightMessageId);
      if (!el) { setTimeout(() => attempt(tries - 1), 200); return; }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(highlightMessageId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
        onHighlightClear?.();
      }, 2000);
    };
    attempt(8);
  }, [highlightMessageId, loading]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (highlightMessageId) return; // don't override search navigation
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
    if ((!text.trim() && fileRefs.length === 0) || !socket || !connected || !canSend) return;
    const fileTokens = fileRefs.map(f => `{{file:${f.id}:${f.filename}:${f.file_url}}}`).join(' ');
    const encoded = encodeForSend(text.trim());
    const content = [encoded, fileTokens].filter(Boolean).join(' ');
    socket.emit('send_message', {
      groupId: group.id,
      content,
      type: 'text',
      ...(replyTo ? { replyTo: replyTo.id } : {})
    });
    setText(''); mentionsRef.current = {}; setFileRefs([]);
    setReplyTo(null);
    clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    socket.emit('typing_stop', { groupId: group.id });
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handlePrivateReply = async () => {
    if (!privateReply || (!text.trim() && fileRefs.length === 0)) return;
    try {
      const fileTokens = fileRefs.map(f => `{{file:${f.id}:${f.filename}:${f.file_url}}}`).join(' ');
      const encoded = encodeForSend(text.trim());
      const content = [encoded, fileTokens].filter(Boolean).join(' ');
      await messagesAPI.replyPrivate({
        targetUserId: privateReply.senderId,
        content,
        quotedContent: privateReply.content,
        quotedSenderName: privateReply.senderName,
        groupId: group?.id,
        groupName: group?.name,
      });
      setText(''); mentionsRef.current = {}; setFileRefs([]);
      setPrivateReply(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = (messageId) => {
    setDeleteConfirm(messageId);
  };

  const confirmDelete = async () => {
    const messageId = deleteConfirm;
    setDeleteConfirm(null);
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await messagesAPI.delete(messageId);
    } catch {
      messagesAPI.list(group.id).then(res => setMessages(res.data)).catch(console.error);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) return;
    try {
      await messagesAPI.edit(messageId, editText.trim());
      // socket event will update state
    } catch (err) {
      console.error(err);
    } finally {
      setEditingId(null);
      setEditText('');
    }
  };

  const handleReact = async (messageId, emoji) => {
    setOpenMenuId(null);
    try {
      await messagesAPI.react(messageId, emoji);
      // socket event will update state
    } catch (err) {
      console.error(err);
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
    // Navigate mention popover
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex(i => (i + 1) % filteredMembers.length); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex(i => (i - 1 + filteredMembers.length) % filteredMembers.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filteredMembers[mentionIndex]); return; }
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (privateReply) handlePrivateReply();
      else sendMessage();
    }
    if (e.key === 'Escape') {
      setReplyTo(null);
      setPrivateReply(null);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    // If text is cleared, reset mentions map
    if (!val) mentionsRef.current = {};

    // Detect @mention trigger
    const pos = e.target.selectionStart;
    const textUpToCaret = val.slice(0, pos);
    const mentionMatch = textUpToCaret.match(/@(\w*)$/);
    if (mentionMatch) {
      mentionStartRef.current = pos - mentionMatch[0].length;
      setMentionQuery(mentionMatch[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }

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

  const filteredMembers = mentionQuery !== null
    ? members
        .map(m => m.users)
        .filter(u => u && u.id !== user?.id && u.name?.toLowerCase().includes(mentionQuery))
        .slice(0, 6)
    : [];

  // Replace @Name display tokens with @[Name](id) for storage
  const encodeForSend = (t) => {
    let out = t;
    for (const [display, encoded] of Object.entries(mentionsRef.current)) {
      out = out.split(display).join(encoded);
    }
    return out;
  };

  const insertMention = (member) => {
    const caretPos = textareaRef.current?.selectionStart ?? mentionStartRef.current;
    const before = text.slice(0, mentionStartRef.current);
    const after  = text.slice(caretPos);
    const displayToken = `@${member.name}`;
    const encodedToken = `@[${member.name}](${member.id})`;
    mentionsRef.current[displayToken] = encodedToken;

    const newText = before + displayToken + ' ' + after;
    setText(newText);
    setMentionQuery(null);

    setTimeout(() => {
      if (textareaRef.current) {
        const pos = before.length + displayToken.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  // formatTime imported from utils/time

  const initials = (name) =>
    name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const avatarColors = [
    'bg-indigo-600', 'bg-teal-600', 'bg-purple-600',
    'bg-pink-600',   'bg-amber-600', 'bg-green-600'
  ];
  const avatarColor = (name) =>
    avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

  if (!group) return (
    <div className="flex-1 flex items-center justify-center dark:bg-surface bg-gray-50">
      <p className="dark:text-gray-600 text-gray-400 text-sm">Select a group to start chatting</p>
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
            className="max-w-xs rounded-xl border dark:border-surface-3 border-gray-200 hover:opacity-90 transition cursor-pointer"
            style={{ maxHeight: 200, objectFit: 'cover' }}/>
        </a>
      );
    }
    return (
      <a href={file.file_url} target="_blank" rel="noreferrer"
        className="mt-1.5 flex items-center gap-2.5 px-3 py-2.5 dark:bg-surface-4/50 bg-gray-200/50 dark:border-surface-4/50 border-gray-300/50 border rounded-xl dark:hover:bg-surface-4 hover:bg-gray-200 transition max-w-xs">
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', position: 'relative' }}>
      {/* Subtle purple accent — top-right corner */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete message"
        description="This message will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Pin time modal (teacher only) */}
      {pinTimeModal.open && (() => {
        const PRESETS = [
          { label: '1 hour',    value: '60' },
          { label: '8 hours',   value: '480' },
          { label: '24 hours',  value: '1440' },
          { label: 'Until removed', value: '' },
        ];
        const isCustom = !PRESETS.some(p => p.value === pinTimeModal.pin_ttl_minutes);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' })}>
          <div className="card w-full max-w-xs mx-4 p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <p className="text-sm font-semibold dark:text-white text-gray-900 mb-1">Pin message</p>
              <p className="text-xs dark:text-gray-500 text-gray-500 mb-4">How long should this stay pinned?</p>

              <div className="space-y-2">
                {PRESETS.map(p => (
                  <button key={p.label}
                    onClick={() => setPinTimeModal(s => ({ ...s, pin_ttl_minutes: p.value }))}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition border
                      ${pinTimeModal.pin_ttl_minutes === p.value && !isCustom
                        ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                        : 'dark:bg-surface-3/60 bg-gray-100 dark:border-surface-4/50 border-gray-200 dark:text-gray-300 text-gray-700 dark:hover:bg-surface-3 hover:bg-gray-200 dark:hover:border-surface-4 hover:border-gray-300'}`}>
                    {p.label}
                    {p.value && <span className="text-gray-500 text-xs ml-1.5">({Number(p.value) >= 60 ? `${Number(p.value)/60}h` : `${p.value}m`})</span>}
                  </button>
                ))}

                {/* Custom option */}
                  <button
                  onClick={() => setPinTimeModal(s => ({ ...s, pin_ttl_minutes: isCustom ? s.pin_ttl_minutes : '30' }))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition border
                    ${isCustom
                      ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                      : 'dark:bg-surface-3/60 bg-gray-100 dark:border-surface-4/50 border-gray-200 dark:text-gray-300 text-gray-700 dark:hover:bg-surface-3 hover:bg-gray-200'}`}>
                  Custom time
                </button>

                {isCustom && (
                  <div className="flex items-center gap-2 px-1">
                    <input
                      autoFocus
                      type="number"
                      min="1"
                      step="1"
                      value={pinTimeModal.pin_ttl_minutes}
                      onChange={e => setPinTimeModal(s => ({ ...s, pin_ttl_minutes: e.target.value }))}
                      className="flex-1 dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-300 border rounded-lg px-3 py-2
                        text-sm dark:text-white text-gray-900 focus:outline-none focus:border-brand-500"
                      placeholder="Minutes"
                    />
                    <span className="text-xs dark:text-gray-500 text-gray-400 flex-shrink-0">minutes</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' })}
                  className="flex-1 py-2 rounded-xl dark:bg-surface-3 bg-gray-100 dark:hover:bg-surface-4 hover:bg-gray-200 dark:text-gray-300 text-gray-700 text-sm transition">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const { messageId, pin_ttl_minutes, content } = pinTimeModal;
                    setPinTimeModal({ open: false, messageId: null, pin_ttl_minutes: '', content: '' });
                    await handlePinWithTime(messageId, pin_ttl_minutes, content);
                    scrollToMessage(messageId);
                  }}
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition"
                  disabled={!pinTimeModal.messageId}>
                  Pin
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Admins only banner */}
      {adminsOnly && (
        <div style={{ margin: '10px 16px 0', padding: '8px 14px', borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(167,139,250,0.7)', flexShrink: 0 }}>
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 300, color: 'rgba(167,139,250,0.8)' }}>Admins only — only admins can send messages</span>
        </div>
      )}

      {/* Connection status */}
      {socket && !connected && (
        <div className="mx-4 mt-2 px-4 py-2 dark:bg-surface-3/60 bg-gray-100 dark:border-surface-4/60 border-gray-200 border rounded-lg dark:text-gray-300 text-gray-600 text-xs text-center flex-shrink-0">
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
            className="w-full flex items-center gap-2 px-3 py-2 dark:bg-surface-2/60 bg-gray-100 dark:border-surface-3/70 border-gray-200 border rounded-lg text-brand-400 text-xs dark:hover:bg-surface-2/80 hover:bg-gray-200 transition cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z"/>
            </svg>
            <span className="flex-1 min-w-0 text-left">
              <span className="block truncate">
                {pinnedMsgs[0]?.content}
              </span>
              {pinnedMsgs[0]?.pin_time && (
                <span className="block text-[11px] dark:text-gray-400 text-gray-500 mt-0.5">
                  {formatPinLabel(pinnedMsgs[0]?.pin_time)}
                </span>
              )}
            </span>
            <span className="text-brand-400/60 flex-shrink-0">{pinnedMsgs.length} pinned</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPinned(v => !v); }}
              className="p-1 rounded dark:hover:bg-surface-3/60 hover:bg-gray-200/60 transition flex-shrink-0"
              title={showPinned ? 'Hide pinned' : 'Show pinned'}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"
                className={`transition-transform ${showPinned ? 'rotate-180' : ''}`}>
                <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
              </svg>
            </button>
          </div>
          {showPinned && (
            <div className="mt-1 dark:bg-surface-2 bg-white dark:border-surface-3 border-gray-200 border rounded-lg divide-y dark:divide-surface-3 divide-gray-100 overflow-hidden">
              {pinnedMsgs.map(pm => (
                <div
                  key={pm.id}
                  className="px-3 py-2 text-xs dark:text-gray-300 text-gray-700 flex items-start gap-2 dark:hover:bg-surface-3/20 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => scrollToMessage(pm.id)}
                >
                  <span className="flex-1 min-w-0 leading-relaxed">
                    <span className="block truncate">{pm.content}</span>
                    {pm.pin_time && (
                      <span className="block text-[11px] dark:text-gray-500 text-gray-400 mt-0.5">
                        {formatPinLabel(pm.pin_time)}
                      </span>
                    )}
                  </span>
                  {myRole === 'admin' && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          const remaining = getRemainingMinutes(pm.pin_time);
                          setPinTimeModal({ open: true, messageId: pm.id, pin_ttl_minutes: remaining === null ? '' : String(remaining), content: pm.content });
                        }}
                        className="dark:text-gray-300 text-gray-700 dark:hover:text-white hover:text-gray-900 transition text-[11px] px-2 py-1 rounded dark:bg-surface-3/50 bg-gray-100 dark:border-surface-4 border-gray-200 border"
                        title="Set expiry duration">
                        Set
                      </button>
                      <button
                        onClick={() => handleUnpinMessage(pm.id)}
                        className="dark:text-gray-600 text-gray-400 hover:text-red-400 transition flex-shrink-0 mt-0.5"
                        title="Unpin">
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
              {timeline.filter(m => m._kind !== 'system').length} result{timeline.filter(m => m._kind !== 'system').length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Timeline + scroll button */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-y-auto px-4 py-3 space-y-2" style={{ background: 'transparent', height: '100%' }}>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full dark:bg-surface-3 bg-gray-200 animate-pulse flex-shrink-0"/>
                <div className="space-y-2 flex-1">
                  <div className="h-3 dark:bg-surface-3 bg-gray-200 rounded animate-pulse w-20"/>
                  <div className="h-10 dark:bg-surface-3 bg-gray-200 rounded-xl animate-pulse w-48"/>
                </div>
              </div>
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="dark:text-gray-600 text-gray-400 text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          timeline.flatMap((item, i) => {
            const label = item.created_at ? getDateLabel(item.created_at) : null;
            const prevLabel = i > 0 && timeline[i-1].created_at ? getDateLabel(timeline[i-1].created_at) : null;
            const showSep = label && label !== prevLabel;
            const els = [];
            if (showSep) els.push(
              <div key={`sep-${item.id}`} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px dark:bg-surface-3 bg-gray-200"/>
                <span className="chat-system-msg text-xs dark:text-gray-500 text-gray-400 dark:bg-surface-1 bg-white px-3 py-1 rounded-full dark:border-surface-3/40 border-gray-200 border select-none flex-shrink-0">
                  {label}
                </span>
                <div className="flex-1 h-px dark:bg-surface-3 bg-gray-200"/>
              </div>
            );

            // ── System message ──────────────────────────────
            if (item._kind === 'system') {
              els.push(
                <div key={item.id} className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px dark:bg-surface-3 bg-gray-200"/>
                  <span className={`chat-system-msg text-xs px-3 py-1 rounded-full flex-shrink-0 select-none
                    ${item.subtype === 'kick'
                      ? 'text-red-400/70 bg-red-500/5 border border-red-500/10'
                      : item.subtype === 'leave'
                      ? 'text-orange-400/70 bg-orange-500/5 border border-orange-500/10'
                      : 'dark:text-gray-600 text-gray-400 dark:bg-surface-3/50 bg-gray-100 dark:border-surface-4/30 border-gray-200 border'}`}>
                    {item.content}
                  </span>
                  <div className="flex-1 h-px dark:bg-surface-3 bg-gray-200"/>
                </div>
              );
              return els;
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
            const canEdit   = isOwn && item.type !== 'system';

            // Role-based name color
            const nameColor = sender?.role === 'admin'
              ? 'text-neon-yellow'
              : sender?.role === 'teacher'
              ? 'text-neon-cyan'
              : isOwn
              ? 'text-brand-400'
              : 'text-green-400';

            // Group reactions: { emoji -> [userIds] }
            const reactionMap = {};
            (item.message_reactions || []).forEach(r => {
              if (!reactionMap[r.emoji]) reactionMap[r.emoji] = [];
              reactionMap[r.emoji].push(r.user_id);
            });

            // Show sender name only when sender changes
            const prevItem = i > 0 ? timeline[i - 1] : null;
            const prevSender = prevItem?._kind !== 'system' ? (prevItem?.users || prevItem?.sender) : null;
            const showSenderName = !prevSender || prevSender.id !== sender?.id;

            els.push(
              <div
                key={item.id}
                id={`message-${item.id}`}
                ref={(el) => {
                  if (el) messageRefs.current.set(item.id, el);
                  else messageRefs.current.delete(item.id);
                }}
                className={`flex gap-2.5 items-start group/msg ${isOwn ? 'flex-row-reverse' : ''}`}
                style={{ maxWidth: '100%' }}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 mt-0.5">
                  {showSenderName ? (
                    <button
                      onClick={() => onViewProfile?.(sender?.id)}
                      className={`chat-avatar w-8 h-8 rounded-full flex items-center justify-center
                        text-xs font-semibold text-white
                        ${avatarColor(sender?.name)} hover:ring-2 hover:ring-white/20 transition`}>
                      {initials(sender?.name)}
                    </button>
                  ) : null}
                </div>

                {/* Bubble group */}
                <div className={`flex flex-col min-w-0 ${isOwn ? 'items-end' : 'items-start'}`} style={{ maxWidth: 'min(65%, 480px)', flex: '1 1 0', minWidth: 0 }}>

                  {/* Sender name — only for others, only on first of a run */}
                  {!isOwn && showSenderName && (
                    <span className={`chat-sender-name text-xs font-semibold mb-1 ${nameColor}`}>
                      {senderName}
                    </span>
                  )}

                  {/* Bubble + actions */}
                  <div className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <textarea
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditMessage(item.id); }
                            if (e.key === 'Escape') { setEditingId(null); setEditText(''); }
                          }}
                          rows={2}
                          className="dark:bg-surface-3 bg-gray-100 border border-brand-500 rounded-xl px-3 py-2
                            text-sm dark:text-white text-gray-900 resize-none focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <button onClick={() => handleEditMessage(item.id)}
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
                      <div className={`chat-bubble px-3 py-2 rounded-xl text-sm leading-relaxed break-words
                        ${isOwn
                          ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white'
                          : 'dark:bg-surface-3 bg-gray-200 dark:text-gray-100 text-gray-900'}
                        ${highlightedMessageId === item.id ? 'ring-2 ring-brand-400/70 shadow-[0_0_0_3px_rgba(168,85,247,0.15)]' : ''}`}>
                        {/* Replied-to preview */}
                        {item.replied_message && (
                          <button
                            onClick={() => scrollToMessage(item.replied_message.id)}
                            className={`block w-full text-left mb-2 px-2 py-1.5 rounded-lg border-l-2 text-xs
                              ${isOwn
                                ? 'bg-brand-700/50 border-brand-300/50 text-brand-200'
                                : 'dark:bg-surface-4/60 bg-gray-200/60 dark:border-gray-500 border-gray-300 dark:text-gray-300 text-gray-600'}`}>
                            <span className="font-medium block truncate">
                              {item.replied_message.users?.name || 'Unknown'}
                            </span>
                            <span className="opacity-70 truncate block">
                              {item.replied_message.content?.slice(0, 80)}{item.replied_message.content?.length > 80 ? '…' : ''}
                            </span>
                          </button>
                        )}
                        <MessageContent content={item.content} isOwn={isOwn} onFileRef={onFileRef} />
                        {item.edited && <span className="text-xs opacity-40 ml-1">(edited)</span>}
                        {item.files && <FilePreview file={item.files} />}
                        {/* Timestamp row — always on its own line, right-aligned */}
                        <div className={`flex justify-end mt-0.5 -mb-0.5
                          ${isOwn ? 'text-brand-200/70' : 'dark:text-gray-500 text-gray-400'}`}>
                          <span className="chat-timestamp text-[10px] leading-none select-none">
                            {formatTime(item.created_at)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Three-dot menu */}
                    {editingId !== item.id && (
                      <div className="relative opacity-0 group-hover/msg:opacity-100 transition flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setMenuRect(r); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                          className="p-1.5 rounded-lg dark:text-gray-600 text-gray-400 dark:hover:text-gray-300 hover:text-gray-600 dark:hover:bg-surface-3 hover:bg-gray-200 transition"
                          title="Message actions">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                          </svg>
                        </button>
                        {openMenuId === item.id && menuRect && (
                          <MessageMenu
                            anchorRect={menuRect}
                            isOwn={isOwn}
                            onClose={() => setOpenMenuId(null)}
                            onReact={(e) => handleReact(item.id, e)}
                            onReply={(!adminsOnly || myRole === 'admin')
                              ? () => { setReplyTo({ id: item.id, content: item.content, senderName: sender?.name, senderId: sender?.id }); setPrivateReply(null); }
                              : undefined}
                            onPrivateReply={(!adminsOnly || myRole === 'admin') && !isOwn
                              ? () => { setPrivateReply({ id: item.id, content: item.content, senderName: sender?.name, senderId: sender?.id }); setReplyTo(null); }
                              : undefined}
                            onEdit={(!adminsOnly || myRole === 'admin') && canEdit
                              ? () => { setEditingId(item.id); setEditText(item.content); }
                              : undefined}
                            onDelete={(!adminsOnly || myRole === 'admin') && canDelete
                              ? () => handleDeleteMessage(item.id)
                              : undefined}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reactions */}
                  {Object.keys(reactionMap).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                      {Object.entries(reactionMap).map(([emoji, userIds]) => (
                        <button key={emoji}
                          onClick={() => handleReact(item.id, emoji)}
                          className={`chat-reaction flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition
                            ${userIds.includes(user?.id)
                              ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                              : 'dark:bg-surface-3 bg-gray-100 dark:border-surface-4 border-gray-200 dark:text-gray-400 text-gray-600 dark:hover:border-surface-4 hover:border-gray-300'}`}>
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
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
          <button
            onClick={scrollToBottom}
            style={{
              position: 'absolute', bottom: 16, right: 16, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: '#18181b', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
            onMouseLeave={e => e.currentTarget.style.background = '#18181b'}
            title="Scroll to bottom"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Typing indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="px-5 pb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 dark:bg-gray-500 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
              <span className="w-1.5 h-1.5 dark:bg-gray-500 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
              <span className="w-1.5 h-1.5 dark:bg-gray-500 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
            </div>
            <span className="text-xs dark:text-gray-500 text-gray-400">
              {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing
            </span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1c1c1c', flexShrink: 0, background: '#000000' }}>

        {/* Reply / private reply banner */}
        {(replyTo || privateReply) && (() => {
          const r = replyTo || privateReply;
          const isPrivate = !!privateReply;
          const displayContent = (r.content || '')
            .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
            .replace(/\{\{file:[^}]+:([^:}]+):[^}]+\}\}/g, '📎 $1')
            .slice(0, 60);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 12px', borderRadius: 8, borderLeft: '2px solid rgba(124,58,237,0.5)', background: isPrivate ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.04)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(124,58,237,0.8)' }}>{isPrivate ? 'Private reply to ' : '↩ Replying to '}</span>
                <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>{r.senderName}</span>
                <span style={{ fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.3)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayContent}{(r.content?.length || 0) > 60 ? '…' : ''}</span>
              </div>
              <button onClick={() => { setReplyTo(null); setPrivateReply(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
          );
        })()}

        {/* Attached file pills */}
        {fileRefs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {fileRefs.map(f => (
              <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: '#111111', border: '1px solid #1c1c1c', fontSize: 11, fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
                </svg>
                <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</span>
                <button onMouseDown={e => { e.preventDefault(); setFileRefs(prev => prev.filter(r => r.id !== f.id)); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', lineHeight: 1, padding: 0, marginLeft: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>×</button>
              </span>
            ))}
          </div>
        )}

        {canSend ? (
          <div style={{ background: '#111111', border: '1px solid #1c1c1c', borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.15s' }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = '#1c1c1c'}>

            {/* Format toolbar — toggled */}
            {showToolbar && (
              <div style={{ padding: '8px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <FormatToolbar textareaRef={textareaRef} setText={setText} groupId={group?.id}
                  onFilePick={file => setFileRefs(prev => prev.find(f => f.id === file.id) ? prev : [...prev, file])} />
              </div>
            )}

            {/* Mention popover */}
            <div style={{ position: 'relative' }}>
              {mentionQuery !== null && filteredMembers.length > 0 && (
                <div ref={mentionListRef}
                  style={{ position: 'absolute', bottom: '100%', left: 0, width: 220, zIndex: 50, background: '#111111', border: '1px solid #1c1c1c', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', marginBottom: 4 }}>
                  {filteredMembers.map((m, i) => (
                    <button key={m.id} onMouseDown={e => { e.preventDefault(); insertMention(m); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: i === mentionIndex ? 'rgba(124,58,237,0.15)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
                        {m.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.75)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.25)', textTransform: 'capitalize', flexShrink: 0 }}>{m.role}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Single row: toggle | textarea | send */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {/* Toolbar toggle */}
                <button
                  onClick={() => setShowToolbar(v => !v)}
                  title="Formatting"
                  style={{ flexShrink: 0, width: 40, alignSelf: 'stretch', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', background: 'none', color: showToolbar ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.25)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
                  onMouseEnter={e => { if (!showToolbar) e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                  onMouseLeave={e => { if (!showToolbar) e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M10.121 2.879A3 3 0 0 0 5 5v.585l-2.122 2.122A1 1 0 0 0 3 8.5V10a1 1 0 0 0 1 1h1v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1V8.5a1 1 0 0 0-.293-.707L9 5.585V5a3 3 0 0 0-.879-2.121zM6.5 5a1.5 1.5 0 1 1 3 0v.5H6.5V5z"/>
                  </svg>
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={connected ? 'Type a message… use @ to mention' : 'Reconnecting…'}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '11px 12px', fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.8)', resize: 'none', fontFamily: 'Inter, sans-serif', minHeight: 44, maxHeight: 130, overflowY: 'auto', boxSizing: 'border-box' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px'; }}
                  disabled={!connected}
                />

                {/* Send button */}
                <button
                  onClick={privateReply ? handlePrivateReply : sendMessage}
                  disabled={(!text.trim() && fileRefs.length === 0) || (!connected && !privateReply)}
                  style={{ flexShrink: 0, width: 40, alignSelf: 'stretch', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', cursor: (text.trim() || fileRefs.length > 0) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', background: 'none', color: (text.trim() || fileRefs.length > 0) ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.15)' }}
                  onMouseEnter={e => { if (text.trim() || fileRefs.length > 0) e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = (text.trim() || fileRefs.length > 0) ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.15)'; }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.25)' }}>
            Only admins can send messages in this group right now
          </div>
        )}
      </div>

    </div>
  );
}