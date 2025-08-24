'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  loading: (title: string, description?: string) => string;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2
};

const notificationStyles = {
  success: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  loading: 'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100'
};

function NotificationComponent({ 
  notification, 
  onRemove 
}: { 
  notification: Notification; 
  onRemove: (id: string) => void; 
}) {
  const Icon = notificationIcons[notification.type];

  useEffect(() => {
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, notification.persistent, onRemove]);

  return (
    <div
      className={cn(
        "relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 animate-in slide-in-from-right-full",
        notificationStyles[notification.type]
      )}
    >
      <Icon 
        className={cn(
          "h-5 w-5 flex-shrink-0 mt-0.5",
          notification.type === 'loading' && "animate-spin"
        )} 
      />
      <div className="flex-1 space-y-1">
        <h4 className="font-medium text-sm">{notification.title}</h4>
        {notification.description && (
          <p className="text-sm opacity-90">{notification.description}</p>
        )}
        {notification.action && (
          <Button
            variant="outline"
            size="sm"
            onClick={notification.action.onClick}
            className="mt-2 h-8 text-xs"
          >
            {notification.action.label}
          </Button>
        )}
      </div>
      {!notification.persistent && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(notification.id)}
          className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? (notification.type === 'error' ? 7000 : 5000)
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, ...updates } : notification
    ));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return addNotification({ type: 'success', title, description });
  }, [addNotification]);

  const error = useCallback((title: string, description?: string) => {
    return addNotification({ type: 'error', title, description, duration: 7000 });
  }, [addNotification]);

  const warning = useCallback((title: string, description?: string) => {
    return addNotification({ type: 'warning', title, description });
  }, [addNotification]);

  const info = useCallback((title: string, description?: string) => {
    return addNotification({ type: 'info', title, description });
  }, [addNotification]);

  const loading = useCallback((title: string, description?: string) => {
    return addNotification({ type: 'loading', title, description, persistent: true });
  }, [addNotification]);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      updateNotification,
      success,
      error,
      warning,
      info,
      loading,
      clear
    }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
        {notifications.map(notification => (
          <NotificationComponent
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// Utility functions for common notification patterns
export const notificationUtils = {
  fileSaved: (fileName: string) => ({
    type: 'success' as const,
    title: 'File Saved',
    description: `${fileName} has been saved successfully`,
    duration: 3000
  }),

  fileError: (fileName: string, error: string) => ({
    type: 'error' as const,
    title: 'File Error',
    description: `Failed to save ${fileName}: ${error}`
  }),

  aiGenerating: () => ({
    type: 'loading' as const,
    title: 'AI Generating',
    description: 'Please wait while AI generates your code...',
    persistent: true
  }),

  aiSuccess: () => ({
    type: 'success' as const,
    title: 'Code Generated',
    description: 'AI has successfully generated your code'
  }),

  aiError: (error: string) => ({
    type: 'error' as const,
    title: 'AI Error',
    description: error
  }),

  connectionError: () => ({
    type: 'error' as const,
    title: 'Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection.'
  }),

  settingsSaved: () => ({
    type: 'success' as const,
    title: 'Settings Saved',
    description: 'Your preferences have been updated',
    duration: 3000
  }),

  copied: (item: string = 'Content') => ({
    type: 'info' as const,
    title: 'Copied',
    description: `${item} copied to clipboard`,
    duration: 2000
  }),

  projectCreated: (name: string) => ({
    type: 'success' as const,
    title: 'Project Created',
    description: `${name} has been created successfully`
  }),

  terminalCommand: (command: string) => ({
    type: 'info' as const,
    title: 'Command Executed',
    description: `Executed: ${command}`,
    duration: 3000
  })
};
