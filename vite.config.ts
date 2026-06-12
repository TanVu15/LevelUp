import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.svg', 'icon-512.svg'],
        manifest: {
          name: 'LevelUp — Kỷ Luật Mỗi Ngày',
          short_name: 'LevelUp',
          description: 'App productivity & finance được game hóa theo phong cách RPG',
          lang: 'vi',
          theme_color: '#ea580c',
          background_color: '#0F0F12',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            // PNG trước (iOS/launcher Android cũ không ăn SVG), SVG cho browser hiện đại.
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          ],
        },
        workbox: {
          // SW KHÔNG được nuốt navigation tới: /__/* (Firebase Auth handler — nuốt là
          // redirect sign-in quay về app như khách, bug device test round 2) và
          // /privacy.html (trang tĩnh, không phải app shell).
          navigateFallbackDenylist: [/^\/__\//, /^\/privacy\.html/],
          // woff (không chỉ woff2): subset vietnamese của JetBrains Mono chỉ có .woff
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
          // Không precache: bản .woff trùng (browser nào cũng ưu tiên woff2 nếu có)
          // + subset greek/cyrillic không dùng cho app tiếng Việt.
          globIgnores: [
            '**/space-grotesk-*.woff',
            '**/plus-jakarta-sans-*.woff',
            '**/jetbrains-mono-{latin,latin-ext,greek,cyrillic}-*.woff',
            '**/jetbrains-mono-{greek,cyrillic}-*.woff2',
          ],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    preview: {
      // Cho phép tunnel khi test bản build thật (npm run preview).
      allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io'],
    },
    server: {
      // Cho phép test qua Cloudflare quick tunnel (*.trycloudflare.com) + ngrok,
      // nếu không Vite chặn "Blocked request. This host is not allowed." (dev-only).
      allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
