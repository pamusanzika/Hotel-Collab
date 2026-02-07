import React, { createContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

export const SocketContext = createContext(null);

const SOCKET_URL =
  process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setUnreadCount(0);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Fetch initial unread count
  useEffect(() => {
    if (!user) return;
    api
      .get('/chat/unread-count')
      .then(({ data }) => setUnreadCount(data.unreadCount))
      .catch(() => {});
  }, [user]);

  const decrementUnread = useCallback(
    (count) => setUnreadCount((prev) => Math.max(0, prev - count)),
    []
  );

  return (
    <SocketContext.Provider
      value={{ socket, unreadCount, setUnreadCount, decrementUnread }}
    >
      {children}
    </SocketContext.Provider>
  );
};
