import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    pool: "vmThreads",
    setupFiles: "./test/setup.ts",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "*.config.ts", "**/*.stories.tsx", "**/index.ts"],
      thresholds: {
        branches: 85,
        statements: 85,
        lines: 85,
        functions: 85,
        perFile: true,
      },
    },
  },
});
