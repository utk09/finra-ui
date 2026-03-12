import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true,
      exclude: [
        "**/*.stories.tsx",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "test/**",
      ],
    }),
    {
      name: "extract-font-assets",
      apply: "build",
      writeBundle(options) {
        const outDir = options.dir || resolve(__dirname, "dist");
        const cssPath = join(outDir, "styles.css");
        let css = readFileSync(cssPath, "utf-8");

        if (!css.includes("data:font/ttf;base64,")) return;

        const fontSrcDir = resolve(__dirname, "src/assets/fonts");
        const fontOutDir = join(outDir, "fonts");
        mkdirSync(fontOutDir, { recursive: true });

        const fontFiles = readdirSync(fontSrcDir).filter((f) => f.endsWith(".ttf"));

        for (const fontFile of fontFiles) {
          const srcBuffer = readFileSync(resolve(fontSrcDir, fontFile));
          const base64 = srcBuffer.toString("base64");
          const dataUri = `url(data:font/ttf;base64,${base64})`;

          if (css.includes(dataUri)) {
            copyFileSync(resolve(fontSrcDir, fontFile), join(fontOutDir, fontFile));
            css = css.replaceAll(dataUri, `url(./fonts/${fontFile})`);
          }
        }

        writeFileSync(cssPath, css);
      },
    },
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        unstyled: resolve(__dirname, "src/unstyled.ts"),
        utils: resolve(__dirname, "src/utils.ts"),
        finance: resolve(__dirname, "src/finance.ts"),
      },
      formats: ["es"],
      cssFileName: "styles",
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    sourcemap: true,
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
