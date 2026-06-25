import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Single-page entry. The app renders the landing page or the /demo page based
// on the URL path (see src/main.tsx). /demo falls back to index.html via the
// SPA rewrite in public/vercel.json.
//
// In dev, proxy /api to the local Fastify server (pnpm dev:backend).
// In production on Vercel, set VITE_API_URL to the deployed api URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
