import "@utk09/finra-ui/styles";

import type { Preview } from "@storybook/react-vite";

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
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    a11y: {
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
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";
      const density = context.globals.density || "medium";

      return (
        <div
          data-density={density}
          data-theme={theme === "dark" ? "dark" : undefined}
          style={{
            backgroundColor: "var(--color-background)",
            color: "var(--color-foreground)",
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
