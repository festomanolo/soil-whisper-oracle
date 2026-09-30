import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { databaseService } from './services/database';

// Initialize database as early as possible
(async () => {
  try {
    console.log('Initializing database from main.tsx...');
    await databaseService.initialize();
    console.log('Database initialized successfully from main.tsx');
  } catch (error) {
    console.error('Failed to initialize database from main.tsx:', error);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
