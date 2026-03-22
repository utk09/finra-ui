import react from "@vitejs/plugin-react";
import { resolve } from "path";
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
  ],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        unstyled: resolve(import.meta.dirname, "src/unstyled.ts"),
        utils: resolve(import.meta.dirname, "src/utils.ts"),
      },
      formats: ["es"],
      cssFileName: "styles",
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@utk09/finra-ui",
        "@utk09/finra-ui/unstyled",
        "@utk09/finra-ui/utils",
        "@utk09/finra-ui-icons",
        "@utk09/finra-ui-icons/react",
      ],
    },
    sourcemap: true,
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
