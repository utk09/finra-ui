import "@utk09/finra-ui/styles";

import type { Preview } from "@storybook/react-vite";

import { DocsLink } from "../docs/DocsLink";
import { componentDescription, enhanceArgTypesFromDocgen, mergeInheritedArgTypes } from "./docgen";
import { lightTheme } from "./theme";

const preview: Preview = {
  tags: ["autodocs", "a11y-test"],
  globalTypes: {
    theme: {
      description: "Theme mode",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: "Component density",
      toolbar: {
        title: "Density",
        icon: "component",
        items: [
          { value: "high", title: "High" },
          { value: "medium", title: "Medium" },
          { value: "low", title: "Low" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
    density: "medium",
  },
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      // Show each prop's description and default in the table rather than
      // hiding them behind a hover, and float required props to the top.
      expanded: true,
      sort: "requiredFirst",
    },
    options: {
      /**
       * Explicit ordering. Read top to bottom this is the path a new consumer
       * takes: what the library is, how to install it, the cross-cutting
       * systems, then the components themselves. Anything not named here sorts
       * alphabetically after what is.
       */
      storySort: {
        order: [
          "Introduction",
          "Getting Started",
          "Foundations",
          ["Design Tokens", "Theming", "Density", "Accessibility", "Styling and Overrides"],
          "Components",
          "Finance",
          "Unstyled",
          ["Overview", "*"],
          "Icons",
          "Contributing",
        ],
      },
    },
    docs: {
      toc: true,
      /**
       * Every Markdown link goes through `DocsLink`.
       *
       * Docs pages render inside `iframe.html`, so an unqualified link
       * navigates the iframe rather than the top window: `?path=...` resolves
       * to `iframe.html?path=...`, which carries no story `id` and renders
       * blank. Overriding the element here fixes every page at once, including
       * links written as plain Markdown, which cannot carry a `target`.
       */
      components: { a: DocsLink },
      /**
       * Clean up the raw docblock before it is rendered, and append whatever
       * the story adds.
       *
       * `react-docgen` hands the whole comment over, block tags included, so
       * without this every component page prints `@see {@link XProps}` as
       * literal text. A story's extra prose arrives as `docs.forwardsTo`
       * rather than `docs.description.component`, because the latter replaces
       * this extractor instead of running alongside it. See `./docgen.ts`.
       */
      extractComponentDescription: (
        component: unknown,
        context?: { parameters?: { docs?: { forwardsTo?: string } } },
      ) => componentDescription(component, context?.parameters),
      // Docs chrome stays light to match the manager; the story canvases inside
      // still follow the Theme toolbar, because the decorator below runs per
      // story in docs mode too.
      theme: lightTheme,
    },
    a11y: {
      /**
       * Make accessibility violations fail the run.
       *
       * `@storybook/addon-a11y` ships `parameters = { a11y: { test: "todo" } }`
       * as its own default, and "todo" downgrades every violation to a warning:
       * the addon records the result and returns without throwing, so the suite
       * stays green no matter what axe finds. Setting only `options`, as this
       * file used to, leaves that default in place - the checks ran, reported
       * into the panel, and gated nothing.
       *
       * Verified by reintroducing a known 3.66:1 contrast failure: the suite
       * passed with "todo" and failed with "error".
       */
      test: "error",
      options: {
        /**
         * Only keep full node detail for results we act on.
         *
         * By default axe returns every matched node for all four result types.
         * `passes` alone is ~24 rules x every element in the story, and the
         * whole payload is structured-cloned back over the test worker's RPC
         * channel - which is what pushed the run into a 2 GB heap OOM
         * (`ValueDeserializer::ReadDenseJSArray`). Calendar is the worst case at
         * 42 gridcells per story.
         *
         * Types omitted here are still evaluated and still reported; axe just
         * truncates their `nodes` array. Violations and incomplete keep full
         * detail, so both the a11y panel and CI failures stay actionable.
         */
        resultTypes: ["violations", "incomplete"],
      },
    },
  },
  /**
   * Recover the prop metadata Storybook drops.
   *
   * Its own parser strips block tags out of a prop description and then fills
   * the Default column only from a destructuring default. A default declared in
   * a cva `defaultVariants` block, or stated as `@defaultValue`, is lost. This
   * reads the raw docgen record instead. See `./docgen.ts`.
   */
  argTypesEnhancers: [
    (context) => {
      const docs = (
        context.parameters as {
          docs?: { inheritsFrom?: unknown; inheritedOmit?: readonly string[] };
        }
      )?.docs;
      const merged = mergeInheritedArgTypes(
        context.argTypes,
        docs?.inheritsFrom,
        docs?.inheritedOmit,
      );
      return enhanceArgTypesFromDocgen(merged, context.component);
    },
  ],

  decorators: [
    (Story, context) => {
      /**
       * A story-level `parameters.theme` wins over the toolbar global.
       *
       * This is not a stylistic preference. The Vitest browser runner does not
       * apply a story's `globals`, so a story that sets `globals.theme` renders
       * dark in the Storybook UI and light under test - the accessibility check
       * then audits the wrong theme and passes. Verified by reintroducing a
       * known 3.66:1 dark-mode violation: the suite stayed green until the
       * theme moved onto a parameter. Parameters are applied in both places.
       */
      const requested = context.parameters.theme ?? context.globals.theme;
      const theme = requested === "dark" ? "dark" : "light";
      const density = context.parameters.density ?? context.globals.density ?? "medium";

      return (
        <div
          data-density={density}
          // The library keys dark mode off `[data-theme="dark"]` and treats the
          // absence of the attribute as light, so light must not set it.
          data-theme={theme === "dark" ? "dark" : undefined}
          style={{
            // These are the real token names. An earlier version of this file
            // used `--color-background` / `--color-foreground`, which the
            // library has never defined, so the dark canvas stayed white.
            backgroundColor: "var(--finra-color-background)",
            color: "var(--finra-color-foreground)",
            // Makes the browser's own UI (scrollbars, focus rings on native
            // controls, autofill) follow the story's theme rather than the OS.
            colorScheme: theme,
            padding: "1rem",
            minHeight: "100%",
          }}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
