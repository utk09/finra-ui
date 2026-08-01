import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { packageTest } from "../../config/vitest-package.mjs";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
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
