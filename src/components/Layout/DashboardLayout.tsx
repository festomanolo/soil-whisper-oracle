
import React, { ReactNode, useEffect } from 'react';
import ThemeToggle from '../UI/ThemeToggle';
import { Leaf } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // Create floating soil particles for the background
  useEffect(() => {
    const soilBackground = document.querySelector('.soil-background');
    if (!soilBackground) return;
    
    // Create particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = `soil-particle animate-soil-particle${i % 2 === 0 ? '' : '-slow'}`;
      
      // Random size
      const size = Math.floor(Math.random() * 6) + 3;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Random position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      
      // Random opacity
      particle.style.opacity = `${Math.random() * 0.5 + 0.1}`;
      
      // Add to background
      soilBackground.appendChild(particle);
    }
    
    return () => {
      // Clean up particles when component unmounts
      const particles = document.querySelectorAll('.soil-particle');
      particles.forEach(particle => particle.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-background soil-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-primary/20 p-2 rounded-full mr-3">
              <Leaf size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AgriOracle</h1>
              <p className="text-xs text-muted-foreground">The Soil Whisperer</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto py-6 px-4">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border p-4 mt-8">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 AgriOracle • The Soil Whisperer
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
