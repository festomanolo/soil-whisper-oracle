/**
 * Helper function to set up scroll reveal animations
 */
export function setupScrollReveal() {
  // Create an Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // If the element is in view
      if (entry.isIntersecting) {
        // Add the revealed class
        entry.target.classList.add('revealed');
        
        // If this is an analysis card, also reveal its children
        if (entry.target.classList.contains('analysis-card')) {
          // Get all metric boxes inside this card
          const metricBoxes = entry.target.querySelectorAll('.metric-box');
          metricBoxes.forEach((box, index) => {
            setTimeout(() => {
              box.classList.add('revealed');
            }, 300 + (index * 50));
          });
          
          // Get all progress bars inside this card
          const progressBars = entry.target.querySelectorAll('.progress-bar');
          progressBars.forEach((bar, index) => {
            // Set the width CSS variable
            const width = bar.getAttribute('data-width');
            if (width) {
              bar.style.setProperty('--width', width);
            }
            
            // Add the revealed class with a delay
            setTimeout(() => {
              bar.classList.add('revealed');
            }, 600 + (index * 50));
          });
        }
        
        // Stop observing the element
        observer.unobserve(entry.target);
      }
    });
  }, {
    // Element is considered in view when 10% of it is visible
    threshold: 0.1,
    // Start revealing elements before they enter the viewport
    rootMargin: '0px 0px -10% 0px'
  });
  
  // Function to observe elements
  const observeElements = () => {
    // Observe all analysis cards
    document.querySelectorAll('.analysis-card').forEach(card => {
      observer.observe(card);
    });
  };
  
  // Initial observation
  observeElements();
  
  // Re-observe on DOM changes
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        observeElements();
      }
    });
  });
  
  // Start observing DOM changes
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Return cleanup function
  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
  };
}