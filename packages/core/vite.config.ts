import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { libraryBuild } from "../../config/vite-library.mjs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "extract-font-assets",
      apply: "build",
      writeBundle(options) {
        const outDir = options.dir || resolve(import.meta.dirname, "dist");
        const cssPath = join(outDir, "styles.css");
        let css = readFileSync(cssPath, "utf-8");

        if (!css.includes("data:font/woff2;base64,")) return;

        const fontSrcDir = resolve(import.meta.dirname, "src/assets/fonts");
        const fontOutDir = join(outDir, "fonts");
        mkdirSync(fontOutDir, { recursive: true });

        const fontFiles = readdirSync(fontSrcDir).filter((f) => f.endsWith(".woff2"));

        for (const fontFile of fontFiles) {
          const srcBuffer = readFileSync(resolve(fontSrcDir, fontFile));
          const base64 = srcBuffer.toString("base64");
          const dataUri = `url(data:font/woff2;base64,${base64})`;

          if (css.includes(dataUri)) {
            copyFileSync(resolve(fontSrcDir, fontFile), join(fontOutDir, fontFile));
            css = css.replaceAll(dataUri, `url(./fonts/${fontFile})`);
          }
        }

        writeFileSync(cssPath, css);
      },
    },
  ],
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
