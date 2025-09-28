import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y", "@storybook/addon-themes"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
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

    // Add alias for direct imports
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.alias) config.resolve.alias = {};

    // Alias for styles
    config.resolve.alias["@utk09/finra-ui/styles"] = resolve(
      __dirname,
      "../../../packages/core/src/styles/global.scss",
    );

    // Alias for the main package
    config.resolve.alias["@utk09/finra-ui"] = resolve(__dirname, "../../../packages/core/src");

    return config;
  },
};

export default config;
