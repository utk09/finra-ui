import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

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
  },
});
