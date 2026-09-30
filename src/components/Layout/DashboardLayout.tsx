import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Leaf, Wifi, WifiOff } from 'lucide-react';
import { useMboleaT } from '../../i18n/mbolea';
import Navigation from './Navigation';
import useSwipeNavigation from '../../hooks/useSwipeNavigation';
import PageTransition from '../UI/PageTransition';
import { useSensorData } from '../../context/SensorDataContext';
import NotificationBar from '../UI/NotificationBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // Define the routes in order for swipe navigation
  const routes = ['/', '/soil-health', '/recommendations', '/mbolea', '/recent-analysis', '/settings'];
  
  // Initialize swipe navigation
  useSwipeNavigation(routes);

  const m = useMboleaT();

  // Get ESP32 connection status
  const { isConnected } = useSensorData();

  // Custom blinking state for slow blink (every 3 seconds)
  const [showStatus, setShowStatus] = useState(true);
  const blinkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setShowStatus(true);
      if (blinkInterval.current) clearInterval(blinkInterval.current);
      blinkInterval.current = setInterval(() => {
        setShowStatus((prev) => !prev);
      }, 3000);
    } else {
      setShowStatus(true);
      if (blinkInterval.current) {
        clearInterval(blinkInterval.current);
        blinkInterval.current = null;
      }
    }
    return () => {
      if (blinkInterval.current) clearInterval(blinkInterval.current);
    };
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - static, always visible, with ESP32 status */}
      <header className="border-b border-border py-3 animate-fade-in sticky top-0 z-50 bg-white/95 dark:bg-card/95 backdrop-blur-md shadow-sm rounded-b-2xl">
        <div className="flex items-center justify-between gap-3 px-4">
          <div className="flex items-center min-w-0">
            <div className="bg-primary/15 p-1.5 rounded-full mr-2.5 flex-shrink-0">
              <Leaf size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate">{m.appName}</h1>
              <p className="text-[11px] text-muted-foreground leading-none truncate">{m.tagline}</p>
            </div>
          </div>
          {(isConnected || showStatus) && (
            <div
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${
                isConnected
                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isConnected ? m.connected : m.notConnected}</span>
            </div>
          )}
        </div>
      </header>
      
      {/* Notification Bar - below header */}
      <NotificationBar />

      {/* Main content with smooth scroll */}
      <main className="container mx-auto py-6 px-4 pb-24 animate-fade-in-up scroll-smooth overflow-hidden">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default DashboardLayout;

