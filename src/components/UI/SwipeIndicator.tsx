import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeIndicatorProps {
  routes: string[];
}

const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ routes }) => {
  const location = useLocation();
  const currentIndex = routes.indexOf(location.pathname);
  
  // Don't show indicator if route is not in our list
  if (currentIndex === -1) return null;
  
  const hasNext = currentIndex < routes.length - 1;
  const hasPrev = currentIndex > 0;
  
  return (
    <div className="fixed top-1/2 left-0 right-0 transform -translate-y-1/2 pointer-events-none z-40 flex justify-between px-2">
      {hasPrev && (
        <div className="bg-background/80 p-2 rounded-full shadow-md animate-pulse">
          <ChevronLeft size={20} className="text-primary" />
        </div>
      )}
      
      <div className="flex-grow"></div>
      
      {hasNext && (
        <div className="bg-background/80 p-2 rounded-full shadow-md animate-pulse">
          <ChevronRight size={20} className="text-primary" />
        </div>
      )}
    </div>
  );
};

export default SwipeIndicator; 