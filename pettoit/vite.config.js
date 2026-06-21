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
        // 🚀 Break down the giant vendor chunk into smaller, manageable pieces
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
