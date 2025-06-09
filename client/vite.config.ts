import { defineConfig } from 'vite';
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // Temporarily disable PWA to fix build issues
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    //           },
    //           cacheKeyWillBeUsed: async ({ request }) => {
    //             return `${request.url}?v=1`;
    //           },
    //         },
    //       },
    //     ],
    //   },
    //   manifest: {
    //     name: 'Mato Royale',
    //     short_name: 'MatoRoyale',
    //     description: 'Mass-multiplayer browser Snake game',
    //     theme_color: '#4ECDC4',
    //     background_color: '#1a1a1a',
    //     display: 'fullscreen',
    //     orientation: 'portrait-primary',
    //     icons: [
    //       {
    //         src: 'icon-192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //       },
    //       {
    //         src: 'icon-512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //       },
    //     ],
    //   },
    // }),
  ],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
