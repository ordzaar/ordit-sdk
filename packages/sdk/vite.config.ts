import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import * as packageJson from "./package.json";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "browser-wallets": resolve(__dirname, "src/browser-wallets/index.ts"),
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
    dts({
      insertTypesEntry: true,
    }),
  ],
});
