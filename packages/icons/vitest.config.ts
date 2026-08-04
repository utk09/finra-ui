import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { packageTest } from "../../config/vitest-package.mjs";

export default defineConfig({
  plugins: [react()],
  test: packageTest(),
});
