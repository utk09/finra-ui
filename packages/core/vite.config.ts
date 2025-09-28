import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: ["**/*.stories.tsx", "**/*.test.tsx"],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        unstyled: resolve(__dirname, "src/unstyled.ts"),
        styles: resolve(__dirname, "src/styles/global.scss"),
      },
      name: "FinraUI",
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        if (entryName === "styles") {
          return `${entryName}.css`;
        }
        const extension = format === "es" ? "mjs" : "js";
        return `${entryName}.${extension}`;
      },
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    sourcemap: true,
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
