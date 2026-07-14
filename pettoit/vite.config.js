import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { imageToWebpPlugin } from 'vite-plugin-image-to-webp';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 🚀 Removed cssInjectedByJsPlugin() to separate CSS and shrink your JS bundle size!
    imageToWebpPlugin({
      imageFormats: ['jpg', 'jpeg', 'png'],
      webpQuality: {
        quality: 80,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // 🚀 Break down the giant vendor chunk into safe, optimized pieces
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 🔥 Sub-split heavy Firebase modules into granular chunks first
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'vendor-firebase-firestore';
            }
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            if (id.includes('firebase/storage') || id.includes('@firebase/storage')) {
              return 'vendor-firebase-storage';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase-core';
            }
            
            // Isolate React core packages
            if (id.includes('react')) {
              return 'vendor-react';
            }
            
            // Convert to clean string and strip Vite internal build suffixes if present
            const cleanId = id.toString().split('?')[0];
            const parts = cleanId.split('node_modules/');
            const pathParts = parts[parts.length - 1].split('/');
            
            // Check the first directory level to handle scoped packages safely
            if (pathParts[0] && pathParts[0].startsWith('@')) {
              // Yields names like vendor-@radix-ui-react-slot
              const scope = pathParts[0];
              const pkg = pathParts[1] || 'scoped';
              return `vendor-${scope}-${pkg}`;
            }
            
            // Yields standard package chunk names like vendor-lodash
            if (pathParts[0]) {
              return `vendor-${pathParts[0]}`;
            }
          }
        },
      },
    },
  },
});
