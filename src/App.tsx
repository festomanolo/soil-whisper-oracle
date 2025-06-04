
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, lazy } from "react";
import LazyLoader from "./components/Common/LazyLoader";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reduce retries for faster fails
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    },
  },
});

const App = () => {
  // Set dark mode as default
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Optimize for mobile performance
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <LazyLoader>
                  <Index />
                </LazyLoader>
              } 
            />
            <Route 
              path="*" 
              element={
                <LazyLoader>
                  <NotFound />
                </LazyLoader>
              } 
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
