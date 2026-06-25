import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, proxy /api to the local Fastify server (pnpm dev:api).
// In production on Vercel, set VITE_API_URL to the deployed api URL,
// or use the rewrites in apps/web/vercel.json to proxy /api/* to the api project.
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
