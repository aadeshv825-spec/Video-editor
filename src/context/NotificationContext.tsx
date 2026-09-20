import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type NotificationCategory = 'ai' | 'render' | 'backup' | 'subscription' | 'sync' | 'system';

export interface StudioNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionPayload?: string;
}

interface NotificationContextType {
  notifications: StudioNotification[];
  unreadCount: number;
  activeToast: StudioNotification | null;
  addNotification: (params: {
    category: NotificationCategory;
    title: string;
    message: string;
    actionLabel?: string;
    actionPayload?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'ai_creative_studio_notifications_v1';

const DEFAULT_NOTIFICATIONS: StudioNotification[] = [
  {
    id: 'notif-init-1',
    category: 'system',
    title: 'Welcome to AI Creative Studio v1.0',
    message: 'All studio engines, cloud sync services and non-destructive versioning are active.',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: 'notif-init-2',
    category: 'subscription',
    title: 'Trial Credits Ready',
    message: 'Your account has 1,500 complimentary AI credits ready for video, photo, and voice synthesis.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
  }
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<StudioNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [activeToast, setActiveToast] = useState<StudioNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn(e);
    }
  }, [notifications]);

  const addNotification = useCallback(
    ({
      category,
      title,
      message,
      actionLabel,
      actionPayload,
    }: {
      category: NotificationCategory;
      title: string;
      message: string;
      actionLabel?: string;
      actionPayload?: string;
    }) => {
      const newNotif: StudioNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        actionLabel,
        actionPayload,
      };

      setNotifications(prev => [newNotif, ...prev.slice(0, 49)]); // Keep last 50
      setActiveToast(newNotif);

      // Auto dismiss toast after 4.5 seconds
      setTimeout(() => {
        setActiveToast(curr => (curr?.id === newNotif.id ? null : curr));
      }, 4500);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToast,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
