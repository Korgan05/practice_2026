import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api проксируется на backend (uvicorn :8000), чтобы фронт ходил по API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
