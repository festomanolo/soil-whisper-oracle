import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeOptions {
  threshold?: number; // Minimum distance required for a swipe
  restraint?: number; // Maximum perpendicular distance allowed
  allowedTime?: number; // Maximum time allowed for the swipe
}

const useSwipeNavigation = (routes: string[], options: SwipeOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    threshold = 100, // Minimum distance required for a swipe (px)
    restraint = 100, // Maximum perpendicular distance allowed (px)
    allowedTime = 300 // Maximum time allowed for the swipe (ms)
  } = options;

  useEffect(() => {
    let touchStartX: number;
    let touchStartY: number;
    let touchStartTime: number;
    
    const handleTouchStart = (e: TouchEvent) => {
      const firstTouch = e.touches[0];
      touchStartX = firstTouch.clientX;
      touchStartY = firstTouch.clientY;
      touchStartTime = Date.now();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      // Check if swipe meets time constraint
      if (touchEndTime - touchStartTime > allowedTime) return;
      
      const distanceX = touchEndX - touchStartX;
      const distanceY = Math.abs(touchEndY - touchStartY);
      
      // Check if horizontal swipe meets minimum requirements
      if (Math.abs(distanceX) >= threshold && distanceY <= restraint) {
        const currentIndex = routes.indexOf(location.pathname);
        if (currentIndex === -1) return;
        
        if (distanceX > 0) {
          // Swipe right - go to previous page
          if (currentIndex > 0) {
            navigate(routes[currentIndex - 1]);
          }
        } else {
          // Swipe left - go to next page
          if (currentIndex < routes.length - 1) {
            navigate(routes[currentIndex + 1]);
          }
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchend', handleTouchEnd, false);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate, location.pathname, routes, threshold, restraint, allowedTime]);
};

export default useSwipeNavigation; 