import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'path'


export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js}",
    }), 
    svgr()
  ],
  resolve: {
    alias: {
      
      '@': path.resolve(__dirname, './src'),
      crypto: 'crypto-browserify'
    },
    extensions: ['.js', '.jsx', '.json']
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: ['honor.wellspring.edu.vn', 'localhost', '127.0.0.1']
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  define: {
    'process.env': process.env,
    global: {}
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  }
}) 