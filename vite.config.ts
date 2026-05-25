import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'src/extension/assets', dest: '.' }
      ]
    })
  ],
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'src/extension/service-worker/index.ts'),
        'content-script': resolve(__dirname, 'src/extension/content/index.tsx'),
        'offscreen/index': resolve(__dirname, 'src/extension/offscreen/index.html'),
        'popup/index': resolve(__dirname, 'src/extension/popup/index.html'),
        'options/index': resolve(__dirname, 'src/extension/options/index.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'content-script.css';
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});
