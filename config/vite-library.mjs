/**
 * Shared Vite build options for the three publishable packages.
 *
 * The per-package configs differ only in their entry points, whether they emit
 * CSS, and (for core) an extra plugin. Everything that should be identical
 * across published output lives here, so the packages cannot drift apart the
 * way their hand-maintained `external` lists did.
 */
import { createRequire } from "node:module";
import { resolve } from "node:path";

/**
 * Browsers the published output targets. Kept in step with the root
 * package.json `browserslist`; stated explicitly so the build does not silently
 * follow Vite's moving `baseline-widely-available` default.
 */
const BUILD_TARGET = ["chrome111", "edge111", "firefox121", "safari16.5"];

/**
 * Treat every declared `dependency` and `peerDependency` as external, including
 * subpath imports such as `react/jsx-runtime` or `@utk09/finra-ui/unstyled`.
 *
 * A package that declares a dependency must not also inline it: the consumer
 * installs it either way, so bundling it ships a second copy. `clsx` and
 * `class-variance-authority` were being inlined into both core and finance
 * while also being declared, which put three copies in any app using both.
 *
 * @param {string} packageDir Absolute path to the package root.
 * @returns {(id: string) => boolean} Predicate for `rolldownOptions.external`.
 */
function externalFromManifest(packageDir) {
  const require = createRequire(import.meta.url);
  const manifest = require(resolve(packageDir, "package.json"));
  const names = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ];

  return (id) => names.some((name) => id === name || id.startsWith(`${name}/`));
}

/**
 * Build config for a publishable package.
 *
 * @param {object} options
 * @param {string} options.packageDir Absolute path to the package root.
 * @param {Record<string, string>} options.entries Entry name to absolute source path.
 * @param {boolean} [options.css] Whether the package emits a stylesheet.
 * @param {boolean} [options.clientOnly] Whether every chunk needs the RSC `"use client"` banner.
 */
export function libraryBuild({ packageDir, entries, css = false, clientOnly = true }) {
  return {
    target: BUILD_TARGET,
    lib: {
      entry: entries,
      formats: ["es"],
      ...(css ? { cssFileName: "styles" } : {}),
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: externalFromManifest(packageDir),
      output: {
        // One output file per source module, mirroring `src/`. Without this the
        // chunker merges nearly the whole library into a single shared chunk
        // that every entry imports wholesale, and a consumer importing one
        // component pulls in essentially all of them. Measured on core:
        // importing just `Button` went from 56.3 kB to 4.3 kB, with no change
        // to the cost of importing everything.
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        ...(clientOnly
          ? {
              // RSC boundary: components use hooks/state/refs, so every emitted
              // chunk must be a client module (Next.js App Router).
              banner: '"use client";',
            }
          : {}),
      },
    },
    // Consumers minify. Shipping readable modules costs them nothing in final
    // bundle size (measured identical either way) and gives them usable stack
    // traces. The stylesheet is different: it can be linked directly without
    // passing through a bundler, so it stays minified.
    minify: false,
    cssMinify: true,
    sourcemap: false,
    // Gzipping every emitted file to print a size table is a large share of
    // build time once `preserveModules` raises the file count into the hundreds.
    reportCompressedSize: false,
  };
}
