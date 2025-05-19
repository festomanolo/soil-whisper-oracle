
import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

const MobileStatusBar = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [battery, setBattery] = useState<number | null>(null);

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Try to get battery info if available
    if ('getBattery' in navigator) {
      // @ts-ignore - Not all browsers support this API
      navigator.getBattery().then((batteryManager: any) => {
        setBattery(batteryManager.level * 100);
        
        batteryManager.addEventListener('levelchange', () => {
          setBattery(batteryManager.level * 100);
        });
      }).catch(() => {
        console.log('Battery API not supported');
      });
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return (
    <div className="px-4 py-2 bg-primary/10 text-xs flex items-center justify-between">
      <div className="flex items-center">
        <Smartphone size={14} className="mr-2" />
        <span>AgriOracle</span>
      </div>
      
      <div className="flex items-center space-x-3">
        <span className={`inline-flex items-center ${isOnline ? 'text-primary' : 'text-destructive'}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-destructive'} mr-1`}></span>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        
        {battery !== null && (
          <div className="flex items-center">
            <div className="w-6 h-3 border border-current rounded-sm mr-1 relative">
              <div 
                className="absolute top-0 left-0 bottom-0 bg-primary transition-all duration-300" 
                style={{ width: `${Math.max(5, battery)}%` }}
              ></div>
              <div className="absolute top-0 right-[-3px] bottom-0 w-1 border-r border-y border-current rounded-r-sm"></div>
            </div>
            <span>{Math.round(battery)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileStatusBar;
