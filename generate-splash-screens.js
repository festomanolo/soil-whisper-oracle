import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the source SVG file
const svgPath = path.join(__dirname, 'public', 'leaf-icon.svg');

// Define the splash screen sizes and their paths
const splashSizes = [
  { width: 480, height: 800, path: 'android/app/src/main/res/drawable-port-hdpi' },
  { width: 320, height: 480, path: 'android/app/src/main/res/drawable-port-mdpi' },
  { width: 720, height: 1280, path: 'android/app/src/main/res/drawable-port-xhdpi' },
  { width: 960, height: 1600, path: 'android/app/src/main/res/drawable-port-xxhdpi' },
  { width: 1280, height: 1920, path: 'android/app/src/main/res/drawable-port-xxxhdpi' },
  { width: 800, height: 480, path: 'android/app/src/main/res/drawable-land-hdpi' },
  { width: 480, height: 320, path: 'android/app/src/main/res/drawable-land-mdpi' },
  { width: 1280, height: 720, path: 'android/app/src/main/res/drawable-land-xhdpi' },
  { width: 1600, height: 960, path: 'android/app/src/main/res/drawable-land-xxhdpi' },
  { width: 1920, height: 1280, path: 'android/app/src/main/res/drawable-land-xxxhdpi' }
];

// Generate splash screens for each size
async function generateSplashScreens() {
  try {
    for (const { width, height, path: splashPath } of splashSizes) {
      // Calculate icon size (about 1/3 of the smaller dimension)
      const iconSize = Math.min(width, height) / 3;
      
      // First resize the SVG to the appropriate size
      const resizedIcon = await sharp(svgPath)
        .resize(Math.round(iconSize), Math.round(iconSize))
        .toBuffer();
      
      // Create a background with the leaf icon centered
      await sharp({
        create: {
          width: width,
          height: height,
          channels: 4,
          background: { r: 236, g: 253, b: 245, alpha: 1 } // #ECFDF5 - light green background
        }
      })
        .composite([
          {
            input: resizedIcon,
            gravity: 'center'
          }
        ])
        .png()
        .toFile(path.join(__dirname, splashPath, 'splash.png'));
    }
    console.log('Splash screens generated successfully!');
  } catch (error) {
    console.error('Error generating splash screens:', error);
  }
}

generateSplashScreens(); 