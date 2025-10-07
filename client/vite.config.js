import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_PORT = 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT) || DEFAULT_PORT,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
