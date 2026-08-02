import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { coverageConfigDefaults, defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      /**
       * Keep documentation tooling out of the coverage percentage.
       *
       * The Storybook addon runs coverage against its own project only
       * (`project: ["storybook:*"]`), so it measures one thing: how much of the
       * code the preview loads is exercised *by stories*. `docgen.ts` and the
       * `docs/` furniture are loaded by `preview.tsx` but run in docs mode, so
       * stories can never execute them and the figure only ever falls as more
       * tooling is added.
       *
       * They are not untested. `apps/storybook` has its own unit-test project
       * covering them, and that is the gate for this code. What is excluded
       * here is the *percentage*, so it keeps meaning "library and story code",
       * which is what ships.
       */
      exclude: [
        ...coverageConfigDefaults.exclude,
        "apps/storybook/.storybook/docgen.ts",
        "apps/storybook/docs/**",
      ],
    },
    projects: [
      "packages/core/vitest.config.ts",
      "packages/finance/vitest.config.ts",
      {
        // The Storybook app's own helpers: the docgen post-processing, the
        // token parser and the docs furniture. Plain unit tests, separate from
        // the browser project below, which only runs stories.
        extends: true,
        test: {
          name: "storybook-app",
          dir: path.join(dirname, "apps/storybook"),
          include: ["**/*.test.ts", "**/*.test.tsx"],
          environment: "node",
        },
      },
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
