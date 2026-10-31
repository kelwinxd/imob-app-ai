import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API = "http://localhost:4600";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5300,
    strictPort: true,
    proxy: {
      "/api": API,
      "/i": API,
    },
  },
});
