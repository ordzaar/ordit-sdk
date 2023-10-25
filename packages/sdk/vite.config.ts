import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import eslint from "vite-plugin-eslint";
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
      },
      formats: ["es"],
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
    eslint(),
  ],
  test: {
    globals: true,
    watch: false,
  },
});
