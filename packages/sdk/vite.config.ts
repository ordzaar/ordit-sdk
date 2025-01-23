import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import eslint from "vite-plugin-eslint";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import * as packageJson from "./package.json";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        magiceden: resolve(__dirname, "src/browser-wallets/magiceden/index.ts"),
        unisat: resolve(__dirname, "src/browser-wallets/unisat/index.ts"),
        xverse: resolve(__dirname, "src/browser-wallets/xverse/index.ts"),
        leather: resolve(__dirname, "src/browser-wallets/leather/index.ts"),
        okx: resolve(__dirname, "src/browser-wallets/okx/index.ts"),
        phantom: resolve(__dirname, "src/browser-wallets/phantom/index.ts"),
        oyl: resolve(__dirname, "src/browser-wallets/oyl/index.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: Object.keys(packageJson.dependencies),
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
      },
    }),
    dts({
      insertTypesEntry: true,
    }),
    eslint(),
  ],
  test: {
    globals: true,
    watch: false,
  },
});
