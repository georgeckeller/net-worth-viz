import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disabled for security (prevents source code exposure)
    minify: 'terser',
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production for security
        drop_debugger: true,
        passes: 2,
      },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: 'assets/[name].[hash][extname]',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 4096,
    cssCodeSplit: false,
  },
  server: {
    port: 8080,
    host: true,
  },
});
