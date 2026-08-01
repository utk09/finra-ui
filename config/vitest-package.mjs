/**
 * Shared Vitest `test` options for the two tested packages.
 *
 * Only the module aliases differ between core and finance, and those are
 * genuinely per-package, so they stay in the package configs. Everything here
 * is identical by intent, which means a threshold or pool change lands in both
 * places at once instead of drifting.
 */

/**
 * @param {object} [options]
 * @param {string} [options.setupFiles] Path to the package's setup file.
 */
export function packageTest({ setupFiles = "./test/setup.ts" } = {}) {
  return {
    globals: true,
    environment: "jsdom",
    // Measured on core: 6.6s here against 16.0s for both `threads` and `forks`,
    // almost entirely because a pooled VM context is reused instead of building
    // a fresh jsdom per file. Splitting the pure-engine suites out to the `node`
    // environment and disabling isolation were both measured and made no
    // difference to wall clock, so neither is worth its cost.
    pool: "vmThreads",
    setupFiles,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "*.config.ts",
        "**/*.stories.tsx",
        "**/index.ts",
        "**/*.d.ts",
      ],
      thresholds: {
        branches: 85,
        statements: 85,
        lines: 85,
        functions: 85,
        perFile: true,
      },
    },
  };
}
