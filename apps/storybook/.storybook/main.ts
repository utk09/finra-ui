// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],

  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-docs"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  async viteFinal(config) {
    // Add aliases for direct imports from the core package source
    if (!config.resolve) config.resolve = {};
    const existing = Array.isArray(config.resolve.alias) ? config.resolve.alias : [];
    config.resolve.alias = [
      ...existing,
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
      {
        find: "@utk09/finra-ui/finance",
        replacement: resolve(__dirname, "../../../packages/core/src/finance.ts"),
      },
      { find: "@utk09/finra-ui", replacement: resolve(__dirname, "../../../packages/core/src") },
    ];

    return config;
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
