import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],


    // server: {
    //     host: '0.0.0.0',
    //     port: 5177,
    //     strictPort: true,
    //     allowedHosts: ['portal.wisling.com'], 
    //     hmr: {
    //         host: 'portal.wisling.com',
    //         clientPort: 443, // Important for SSL via Nginx
    //     }
    // },

    // // This block is for "npm run preview"
    // preview: {
    //     host: '0.0.0.0',
    //     port: 5177,
    //     strictPort: true,
    //     allowedHosts: ['portal.wisling.com'],
    // }


});

