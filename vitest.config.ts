import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
    },
    projects: [
      "packages/core/vitest.config.ts",
      "packages/finance/vitest.config.ts",
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
          // No setupFiles: since Storybook 10.3 @storybook/addon-vitest applies
          // preview + a11y annotations automatically (previously wired via a
          // vitest.setup.ts calling setProjectAnnotations).
        },
      },
    ],
  },
});
