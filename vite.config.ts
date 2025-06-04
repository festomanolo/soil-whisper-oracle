
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Optimized build for mobile/APK
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps for faster builds
    minify: 'terser', // Better minification
    target: 'es2015', // Better mobile compatibility
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
          ],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // Optimize for mobile
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  define: {
    __SW__: mode === 'production'
  },
  publicDir: 'public',
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react'
    ],
    exclude: ['@capacitor/core', '@capacitor/android']
  },
  // Enable pre-bundling for faster dev server
  esbuild: {
    target: 'es2015',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));
