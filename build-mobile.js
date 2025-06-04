
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized mobile build...');

try {
  // Clean previous builds
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
    console.log('✅ Cleaned previous build');
  }

  // Build with optimizations
  console.log('📦 Building React app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Sync with Capacitor
  console.log('🔄 Syncing with Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  console.log('✅ Mobile build completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npx cap open android');
  console.log('2. In Android Studio: Build → Generate Signed Bundle/APK');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
