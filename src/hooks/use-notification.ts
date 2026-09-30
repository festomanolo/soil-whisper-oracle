import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

// Custom hook that replaces native toast functionality
// This ensures all notifications use our custom NotificationBar instead of native popups
export const useNotification = () => {
  const { showNotification, hideNotification } = useContext(NotificationContext);

  // Override native toast methods to use our custom notification system
  const toast = {
    success: (message: string) => showNotification(message, 'success'),
    error: (message: string) => showNotification(message, 'error'),
    warning: (message: string) => showNotification(message, 'warning'),
    info: (message: string) => showNotification(message, 'info'),
    // Default toast method
    show: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => 
      showNotification(message, type),
  };

  return {
    toast,
    showNotification,
    hideNotification,
  };
};

// Export a global toast function that can be used anywhere
export const toast = {
  success: (message: string) => {
    // This will work if NotificationContext is available
    const event = new CustomEvent('show-notification', { 
      detail: { message, type: 'success' } 
    });
    window.dispatchEvent(event);
  },
  error: (message: string) => {
    const event = new CustomEvent('show-notification', { 
      detail: { message, type: 'error' } 
    });
    window.dispatchEvent(event);
  },
  warning: (message: string) => {
    const event = new CustomEvent('show-notification', { 
      detail: { message, type: 'warning' } 
    });
    window.dispatchEvent(event);
  },
  info: (message: string) => {
    const event = new CustomEvent('show-notification', { 
      detail: { message, type: 'info' } 
    });
    window.dispatchEvent(event);
  },
};