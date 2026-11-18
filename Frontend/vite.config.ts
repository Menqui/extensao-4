import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const proxy = {
  "/api/v1": {
    target: "http://127.0.0.1:8001",
    changeOrigin: true,
  },

  "/static": {
    target: "http://127.0.0.1:8001",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",

      includeAssets: [
        "favicon.ico",
        "icone.svg",
        "apple-touch-icon-180x180.png",
      ],

      manifest: {
        id: "/",
        name: "Explorador ENEM",
        short_name: "Explorador",
        description: "Consulte e pratique questões do ENEM.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#166534",
        background_color: "#F4F7F5",

        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg,woff2}",
        ],

        globIgnores: [
          "**/mockServiceWorker.js",
          "**/mocks/**",
        ],

        navigateFallback: "index.html",

        navigateFallbackDenylist: [
          /^\/api(?:\/|$)/,
          /^\/static(?:\/|$)/,
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  server: {
    proxy,
  },

  preview: {
    proxy,
  },
});