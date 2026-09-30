import React, { useContext, useState, useEffect } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { X, Check, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const NotificationBar = () => {
  const { notification, hideNotification } = useContext(NotificationContext);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.visible) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [notification.visible]);

  const handleHide = () => {
    setIsExiting(true);
    setTimeout(() => {
      hideNotification();
      setIsVisible(false);
      setIsExiting(false);
    }, 300);
  };

  if (!notification.visible && !isVisible) {
    return null;
  }

  const getNotificationStyles = (type: string = 'info') => {
    const baseStyles = 'bg-white dark:bg-card border-b border-border shadow-lg';
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-4 border-l-foliage text-foliage-dark`;
      case 'warning':
        return `${baseStyles} border-l-4 border-l-nutrient-potassium text-nutrient-potassium`;
      case 'error':
        return `${baseStyles} border-l-4 border-l-nutrient-ph-acidic text-nutrient-ph-acidic`;
      default:
        return `${baseStyles} border-l-4 border-l-primary text-primary`;
    }
  };

  const getNotificationIcon = (type: string = 'info') => {
    const iconClass = "h-4 w-4 mr-3 drop-shadow-sm";
    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'error':
        return <AlertCircle className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  return (
    <div 
      className={`
        ${getNotificationStyles(notification.type)} 
        px-6 py-4 relative z-40
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting 
          ? 'translate-y-0 opacity-100 scale-100' 
          : '-translate-y-full opacity-0 scale-95'
        }
      `}
      style={{
        animation: isVisible && !isExiting 
          ? 'slideInFromTop 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
          : isExiting 
          ? 'slideOutToTop 0.3s cubic-bezier(0.4, 0, 1, 1)' 
          : 'none'
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center flex-1 pr-6">
          <div className="animate-pulse-subtle">
            {getNotificationIcon(notification.type)}
          </div>
          <p className="text-sm font-medium tracking-wide drop-shadow-sm">
            {notification.message}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleHide}
            className="
              group inline-flex items-center px-4 py-2 
              bg-primary hover:bg-primary/90 active:bg-primary/80
              text-primary-foreground border border-primary/20 hover:border-primary/30
              rounded-lg text-xs font-semibold tracking-wide
              transition-all duration-200 ease-out
              transform hover:scale-105 active:scale-95
              shadow-md hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
            "
            style={{
              animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both'
            }}
          >
            <Check className="h-3 w-3 mr-2 transition-transform duration-200 group-hover:scale-110" />
            <span>OK</span>
          </button>
          
          <button
            onClick={handleHide}
            className="
              group p-2 
              hover:bg-muted active:bg-muted/80
              text-muted-foreground hover:text-foreground
              border border-border hover:border-border/80
              rounded-lg transition-all duration-200 ease-out
              transform hover:scale-105 active:scale-95
              shadow-sm hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
            "
            aria-label="Close notification"
            style={{
              animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both'
            }}
          >
            <X className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90" />
          </button>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <style jsx>{`
        @keyframes slideInFromTop {
          0% {
            transform: translateY(-100%) scale(0.95);
            opacity: 0;
          }
          60% {
            transform: translateY(8px) scale(1.02);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideOutToTop {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100%) scale(0.95);
            opacity: 0;
          }
        }
        
        @keyframes fadeInScale {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotificationBar; 