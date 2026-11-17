import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],

    environmentOptions: {
      jsdom: {
        url: "http://localhost:5173/",
      },
    },

    env: {
      VITE_API_BASE_URL: "http://localhost:5173/api/v1",
      VITE_USE_MOCK: "false",
    },
    server: {
      proxy: {
        "/api/v1": {
          target: "http://127.0.0.1:8001",
          changeOrigin: true,
        },
        "/static": {
          target: "http://127.0.0.1:8001",
          changeOrigin: true,
        },
      },
    },
  },
});
