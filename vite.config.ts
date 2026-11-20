import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "gh" ? "/lease-lens-dash/" : mode === "company" ? "/dealstack/" : "/",
  server: {
    host: "127.0.0.1",
    port: 8000,
  },

  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
