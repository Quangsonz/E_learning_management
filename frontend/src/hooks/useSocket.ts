import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { QueryClient } from '@tanstack/react-query';
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

/**
 * useSocket — manages Socket.IO connection and realtime notification state.
 * @param queryClient  Optional React Query client. When provided, incoming
 *                     socket notifications will invalidate relevant query caches
 *                     so UI updates without a manual refresh.
 */
export const useSocket = (queryClient?: QueryClient) => {
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
        // Socket connection established
      });

      newSocket.on('new_notification', (data: Notification) => {
        setNotifications((prev) => [data, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Phase 2: Invalidate server-state caches that depend on notification data.
        // This keeps the notifications list and dashboard summary fresh in real time.
        if (queryClient) {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['student-dashboard-summary'] });

          // Certificate notifications: refresh certificate list immediately
          if (data.type === 'certificate') {
            queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
          }
          // Course-related notifications: refresh enrollment/progress state
          if (data.type === 'course') {
            queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
          }
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, token, queryClient]);

  return { socket, notifications, unreadCount, setUnreadCount, setNotifications };
};
