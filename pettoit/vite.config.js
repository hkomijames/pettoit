import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { imageToWebpPlugin } from 'vite-plugin-image-to-webp';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cssInjectedByJsPlugin(), // <--- This inlines your CSS to stop render-blocking
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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
