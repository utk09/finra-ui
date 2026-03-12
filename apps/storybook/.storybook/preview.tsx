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
