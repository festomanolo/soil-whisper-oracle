// Override Capacitor native toast/notification plugins to force custom NotificationBar usage in APK
import { Capacitor } from '@capacitor/core';

// Override native toast functionality
export const overrideNativeToasts = () => {
  // Only apply overrides when running on native platforms (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    
    // Override any potential native toast calls
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    
    // Intercept console methods that might trigger native toasts
    console.log = (...args) => {
      originalConsoleLog(...args);
      // Don't show native toasts for console.log
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      // Redirect warnings to our custom notification system
      if (args.length > 0 && typeof args[0] === 'string') {
        const event = new CustomEvent('show-notification', { 
          detail: { message: args[0], type: 'warning' } 
        });
        window.dispatchEvent(event);
      }
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      // Redirect errors to our custom notification system
      if (args.length > 0 && typeof args[0] === 'string') {
        const event = new CustomEvent('show-notification', { 
          detail: { message: args[0], type: 'error' } 
        });
        window.dispatchEvent(event);
      }
    };

    // Override any window.alert calls
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      // Redirect alerts to our custom notification system instead of native popup
      const event = new CustomEvent('show-notification', { 
        detail: { message: message || 'Alert', type: 'info' } 
      });
      window.dispatchEvent(event);
      
      // Don't call the original alert to prevent native popup
      // originalAlert(message);
    };

    // Override window.confirm to use our notification system
    const originalConfirm = window.confirm;
    window.confirm = (message: string) => {
      // Show our custom notification instead of native confirm dialog
      const event = new CustomEvent('show-notification', { 
        detail: { message: message || 'Confirm', type: 'warning' } 
      });
      window.dispatchEvent(event);
      
      // Return true by default (you might want to implement a proper confirm dialog later)
      return true;
    };

    // Disable any potential Capacitor Toast plugin if it exists
    try {
      // @ts-ignore - Capacitor Toast plugin might not be typed
      if (window.Capacitor?.Plugins?.Toast) {
        const originalToastShow = window.Capacitor.Plugins.Toast.show;
        window.Capacitor.Plugins.Toast.show = (options: any) => {
          // Redirect to our custom notification system
          const event = new CustomEvent('show-notification', { 
            detail: { 
              message: options.text || options.message || 'Notification', 
              type: 'info' 
            } 
          });
          window.dispatchEvent(event);
          
          // Don't call the original native toast
          // return originalToastShow(options);
          return Promise.resolve();
        };
      }
    } catch (error) {
      console.log('Toast plugin override not needed or failed:', error);
    }

    console.log('✅ Native toast overrides applied - all notifications will use custom NotificationBar');
  }
};

// Call this function to apply all overrides
export const initializeNotificationOverrides = () => {
  // Apply overrides immediately
  overrideNativeToasts();
  
  // Also apply when device is ready (for Capacitor)
  document.addEventListener('deviceready', overrideNativeToasts, false);
  
  // Apply when Capacitor is ready
  if (Capacitor.isNativePlatform()) {
    Capacitor.Plugins.Device?.getInfo().then(() => {
      overrideNativeToasts();
    }).catch(() => {
      // Fallback if Device plugin is not available
      overrideNativeToasts();
    });
  }
};