// This file has been automatically migrated to valid ESM format by Storybook.
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { resolve, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],

  addons: [
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-docs"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  async viteFinal(config) {
    // Add the package styles to external config to prevent Vite from trying to bundle it
    if (config.build && config.build.rollupOptions) {
      config.build.rollupOptions.external = [
        ...(Array.isArray(config.build.rollupOptions.external)
          ? config.build.rollupOptions.external
          : []),
        "@utk09/finra-ui/styles",
      ];
    }

    // Add aliases for direct imports from the core package source
    if (!config.resolve) config.resolve = {};
    const existing = Array.isArray(config.resolve.alias) ? config.resolve.alias : [];
    config.resolve.alias = [
      ...existing,
      {
        find: "@utk09/finra-ui/styles",
        replacement: resolve(__dirname, "../../../packages/core/src/styles/global.scss"),
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
