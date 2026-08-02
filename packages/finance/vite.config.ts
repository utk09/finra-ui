import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { postcssFinraLayer } from "../../config/postcss-layer.mjs";
import { libraryBuild } from "../../config/vite-library.mjs";

export default defineConfig({
  plugins: [react()],
  build: libraryBuild({
    packageDir: import.meta.dirname,
    entries: {
      index: resolve(import.meta.dirname, "src/index.ts"),
      unstyled: resolve(import.meta.dirname, "src/unstyled.ts"),
      utils: resolve(import.meta.dirname, "src/utils.ts"),
    },
    css: true,
  }),
  css: {
    modules: {
      localsConvention: "camelCase",
    },
    // Everything the package emits goes in one cascade layer, so a consumer
    // override wins without needing a doubled selector or `!important`.
    postcss: { plugins: [postcssFinraLayer()] },
  },
});
