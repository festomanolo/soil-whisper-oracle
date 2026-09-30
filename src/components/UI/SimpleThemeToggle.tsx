import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Sun, Moon, Monitor, Search, BarChart3 } from 'lucide-react';

// Theme options
type ThemeOption = 'light' | 'dark' | 'system';

// Time settings interface
interface TimeSettings {
  darkStart: string; // 24-hour format "HH:MM"
  darkEnd: string;   // 24-hour format "HH:MM"
}

// Global interval ID for time-based theme
let timeBasedThemeInterval: number | null = null;

interface SimpleThemeToggleProps {
  onToggle?: () => void;
}

const SimpleThemeToggle: React.FC<SimpleThemeToggleProps> = ({ onToggle }) => {
  // Theme state
  const [theme, setTheme] = useState<ThemeOption>('system');
  // UI states
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Time settings
  const [timeSettings, setTimeSettings] = useState<TimeSettings>({
    darkStart: '19:00',
    darkEnd: '07:00'
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  // Only set overflow hidden when dropdown is open
  useEffect(() => {
    if (showDropdown) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDropdown]);

  // When dropdown opens, set its position near the button
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8, // 8px below
        left: rect.right + window.scrollX - 288 // align right, width 288px (w-72)
      });
    }
  }, [showDropdown]);

  // Initialize theme on mount
  useEffect(() => {
    // Get saved theme preference
    const savedTheme = localStorage.getItem('theme') as ThemeOption;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // Apply theme immediately
    applyTheme(savedTheme || 'system');

    // Set up click outside handler
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.theme-toggle')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      // Clear any time-based interval
      if (timeBasedThemeInterval !== null) {
        clearInterval(timeBasedThemeInterval);
        timeBasedThemeInterval = null;
      }
    };
  }, []);

  // Open the time-based modal when theme changes to 'time-based' and dropdown is closed
  useEffect(() => {
    if (theme === 'time-based' && !showDropdown) {
      setShowTimeModal(true);
    }
  }, [theme, showDropdown]);

  // Apply theme based on selection
  const applyTheme = (newTheme: ThemeOption) => {
    console.log(`Applying theme: ${newTheme}`);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Clear any existing interval
    if (timeBasedThemeInterval !== null) {
      clearInterval(timeBasedThemeInterval);
      timeBasedThemeInterval = null;
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
        setupTimeBasedInterval();
        break;
    }
    
    applyThemeClass(isDark);
  };

  // Set up interval for time-based theme
  const setupTimeBasedInterval = () => {
    // Check every minute if we need to switch themes
    timeBasedThemeInterval = window.setInterval(() => {
      console.log("Time-based theme check");
      if (localStorage.getItem('theme') === 'time-based') {
        const isDark = isInDarkTimeRange();
        console.log(`Time-based theme check: ${isDark ? 'dark' : 'light'}`);
        applyThemeClass(isDark);
      } else {
        // If no longer using time-based, clear interval
        if (timeBasedThemeInterval !== null) {
          clearInterval(timeBasedThemeInterval);
          timeBasedThemeInterval = null;
        }
      }
    }, 10000); // Check every 10 seconds for testing (change to 60000 for production)
  };

  // Apply theme class to document
  const applyThemeClass = (dark: boolean) => {
    console.log(`Applying theme class: ${dark ? 'dark' : 'light'}`);
    if (dark) {
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
    const [startHour, startMinute] = timeSettings.darkStart.split(':').map(Number);
    const [endHour, endMinute] = timeSettings.darkEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    console.log(`Current time: ${currentHour}:${currentMinute}, Dark period: ${startHour}:${startMinute} - ${endHour}:${endMinute}`);
    
    // Check if dark period crosses midnight
    if (startTime > endTime) {
      // Example: dark from 19:00 to 07:00
      const isDark = currentTime >= startTime || currentTime <= endTime;
      console.log(`Dark period crosses midnight, isDark: ${isDark}`);
      return isDark;
    } else {
      // Example: dark from 22:00 to 06:00
      const isDark = currentTime >= startTime && currentTime <= endTime;
      console.log(`Dark period within same day, isDark: ${isDark}`);
      return isDark;
    }
  };

  // Save time settings
  const saveTimeSettings = () => {
    console.log(`Saving time settings: ${JSON.stringify(timeSettings)}`);
    localStorage.setItem('timeSettings', JSON.stringify(timeSettings));
    
    // Apply theme if using time-based
    if (theme === 'time-based') {
      const isDark = isInDarkTimeRange();
      applyThemeClass(isDark);
      
      // Reset interval with new settings
      if (timeBasedThemeInterval !== null) {
        clearInterval(timeBasedThemeInterval);
      }
      setupTimeBasedInterval();
    }
    
    setShowTimeModal(false);
  };

  // Handle search analysis
  const handleSearchAnalysis = (type?: string) => {
    setShowDropdown(false);
    
    if (type) {
      // Handle predefined search types
      switch (type) {
        case 'recent':
          window.location.href = '/recent-analysis?filter=recent';
          break;
        case 'high-ph':
          window.location.href = '/recent-analysis?filter=high-ph';
          break;
        case 'low-nutrients':
          window.location.href = '/recent-analysis?filter=low-nutrients';
          break;
        default:
          window.location.href = '/recent-analysis';
      }
    } else if (searchQuery.trim()) {
      // Handle custom search query
      window.location.href = `/recent-analysis?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery('');
    } else {
      // Default to recent analysis page
      window.location.href = '/recent-analysis';
    }
  };

  // Get icon for current theme
  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun size={20} className="text-lime-400" />;
      case 'dark': return <Moon size={20} className="text-emerald-700" />;
      case 'system': return <Monitor size={20} className="text-primary" />;
    }
  };

  return (
    <>
      <div className="relative theme-toggle">
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background hover:bg-accent transition-colors"
          title="Theme Settings"
          aria-label="Theme Settings"
          type="button"
        >
          {getThemeIcon()}
        </button>
        {/* Theme Selection Dropdown with Backdrop (Portal) */}
        {showDropdown && dropdownPos && ReactDOM.createPortal(
          <>
            {/* Dropdown modal, fixed position near button */}
            <div
              className="fixed w-72 rounded-2xl theme-dropdown-enhanced z-[9999999] animate-fade-in-down bg-white dark:bg-card shadow-xl border"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <div className="py-3 rounded-2xl">
                {/* Search Analysis Section */}
                <div className="px-3 pb-3 mb-3 border-b border-black/5 dark:border-white/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Search Analysis</p>
                  
                  {/* Search Input */}
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={14} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          handleSearchAnalysis();
                        }
                      }}
                      placeholder="Search soil reports..."
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white/50 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                  </div>
                  
                  {/* Quick Search Actions */}
                  <div className="space-y-1">
                    <button
                      onClick={() => handleSearchAnalysis('recent')}
                      className="flex items-center px-2 py-1.5 text-xs w-full text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 rounded-md"
                    >
                      <BarChart3 size={12} className="text-emerald-500 mr-2" />
                      Recent Analysis
                    </button>
                    <button
                      onClick={() => handleSearchAnalysis('high-ph')}
                      className="flex items-center px-2 py-1.5 text-xs w-full text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 rounded-md"
                    >
                      <BarChart3 size={12} className="text-lime-500 mr-2" />
                      High pH Reports
                    </button>
                    <button
                      onClick={() => handleSearchAnalysis('low-nutrients')}
                      className="flex items-center px-2 py-1.5 text-xs w-full text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 rounded-md"
                    >
                      <BarChart3 size={12} className="text-lime-700 mr-2" />
                      Low Nutrient Reports
                    </button>
                  </div>
                </div>

                <div className="px-3 pb-2 mb-2 border-b border-black/5 dark:border-white/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Theme</p>
                </div>
                
                <button
                  onClick={() => {
                    applyTheme('light');
                    setShowDropdown(false);
                    if (onToggle) onToggle();
                  }}
                  className={`flex items-center px-4 py-3 text-sm w-full text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 rounded-xl mx-2 ${theme === 'light' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/30 mr-3">
                    <Sun size={16} className="text-lime-600 dark:text-lime-400" />
                  </div>
                  <div>
                    <div className="font-medium">Light</div>
                    <div className="text-xs text-muted-foreground">Bright appearance</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    applyTheme('dark');
                    setShowDropdown(false);
                    if (onToggle) onToggle();
                  }}
                  className={`flex items-center px-4 py-3 text-sm w-full text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 rounded-xl mx-2 ${theme === 'dark' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mr-3">
                    <Moon size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-medium">Dark</div>
                    <div className="text-xs text-muted-foreground">Dark appearance</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    applyTheme('system');
                    setShowDropdown(false);
                    if (onToggle) onToggle();
                  }}
                  className={`flex items-center px-4 py-3 text-sm w-full text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 rounded-xl mx-2 ${theme === 'system' ? 'bg-black/10 dark:bg-white/10' : ''}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 mr-3">
                    <Monitor size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium">System</div>
                    <div className="text-xs text-muted-foreground">Match system setting</div>
                  </div>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
      

    </>
  );
};

export default SimpleThemeToggle; 