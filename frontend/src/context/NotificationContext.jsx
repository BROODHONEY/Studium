import { createContext, useContext, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ activeGroupId, children }) {
  const { socket } = useSocket();
  const { user }   = useAuth();
  const activeGroupRef = useRef(activeGroupId);

  // Keep ref in sync so the socket listener always sees the latest value
  useEffect(() => { activeGroupRef.current = activeGroupId; }, [activeGroupId]);

  // Request permission once on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg) => {
      // Don't notify if the user is already looking at this group
      if (msg.group_id === activeGroupRef.current) return;
      // Don't notify for own messages
      const sender = msg.users || msg.sender;
      if (sender?.id === user.id) return;
      if (Notification.permission !== 'granted') return;

      const senderName = sender?.name || 'Someone';
      const body = msg.content?.slice(0, 80) || '📎 Sent a file';

      new Notification(`${senderName}`, {
        body,
        icon: '/favicon.svg',
        tag: msg.id, // prevents duplicate notifications
      });
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, user]);

  return (
    <NotificationContext.Provider value={null}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
