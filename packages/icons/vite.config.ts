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
      react: resolve(import.meta.dirname, "src/react.ts"),
    },
    // No `"use client"` here, matching the previous build. The data entry is
    // plain serialisable objects, and the React wrappers are stateless SVG
    // renderers with no hooks, so both stay usable from a server component.
    clientOnly: false,
  }),
});
