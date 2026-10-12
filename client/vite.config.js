import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  // Always build for production regardless of a stray NODE_ENV value coming
  // from the host (Vercel), which would otherwise pull in React's dev build.
  if (command === 'build') process.env.NODE_ENV = 'production';

  return {
    plugins: [react()],
    // Load VITE_* environment variables from the repository-root .env
    // (the same file the backend reads), not just client/.env.
    envDir: '..',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 900,
    },
  };
});