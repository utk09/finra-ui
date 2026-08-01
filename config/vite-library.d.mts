import type { BuildEnvironmentOptions } from "vite";

/**
 * Options for {@link libraryBuild}.
 */
export interface LibraryBuildOptions {
  /**
   * Absolute path to the package root. Its `package.json` is read to derive the
   * externals list, so this must point at the directory holding the manifest.
   */
  packageDir: string;
  /** Entry name to absolute source path, one per published export. */
  entries: Record<string, string>;
  /**
   * Whether the package emits a stylesheet, which is collected into
   * `dist/styles.css`.
   *
   * @defaultValue false
   */
  css?: boolean;
  /**
   * Whether every emitted chunk needs the RSC `"use client"` banner. Set false
   * only for packages whose output is safe to import from a server component.
   *
   * @defaultValue true
   */
  clientOnly?: boolean;
}

/**
 * Shared `build` options for the publishable packages: browser target,
 * per-module output, manifest-derived externals and minification policy.
 */
export function libraryBuild(options: LibraryBuildOptions): BuildEnvironmentOptions;
