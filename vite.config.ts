
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env để tránh lỗi ReferenceError trong trình duyệt khi chạy bản build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY)
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});
