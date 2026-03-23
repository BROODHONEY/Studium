import { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';

const OnlineContext = createContext(new Set());

export const OnlineProvider = ({ children }) => {
  const { socket } = useSocket();
  const [onlineIds, setOnlineIds] = useState(new Set());

  useEffect(() => {
    if (!socket) return;

    socket.on('user_online', ({ userId }) => {
      setOnlineIds(prev => new Set([...prev, userId]));
    });

    socket.on('user_offline', ({ userId }) => {
      setOnlineIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket]);

  return (
    <OnlineContext.Provider value={onlineIds}>
      {children}
    </OnlineContext.Provider>
  );
};

export const useOnline = () => useContext(OnlineContext);