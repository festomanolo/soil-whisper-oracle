// Disabled native toast systems to force custom NotificationBar in APK
// import { Toaster } from "@/components/UI/toaster";
// import { Toaster as Sonner } from "@/components/UI/sonner";
import { TooltipProvider } from "@/components/UI/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, Component, ReactNode } from "react";
import Index from "./pages/Index";
import SoilHealth from "./pages/SoilHealth";
import Recommendations from "./pages/Recommendations";
import RecentAnalysis from "./pages/RecentAnalysis";
import Settings from "./pages/Settings";
import Mbolea from "./pages/Mbolea";
import DatabaseTest from "./pages/DatabaseTest";
import NotFound from "./pages/NotFound";
import { NotificationProvider } from './context/NotificationContext';
import { SensorDataProvider } from './context/SensorDataContext';
import { initializeNotificationOverrides } from './utils/capacitor-overrides';
import { LanguageProvider } from './context/LanguageContext';

console.log('App.tsx is running!');

const queryClient = new QueryClient();

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-muted-foreground">
              The app encountered an error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  // Initialize theme from localStorage or default to light theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    // Make sure we always have both light and dark classes properly set
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    
    // Save the initial preference if not already set
    if (savedTheme === null) {
      localStorage.setItem('theme', 'light');
    }
    
    // Listen for system theme changes if using system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('theme') === 'system') {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Initialize notification overrides for APK to force custom NotificationBar
    initializeNotificationOverrides();
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NotificationProvider>
          <SensorDataProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                {/* Disabled native toast systems to force custom NotificationBar in APK */}
                {/* <Toaster /> */}
                {/* <Sonner /> */}
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/soil-health" element={<SoilHealth />} />
                    <Route path="/recommendations" element={<Recommendations />} />
                    <Route path="/mbolea" element={<Mbolea />} />
                    <Route path="/recent-analysis" element={<RecentAnalysis />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/database-test" element={<DatabaseTest />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </QueryClientProvider>
          </SensorDataProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
