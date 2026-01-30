import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  },
  // Handle Node.js module externalization for browser
  optimizeDeps: {
    exclude: ['fs', 'path'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  resolve: {
    alias: {
      // Provide empty shims for Node.js modules
      fs: 'rollup-plugin-node-polyfills/polyfills/empty',
      path: 'rollup-plugin-node-polyfills/polyfills/empty'
    }
  }
});
