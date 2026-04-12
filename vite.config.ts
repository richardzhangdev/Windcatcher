import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@client": resolve(__dirname, "src/client"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:7331",
      "/icons": "http://localhost:7331",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
