import { useEffect, useState } from 'react';

/**
 * Hook to get the current header height for positioning floating elements
 * This helps ensure dropdowns, modals, and other floating content don't get hidden behind the header
 */
export const useHeaderHeight = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    // Initial measurement
    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // Use ResizeObserver if available for more accurate tracking
    let resizeObserver: ResizeObserver | null = null;
    const header = document.querySelector('header');
    
    if (header && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateHeaderHeight);
      resizeObserver.observe(header);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return headerHeight;
};

/**
 * Hook to get safe positioning values that account for the header
 */
export const useSafePositioning = () => {
  const headerHeight = useHeaderHeight();
  
  return {
    headerHeight,
    safeTop: headerHeight + 8, // Add 8px buffer
    safeSideOffset: 8, // Standard offset for dropdowns
  };
};