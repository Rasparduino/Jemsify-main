import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Makes the server accessible on your network
    port: 8675,      // The new, non-standard port for the frontend
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});