import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This is a minimal Vite config for the legacy server code in apps/web/server/
// Next.js handles the main application build.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "app"),
    },
  },
  root: path.resolve(__dirname, "app"),
});
