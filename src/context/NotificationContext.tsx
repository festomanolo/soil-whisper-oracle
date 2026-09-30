import React, { createContext, useState, ReactNode } from 'react';

interface Notification {
  message: string;
  visible: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notification: Notification;
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hideNotification: () => void;
}

export const NotificationContext = createContext<NotificationContextType>({
  notification: { message: '', visible: false, type: 'info' },
  showNotification: () => {},
  hideNotification: () => {},
});

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification>({
    message: '',
    visible: false,
    type: 'info'
  });

  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setNotification({ message, visible: true, type });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  // Listen for global notification events to intercept native toast calls
  React.useEffect(() => {
    const handleShowNotification = (event: CustomEvent) => {
      const { message, type } = event.detail;
      showNotification(message, type);
    };

    window.addEventListener('show-notification', handleShowNotification as EventListener);
    
    return () => {
      window.removeEventListener('show-notification', handleShowNotification as EventListener);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}; 