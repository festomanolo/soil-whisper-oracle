import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the source SVG file
const svgPath = path.join(__dirname, 'public', 'leaf-icon.svg');

// Define the Android icon sizes and their paths
const iconSizes = [
  { size: 48, path: 'android/app/src/main/res/mipmap-mdpi' },
  { size: 72, path: 'android/app/src/main/res/mipmap-hdpi' },
  { size: 96, path: 'android/app/src/main/res/mipmap-xhdpi' },
  { size: 144, path: 'android/app/src/main/res/mipmap-xxhdpi' },
  { size: 192, path: 'android/app/src/main/res/mipmap-xxxhdpi' }
];

// Read the SVG file
const svgBuffer = fs.readFileSync(svgPath);

// Generate icons for each size
async function generateIcons() {
  try {
    for (const { size, path: iconPath } of iconSizes) {
      // Generate launcher icon
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, iconPath, 'ic_launcher.png'));
      
      // Generate round launcher icon
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, iconPath, 'ic_launcher_round.png'));
      
      // Generate foreground icon (slightly larger to account for padding)
      await sharp(svgBuffer)
        .resize(Math.floor(size * 0.75), Math.floor(size * 0.75))
        .png()
        .toFile(path.join(__dirname, iconPath, 'ic_launcher_foreground.png'));
    }
    console.log('App icons generated successfully!');
  } catch (error) {
    console.error('Error generating app icons:', error);
  }
}

generateIcons(); 