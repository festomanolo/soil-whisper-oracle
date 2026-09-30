import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Leaf, Sprout, Settings, BarChart3, FlaskConical } from 'lucide-react';
import { useMboleaT } from '../../i18n/mbolea';

const Navigation = () => {
  const location = useLocation();
  const m = useMboleaT();

  const navItems = [
    { path: '/', label: m.nav.home, icon: Home },
    { path: '/soil-health', label: m.nav.soil, icon: Leaf },
    { path: '/recommendations', label: m.nav.crops, icon: Sprout },
    { path: '/mbolea', label: m.nav.mbolea, icon: FlaskConical, feature: true },
    { path: '/recent-analysis', label: m.nav.history, icon: BarChart3 },
    { path: '/settings', label: m.nav.settings, icon: Settings },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-border z-50 rounded-t-3xl shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-2xl grid grid-cols-6">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center py-2.5 relative min-w-0 ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`flex flex-col items-center transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                <span
                  className={`flex items-center justify-center rounded-full ${
                    item.feature ? `w-8 h-8 -mt-1 ${active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}` : 'w-6 h-6'
                  }`}
                >
                  <item.icon size={item.feature ? 18 : 20} />
                </span>
                <span className="text-[10px] mt-0.5 leading-tight truncate max-w-full px-0.5">{item.label}</span>
              </div>
              {active && <div className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
