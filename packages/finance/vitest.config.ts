import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { packageTest } from "../../config/vitest-package.mjs";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@utk09/finra-ui/unstyled",
        replacement: resolve(import.meta.dirname, "../core/src/unstyled.ts"),
      },
      {
        find: "@utk09/finra-ui/utils",
        replacement: resolve(import.meta.dirname, "../core/src/utils.ts"),
      },
      {
        find: "@utk09/finra-ui",
        replacement: resolve(import.meta.dirname, "../core/src/index.ts"),
      },
      {
        find: "@utk09/finra-ui-icons/react",
        replacement: resolve(import.meta.dirname, "../icons/src/react.ts"),
      },
      {
        find: "@utk09/finra-ui-icons",
        replacement: resolve(import.meta.dirname, "../icons/src/index.ts"),
      },
    ],
  },
  test: packageTest(),
});
