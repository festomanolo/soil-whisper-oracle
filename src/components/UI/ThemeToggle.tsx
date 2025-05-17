
import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  // Default to dark theme
  const [darkMode, setDarkMode] = useState(true);

  // Apply theme class to document on mount and theme change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-background hover:bg-accent transition-colors"
      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-indigo-700" />
      )}
    </button>
  );
};

export default ThemeToggle;
