import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
    },
    projects: [
      "packages/core/vitest.config.ts",
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, "apps/storybook/.storybook"),
            storybookScript: "pnpm storybook --no-open",
          }),
        ],
        test: {
          dir: dirname,
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [path.join(dirname, "apps/storybook/.storybook/vitest.setup.ts")],
        },
      },
    ],
  },
});
