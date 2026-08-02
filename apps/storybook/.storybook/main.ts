// This file has been automatically migrated to valid ESM format by Storybook.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import remarkGfm from "remark-gfm";

import { postcssFinraLayer } from "../../../config/postcss-layer.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Matches a top-level export whose name we can link to. */
const EXPORTED_SYMBOL =
  /^export\s+(?:declare\s+)?(?:abstract\s+)?(?:interface|type|class|function|const|enum)\s+([A-Za-z_$][\w$]*)/gm;

/**
 * Map every exported symbol in the packages to the file that declares it.
 *
 * JSDoc across the library uses `{@link SomeType}`, which an editor resolves but
 * a docs page cannot: there is no page for a TypeScript interface. With this
 * index the docs can turn each one into a link to the declaration on GitHub, so
 * `{@link BadgeProps}` reaches the annotated source rather than rendering as
 * literal braces.
 *
 * Built here, in Node, rather than with `import.meta.glob` in the preview: the
 * glob would pull every source file into the browser bundle as raw text to
 * recover a few hundred names.
 */
function buildSymbolIndex(repoRoot: string): Record<string, string> {
  const index: Record<string, string> = {};

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === "dist") continue;
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.tsx?$/.test(entry) || /\.(test|stories)\.tsx?$/.test(entry)) continue;
      const source = readFileSync(path, "utf8");
      for (const match of source.matchAll(EXPORTED_SYMBOL)) {
        // First declaration wins. Re-exports and overloads would otherwise
        // point at whichever file the walk happened to reach last.
        index[match[1]] ??= relative(repoRoot, path);
      }
    }
  };

  for (const pkg of ["core", "finance", "icons"]) {
    walk(resolve(repoRoot, "packages", pkg, "src"));
  }
  return index;
}

const config: StorybookConfig = {
  // Prose pages first: the sidebar order comes from `storySort` in preview.tsx,
  // but the glob order decides which page loads at the root URL.
  stories: ["../docs/**/*.mdx", "../stories/**/*.stories.tsx"],

  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-vitest"),
    {
      name: getAbsolutePath("@storybook/addon-docs"),
      options: {
        /**
         * Markdown tables are a GitHub-Flavored Markdown extension, not part of
         * CommonMark, and Storybook's MDX compiler ships without `remark-gfm`.
         * Without this the pipe syntax renders as literal text - the prose
         * pages under `docs/` lean on tables heavily, so it is load-bearing.
         */
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  typescript: {
    /**
     * Pinned deliberately, and it cannot be changed to `react-docgen-typescript`.
     *
     * This repo is on TypeScript 7 (the native port), which ships the compiler
     * but not the JavaScript Compiler API - `ts.createProgram` and friends are
     * all `undefined`. `react-docgen-typescript` is built on that API, so it
     * throws at startup. The same limitation is why the packages emit their
     * declarations with `tsc` instead of a bundler plugin.
     *
     * The practical consequence: react-docgen reads a component's *own* prop
     * interface and its JSDoc, but does not follow `extends` into another
     * module. Props that a component genuinely owns must therefore be declared
     * on its own interface to appear in the tables - which is why `variant` is
     * spelled out on each component rather than mixed in from cva's
     * `VariantProps`. Inherited DOM attributes stay out of the tables on
     * purpose; each component's docs say which element receives them.
     */
    reactDocgen: "react-docgen",
  },

  docs: {
    defaultName: "Docs",
  },

  async viteFinal(config) {
    /**
     * Same cascade layer the published packages emit.
     *
     * Storybook aliases the packages to their source, so without this the
     * stylesheet here would be unlayered while the published one is layered,
     * and every override example would demonstrate behaviour consumers do not
     * get.
     */
    config.css = {
      ...config.css,
      postcss: { plugins: [postcssFinraLayer()] },
    };

    // Symbol index for `{@link}` resolution, read by `.storybook/docgen.ts`.
    config.define = {
      ...config.define,
      __FINRA_SYMBOL_INDEX__: JSON.stringify(buildSymbolIndex(resolve(__dirname, "../../.."))),
    };

    // Add aliases for direct imports from the core package source
    if (!config.resolve) config.resolve = {};
    const existing = Array.isArray(config.resolve.alias) ? config.resolve.alias : [];
    config.resolve.alias = [
      ...existing,
      // Core aliases
      {
        find: "@utk09/finra-ui/styles",
        replacement: resolve(__dirname, "../../../packages/core/src/styles/global.scss"),
      },
      {
        find: "@utk09/finra-ui/unstyled",
        replacement: resolve(__dirname, "../../../packages/core/src/unstyled.ts"),
      },
      {
        find: "@utk09/finra-ui/utils",
        replacement: resolve(__dirname, "../../../packages/core/src/utils.ts"),
      },
      { find: "@utk09/finra-ui", replacement: resolve(__dirname, "../../../packages/core/src") },
      // Finance aliases
      {
        find: "@utk09/finra-ui-finance/unstyled",
        replacement: resolve(__dirname, "../../../packages/finance/src/unstyled.ts"),
      },
      {
        find: "@utk09/finra-ui-finance/utils",
        replacement: resolve(__dirname, "../../../packages/finance/src/utils.ts"),
      },
      {
        find: "@utk09/finra-ui-finance",
        replacement: resolve(__dirname, "../../../packages/finance/src"),
      },
      // Icons aliases
      {
        find: "@utk09/finra-ui-icons/react",
        replacement: resolve(__dirname, "../../../packages/icons/src/react.ts"),
      },
      {
        find: "@utk09/finra-ui-icons",
        replacement: resolve(__dirname, "../../../packages/icons/src"),
      },
    ];

    return config;
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
