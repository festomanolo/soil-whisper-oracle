/**
 * Utility for handling scroll reveal animations
 */

// Initialize scroll observer when the component mounts
export const initScrollReveal = () => {
  // Check if IntersectionObserver is available
  if (typeof IntersectionObserver !== 'undefined') {
    const options = {
      root: null, // Use viewport as root
      rootMargin: '0px',
      threshold: 0.1 // Trigger when 10% of element is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Stop observing after animation is triggered
          observer.unobserve(entry.target);
        }
      });
    }, options);

    // Observe all elements with reveal animation classes
    const revealSelectors = [
      '.reveal-on-scroll',
      '.reveal-on-scroll-left',
      '.reveal-on-scroll-right',
      '.reveal-on-scroll-scale'
    ];
    
    const revealElements = document.querySelectorAll(revealSelectors.join(', '));
    revealElements.forEach(element => {
      observer.observe(element);
    });

    // Return cleanup function
    return () => {
      revealElements.forEach(element => {
        observer.unobserve(element);
      });
    };
  }
  
  // Return empty cleanup function if IntersectionObserver is not available
  return () => {};
};

// Function to animate nutrient circles with real data
export const animateNutrientCircles = () => {
  setTimeout(() => {
    const nutrientCircles = document.querySelectorAll('.nutrient-circle-path');
    
    nutrientCircles.forEach(circle => {
      const element = circle as SVGElement;
      const targetValue = parseFloat(element.getAttribute('data-value') || '0');
      
      // Calculate stroke-dasharray for the circle animation
      const circumference = 2 * Math.PI * 15.9155; // radius from the SVG path
      const offset = circumference - (targetValue / 100) * circumference;
      
      // Apply the animation
      element.style.transition = 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)';
      element.style.strokeDasharray = `${(targetValue / 100) * circumference}, ${circumference}`;
    });
    
    // Animate the main quality gauge arc
    const qualityArcs = document.querySelectorAll('.animate-fill-progress');
    qualityArcs.forEach(arc => {
      const element = arc as SVGElement;
      const targetDegrees = parseFloat(element.getAttribute('data-value') || '0');
      
      // Animate the stroke-dasharray for the arc
      element.style.transition = 'stroke-dasharray 2s cubic-bezier(0.4, 0, 0.2, 1)';
      const arcLength = Math.PI * 40; // radius * π for semicircle
      const fillLength = (targetDegrees / 180) * arcLength;
      element.style.strokeDasharray = `${fillLength}, ${arcLength}`;
    });
  }, 100);
};

// Add scroll reveal to all pages
export const addScrollRevealToPage = () => {
  // Clean up function from initScrollReveal
  let cleanup = initScrollReveal();
  
  // Animate nutrient circles if we're on the soil health page
  if (window.location.pathname.includes('soil-health')) {
    animateNutrientCircles();
  }
  
  // Return cleanup function
  return () => {
    if (cleanup) cleanup();
  };
}; 