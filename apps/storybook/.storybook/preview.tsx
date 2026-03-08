import type { Preview } from "@storybook/react-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import "@utk09/finra-ui/styles";

const preview: Preview = {
  tags: ["autodocs", "a11y-test"],
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
    withThemeByDataAttribute({
      themes: {
        light: "light",
        dark: "dark",
      },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
