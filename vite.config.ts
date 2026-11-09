import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Monitorix Production Build Hardening
const isProd = process.env.NODE_ENV === 'production';
const enableObfuscation = process.env.BUILD_OBFUSCATION === 'true';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    allowedHosts: true,
  },
  esbuild: isProd ? {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    minifyIdentifiers: isProd || enableObfuscation,
    minifySyntax: true,
  } : undefined,
  build: {
    target: 'es2020',
    sourcemap: false, // Strict IP Protection: Never ship source maps to customers
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          terminal: ['xterm', 'xterm-addon-fit'],
        },
      },
    },
  },
})

