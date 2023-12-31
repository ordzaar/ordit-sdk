import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import * as packageJson from "./package.json";

export default defineConfig({
  build: {
    rollupOptions: {
      external: Object.keys(packageJson.dependencies),
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
  ],
});
