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
        "browser-wallets-unisat": resolve(
          __dirname,
          "src/browser-wallets/unisat/index.ts",
        ),
        "browser-wallets-xverse": resolve(
          __dirname,
          "src/browser-wallets/xverse/index.ts",
        ),
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
