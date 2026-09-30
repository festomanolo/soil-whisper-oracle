import React, { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Clock } from 'lucide-react';
import ModalPortal from './ModalPortal';

// Theme options
type ThemeOption = 'light' | 'dark' | 'system' | 'time-based';

interface TimeBasedThemeSettings {
  darkStart: string; // 24-hour format: "HH:MM"
  darkEnd: string;   // 24-hour format: "HH:MM"
}

const ThemeToggle = () => {
  // State for theme mode
  const [themeMode, setThemeMode] = useState<ThemeOption>('system');
  // State for dropdown visibility
  const [showDropdown, setShowDropdown] = useState(false);
  // State for time settings modal
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  // Time settings
  const [timeSettings, setTimeSettings] = useState<TimeBasedThemeSettings>({
    darkStart: '19:00',
    darkEnd: '07:00'
  });

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeOption;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }

    const savedTimeSettings = localStorage.getItem('timeSettings');
    if (savedTimeSettings) {
      try {
        setTimeSettings(JSON.parse(savedTimeSettings));
      } catch (e) {
        console.error('Failed to parse time settings');
      }
    }

    // Apply theme on initial load
    applyTheme(savedTheme || 'system');

    // Set up click outside listener to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-toggle-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Set up system theme change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (themeMode === 'system') {
        applyThemeClass(mediaQuery.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
      
      // Clear any time-based interval
      if (window.themeIntervalId) {
        clearInterval(window.themeIntervalId);
      }
    };
  }, []);

  // Apply theme class to document
  const applyThemeClass = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  // Check if current time is in dark mode range
  const isInDarkTimeRange = (): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    
    // Parse time settings
    const [darkStartHour, darkStartMinute] = timeSettings.darkStart.split(':').map(Number);
    const [darkEndHour, darkEndMinute] = timeSettings.darkEnd.split(':').map(Number);
    
    const darkStartTime = darkStartHour * 60 + darkStartMinute;
    const darkEndTime = darkEndHour * 60 + darkEndMinute;
    
    // Check if dark period crosses midnight
    if (darkStartTime > darkEndTime) {
      // Example: dark from 19:00 to 07:00
      return currentTime >= darkStartTime || currentTime <= darkEndTime;
    } else {
      // Example: dark from 22:00 to 06:00
      return currentTime >= darkStartTime && currentTime <= darkEndTime;
    }
  };

  // Apply theme based on selection
  const applyTheme = (newTheme: ThemeOption) => {
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Clear any existing interval
    if (window.themeIntervalId) {
      clearInterval(window.themeIntervalId);
      window.themeIntervalId = undefined;
    }
    
    // Determine if dark mode should be applied
    let isDark = false;
    
    switch (newTheme) {
      case 'dark':
        isDark = true;
        break;
      case 'light':
        isDark = false;
        break;
      case 'system':
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        break;
      case 'time-based':
        isDark = isInDarkTimeRange();
        // Set up interval for time-based theme
        window.themeIntervalId = window.setInterval(() => {
          applyThemeClass(isInDarkTimeRange());
        }, 60000); // Check every minute
        break;
    }
    
    applyThemeClass(isDark);
  };

  // Handle time settings change
  const handleTimeSettingsChange = (field: keyof TimeBasedThemeSettings, value: string) => {
    const newSettings = { ...timeSettings, [field]: value };
    setTimeSettings(newSettings);
    localStorage.setItem('timeSettings', JSON.stringify(newSettings));
    
    // Update theme if using time-based
    if (themeMode === 'time-based') {
      applyThemeClass(isInDarkTimeRange());
    }
  };

  // Get icon based on current theme mode
  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return <Sun size={20} className="text-lime-400" />;
      case 'dark': return <Moon size={20} className="text-emerald-700" />;
      case 'system': return <Monitor size={20} className="text-primary" />;
      case 'time-based': return <Clock size={20} className="text-primary" />;
    }
  };

  return (
    <div className="relative theme-toggle-container">
    <button
        onClick={() => setShowDropdown(!showDropdown)}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-background hover:bg-accent transition-colors"
        title="Theme Settings"
      >
        {getThemeIcon()}
      </button>
      
      {/* Theme Selection Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border z-50">
          <div className="py-1 rounded-md bg-card shadow-xs">
            <button
              onClick={() => {
                applyTheme('light');
                setShowDropdown(false);
              }}
              className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-muted/50 ${themeMode === 'light' ? 'bg-muted' : ''}`}
            >
              <Sun size={16} className="mr-2 text-lime-400" />
              Light
            </button>
            <button
              onClick={() => {
                applyTheme('dark');
                setShowDropdown(false);
              }}
              className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-muted/50 ${themeMode === 'dark' ? 'bg-muted' : ''}`}
            >
              <Moon size={16} className="mr-2 text-emerald-700" />
              Dark
            </button>
            <button
              onClick={() => {
                applyTheme('system');
                setShowDropdown(false);
              }}
              className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-muted/50 ${themeMode === 'system' ? 'bg-muted' : ''}`}
            >
              <Monitor size={16} className="mr-2 text-primary" />
              System
            </button>
            <button
              onClick={() => {
                applyTheme('time-based');
                setShowDropdown(false);
                setShowTimeSettings(true);
              }}
              className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-muted/50 ${themeMode === 'time-based' ? 'bg-muted' : ''}`}
            >
              <Clock size={16} className="mr-2 text-primary" />
              Time-based
            </button>
          </div>
        </div>
      )}
      
      {/* Time Settings Modal */}
      <ModalPortal isOpen={showTimeSettings}>
        <div 
          className="fixed inset-0 tahoe-modal-backdrop flex items-center justify-center z-50 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTimeSettings(false);
            }
          }}
        >
          <div 
            className="tahoe-glass rounded-lg shadow-lg p-6 w-80 border border-white/30 animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium mb-4">Time-based Theme Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="darkStart">Dark Mode Start</label>
                <input 
                  id="darkStart"
                  type="time" 
                  value={timeSettings.darkStart}
                  onChange={(e) => handleTimeSettingsChange('darkStart', e.target.value)}
                  className="w-full p-2 rounded-md bg-muted/80 border border-border backdrop-blur-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">When dark theme activates</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="darkEnd">Dark Mode End</label>
                <input 
                  id="darkEnd"
                  type="time" 
                  value={timeSettings.darkEnd}
                  onChange={(e) => handleTimeSettingsChange('darkEnd', e.target.value)}
                  className="w-full p-2 rounded-md bg-muted/80 border border-border backdrop-blur-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">When light theme activates</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowTimeSettings(false)}
                className="px-4 py-2 bg-primary/90 text-primary-foreground rounded-md hover:bg-primary backdrop-blur-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};

// Add themeIntervalId to Window interface
declare global {
  interface Window {
    themeIntervalId?: number;
  }
}

export default ThemeToggle;
