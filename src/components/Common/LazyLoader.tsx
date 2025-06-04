
import React, { Suspense } from 'react';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyLoader = ({ children, fallback }: LazyLoaderProps) => {
  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default LazyLoader;
