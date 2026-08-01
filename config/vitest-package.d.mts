import type { InlineConfig } from "vitest/node";

/**
 * Options for {@link packageTest}.
 */
export interface PackageTestOptions {
  /**
   * Path to the package's Vitest setup file, relative to the package root.
   *
   * @defaultValue "./test/setup.ts"
   */
  setupFiles?: string;
}

/**
 * Shared Vitest `test` options: environment, pool, and the coverage reporter
 * and per-file thresholds.
 */
export function packageTest(options?: PackageTestOptions): InlineConfig;
