// import path from 'path';
// import checker from 'vite-plugin-checker';
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react-swc';

// const PORT = 5177; 

// export default defineConfig({

//   plugins: [
//    react(),
//     checker({

//       typescript: true,

//       eslint: {

//         useFlatConfig: true,

//         lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',

//         dev: { logLevel: ['error'] },

//       },

//       overlay: { position: 'tl', initialIsOpen: false },

//     }),

//   ],

//   resolve: {

//     alias: [{ find: /^src(.+)/, replacement: path.resolve(process.cwd(), 'src/$1') }],

//   },

//   server: { 
//       port: PORT, 
//       host: true,
//       allowedHosts: ['portal.wisling.com'],
    
//     hmr: {
//       host: 'portal.wisling.com',
//       protocol: 'wss', // Use Secure WebSockets for HTTPS
//     },
//   },

  

//   preview: { 

//     port: PORT, 

//     host: true,

//     allowedHosts: ['portal.wisling.com'] 

//   },

// });

import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// ----------------------------------------------------------------------
const PORT = 8082;

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ['error'] },
      },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^src(.+)/,
        replacement: path.resolve(process.cwd(), 'src/$1'),
      },
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',    
  },
  base: '/',
  server: { 
    port: PORT, 
    host: true,
    proxy: {
      '/storage': {
        target: 'https://portal.wisling.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: { port: PORT, host: true },
});