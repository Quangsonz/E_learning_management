import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectAccessToken, selectIsAuthenticated } from '../store/slices/authSlice';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const useSocket = () => {
  const token = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(SOCKET_URL, {
        auth: { token }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
      });

      newSocket.on('new_notification', (data: Notification) => {
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  return { socket, notifications, unreadCount, setUnreadCount, setNotifications };
};
