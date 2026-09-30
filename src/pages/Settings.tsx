import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import SimpleThemeToggle from '../components/UI/SimpleThemeToggle';
import { SensorDataProvider } from '../context/SensorDataContext';
import { Settings as SettingsIcon, Moon, Sun, Wifi, Globe, Bell, Database, Monitor } from 'lucide-react';
import { addScrollRevealToPage } from '../utils/scrollReveal';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

const Settings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [animating, setAnimating] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<typeof theme | null>(null);
  const { lang, setLang } = useLanguage();
  const t = translations[lang];

  // Dramatic theme switch animation
  const handleThemeChange = (newTheme: typeof theme) => {
    setAnimating(true);
    setPendingTheme(newTheme);
    setTimeout(() => {
      setTheme(newTheme);
      setAnimating(false);
      setPendingTheme(null);
    }, 600); // Animation duration
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else if (theme === 'system') {
      // Follow system
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes if 'system' is selected
  useEffect(() => {
    if (theme !== 'system') return;
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Initialize scroll reveal when component mounts
  useEffect(() => {
    const cleanup = addScrollRevealToPage();
    return cleanup;
  }, []);

  return (
    <SensorDataProvider>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold mb-2 reveal-on-scroll">{t.settings}</h1>
          <p className="text-muted-foreground mb-6 reveal-on-scroll">{t.configure}</p>
          
          {/* Remove the standalone theme toggle at the top */}
          {/* Place the theme toggle as the first item inside the App Settings card */}
          <div className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 reveal-on-scroll">
            <div className="flex items-center mb-4">
              <SettingsIcon className="mr-2" size={20} />
              <h2 className="text-lg font-semibold">{t.appSettings}</h2>
            </div>
            <div className="space-y-4 stagger-animation">
              {/* Language Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg reveal-on-scroll-left">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    <Globe size={18} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t.language}</h3>
                    <p className="text-sm text-muted-foreground">{t.chooseLanguage}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-lg font-medium border ${lang === 'en' ? 'bg-primary text-white border-primary' : 'bg-background border-muted'}`}
                    onClick={() => setLang('en')}
                    type="button"
                  >
                    {t.english}
                  </button>
                  <button
                    className={`px-3 py-1 rounded-lg font-medium border ${lang === 'sw' ? 'bg-primary text-white border-primary' : 'bg-background border-muted'}`}
                    onClick={() => setLang('sw')}
                    type="button"
                  >
                    {t.swahili}
                  </button>
                </div>
              </div>
              {/* Theme Setting (animated row only) */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg reveal-on-scroll-left"> 
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full mr-3">
                    {theme === 'light' && <Sun size={18} className="text-green-600" />}
                    {theme === 'dark' && <Moon size={18} className="text-emerald-700" />}
                    {theme === 'system' && <Monitor size={18} className="text-green-600" />}
                  </div>
                  <div>
                    <h3 className="font-medium">{t.theme}</h3>
                    <p className="text-sm text-muted-foreground">{t.chooseTheme}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`p-2 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${theme === 'light' ? 'bg-green-600 text-white border-green-600 scale-110 shadow-lg' : 'bg-background border-muted'}`}
                    onClick={() => handleThemeChange('light')}
                    type="button"
                    aria-label="Light Theme"
                  >
                    <Sun size={20} />
                  </button>
                  <button
                    className={`p-2 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${theme === 'dark' ? 'bg-primary text-white border-primary scale-110 shadow-lg' : 'bg-background border-muted'}`}
                    onClick={() => handleThemeChange('dark')}
                    type="button"
                    aria-label="Dark Theme"
                  >
                    <Moon size={20} />
                  </button>
                  <button
                    className={`p-2 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${theme === 'system' ? 'bg-primary text-white border-primary scale-110 shadow-lg' : 'bg-background border-muted'}`}
                    onClick={() => handleThemeChange('system')}
                    type="button"
                    aria-label="System Theme"
                  >
                    <Monitor size={20} />
                  </button>
                </div>
              </div>
              {/* Notifications Setting */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg reveal-on-scroll-left">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/20 rounded-full mr-3">
                    <Bell size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t.notifications}</h3>
                    <p className="text-sm text-muted-foreground">{t.notificationsDesc}</p>
                  </div>
                </div>
                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
                  <input 
                    id="notifications" 
                    type="checkbox" 
                    className="peer sr-only" 
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  />
                  <span 
                    className={`absolute h-5 w-5 rounded-full transition ${notificationsEnabled ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-background'}`}
                  />
                </div>
              </div>
              {/* Data Collection Setting REMOVED */}
            </div>
          </div>
          {/* Connection Settings Card */}
          <div className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 reveal-on-scroll">
            <div className="flex items-center mb-4">
              <Wifi className="mr-2" size={20} />
              <h2 className="text-lg font-semibold">{t.connectionSettings}</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg reveal-on-scroll-left">
                <div className="flex items-center">
                  <div className="p-2 bg-primary/20 rounded-full mr-3">
                    <Globe size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t.offlineMode}</h3>
                    <p className="text-sm text-muted-foreground">{t.offlineModeDesc}</p>
                  </div>
                </div>
                {/* No configure button, just info */}
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8 reveal-on-scroll">
            <p>{t.version}: 1.0.0</p>
            <p className="mt-1">{t.copyright}</p>
          </div>
        </div>
      </DashboardLayout>
    </SensorDataProvider>
  );
};

export default Settings; 