/**
 * Helper function to set up progress bar animations
 */
export function initializeProgressBars() {
  // Find all progress bars
  const progressBars = document.querySelectorAll('.progress-bar');
  
  // Set the width CSS variable for each progress bar
  progressBars.forEach(bar => {
    const width = bar.getAttribute('data-width');
    if (width) {
      bar.style.setProperty('--width', width);
    }
  });
  
  // Return a cleanup function
  return () => {
    // No cleanup needed
  };
}