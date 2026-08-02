import { addons } from "storybook/manager-api";

import { lightTheme } from "./theme";

/**
 * The manager (sidebar, toolbar, addon panels) renders outside the preview
 * iframe, so it cannot read the `data-theme` global the stories use. It gets a
 * fixed light theme; the toolbar's Theme control still switches the preview and
 * the docs pages, which is where the components actually are.
 */
addons.setConfig({
  theme: lightTheme,
  sidebar: {
    showRoots: true,
  },
});
