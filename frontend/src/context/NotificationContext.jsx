import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { announcementsAPI, duesAPI } from '../services/api';

const NotificationContext = createContext(null);

// Per-user localStorage key for last-seen timestamp per group
const lastSeenKey     = (userId, groupId) => `ann_seen_${userId}_${groupId}`;
const lastSeenDueKey  = (userId, groupId) => `due_seen_${userId}_${groupId}`;

const getLastSeen = (userId, groupId, key = lastSeenKey) => {
  try { return localStorage.getItem(key(userId, groupId)) || '1970-01-01'; }
  catch { return '1970-01-01'; }
};
const setLastSeen = (userId, groupId, ts, key = lastSeenKey) => {
  try { localStorage.setItem(key(userId, groupId), ts); } catch {}
};

export function NotificationProvider({ activeGroupId, activeConvoId, groups, children }) {
  const { socket } = useSocket();
  const { user }   = useAuth();

  const activeGroupRef = useRef(activeGroupId);
  const groupsRef      = useRef(groups);

  useEffect(() => { activeGroupRef.current = activeGroupId; }, [activeGroupId]);
  useEffect(() => { groupsRef.current = groups; }, [groups]);

  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread]         = useState(false);

  const add = useCallback((n) => {
    setNotifications(prev => {
      // Deduplicate by groupId + type + title
      const dup = prev.find(p => p.groupId === n.groupId && p.type === n.type && p.title === n.title);
      if (dup) return prev;
      return [{ ...n, id: Date.now() + Math.random(), at: n.at || new Date() }, ...prev].slice(0, 50);
    });
    setHasUnread(true);
  }, []);

  const markRead = useCallback(() => setHasUnread(false), []);
  const clear    = useCallback(() => { setNotifications([]); setHasUnread(false); }, []);
  const dismiss  = useCallback((id) => setNotifications(prev => prev.filter(n => n.id !== id)), []);

  // ── On login: fetch missed announcements + dues for all groups ──
  useEffect(() => {
    if (!user?.id || !groups?.length) return;

    const fetchMissed = async () => {
      for (const group of groups) {
        try {
          // Announcements
          const annRes = await announcementsAPI.list(group.id);
          const announcements = annRes.data || [];
          const annLastSeen = getLastSeen(user.id, group.id, lastSeenKey);

          announcements
            .filter(a => {
              if (!a.published) return false;
              if (a.users?.id === user.id) return false;
              const createdMs = new Date(a.created_at.endsWith('Z') ? a.created_at : a.created_at + 'Z').getTime();
              return createdMs > new Date(annLastSeen).getTime();
            })
            .forEach(a => add({
              type: 'announcement',
              title: `New announcement in ${group.name}`,
              body: a.title || a.content?.slice(0, 60) || 'New announcement',
              groupId: group.id, groupName: group.name,
              at: new Date(a.created_at),
            }));
        } catch { /* skip */ }

        try {
          // Dues
          const dueRes = await duesAPI.list(group.id);
          const dues = dueRes.data || [];
          const dueLastSeen = getLastSeen(user.id, group.id, lastSeenDueKey);

          dues
            .filter(d => {
              if (d.users?.id === user.id) return false;
              const createdMs = new Date(d.created_at.endsWith('Z') ? d.created_at : d.created_at + 'Z').getTime();
              return createdMs > new Date(dueLastSeen).getTime();
            })
            .forEach(d => add({
              type: 'due',
              title: `New due date in ${group.name}`,
              body: d.title || 'New due date added',
              groupId: group.id, groupName: group.name,
              at: new Date(d.created_at),
            }));
        } catch { /* skip */ }
      }
    };

    fetchMissed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, groups?.length]);

  // ── Update last-seen when user views a group ──
  useEffect(() => {
    if (!activeGroupId || !user?.id) return;
    const now = new Date().toISOString();
    setLastSeen(user.id, activeGroupId, now, lastSeenKey);
    setLastSeen(user.id, activeGroupId, now, lastSeenDueKey);
    // Remove all notifications for this group when it becomes active
    setNotifications(prev => prev.filter(n => n.groupId !== activeGroupId));
  }, [activeGroupId, user?.id]);

  // ── Browser notification permission ──
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Live socket events ──
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg) => {
      if (msg.type === 'system') return;
      if (msg.group_id === activeGroupRef.current) return;
      const sender = msg.users || msg.sender;
      if (sender?.id === user.id) return;

      const group = groupsRef.current?.find(g => g.id === msg.group_id);
      const groupName = group?.name || 'a group';
      const senderName = sender?.name || 'Someone';
      const body = msg.content?.slice(0, 80) || '📎 Sent a file';

      add({ type: 'message', title: `${senderName} in ${groupName}`, body, groupId: msg.group_id, groupName });

      if (Notification.permission === 'granted') {
        new Notification(senderName, { body, icon: '/favicon.svg', tag: msg.id });
      }
    };

    const handleNewAnnouncement = (a) => {
      const group = groupsRef.current?.find(g => g.id === a.group_id);
      const groupName = group?.name;
      if (!groupName) return;
      if (a.users?.id === user.id) return; // own announcement

      const title = `New announcement in ${groupName}`;
      const body  = a.title || a.content?.slice(0, 60) || 'New announcement';
      add({ type: 'announcement', title, body, groupId: a.group_id, groupName });

      // Update last-seen so we don't show it again on next login
      if (user?.id) setLastSeen(user.id, a.group_id, new Date().toISOString());

      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg', tag: `ann-${a.id}` });
      }
    };

    const handleNewDue = (d) => {
      const group = groupsRef.current?.find(g => g.id === d.group_id);
      const groupName = group?.name;
      if (!groupName) return;
      if (d.users?.id === user.id) return; // own due

      const title = `New due date in ${groupName}`;
      const body  = d.title || 'New due date added';
      add({ type: 'due', title, body, groupId: d.group_id, groupName });

      if (user?.id) setLastSeen(user.id, d.group_id, new Date().toISOString(), lastSeenDueKey);

      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg', tag: `due-${d.id}` });
      }
    };

    const handleNewFile = (f) => {
      if (f.group_id === activeGroupRef.current) return;
      if (f.uploaded_by === user.id) return;
      const group = groupsRef.current?.find(g => g.id === f.group_id);
      const groupName = group?.name;
      if (!groupName) return;

      const title = `New file in ${groupName}`;
      const body  = f.file?.filename || 'A file was uploaded';
      add({ type: 'file', title, body, groupId: f.group_id, groupName });

      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg', tag: `file-${f.file?.id}` });
      }
    };

    socket.on('new_message',      handleNewMessage);
    socket.on('new_announcement', handleNewAnnouncement);
    socket.on('new_due',          handleNewDue);
    socket.on('new_file',         handleNewFile);
    return () => {
      socket.off('new_message',      handleNewMessage);
      socket.off('new_announcement', handleNewAnnouncement);
      socket.off('new_due',          handleNewDue);
      socket.off('new_file',         handleNewFile);
    };
  }, [socket, user, add]);

  // Set of groupIds that have unread activity (messages, announcements, dues)
  const groupUnreads = new Set(notifications.map(n => n.groupId).filter(Boolean));

  return (
    <NotificationContext.Provider value={{ notifications, hasUnread, markRead, clear, dismiss, groupUnreads }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
