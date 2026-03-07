import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true,
      exclude: ["**/*.stories.tsx", "**/*.test.tsx", "test/**"],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        unstyled: resolve(__dirname, "src/unstyled.ts"),
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
