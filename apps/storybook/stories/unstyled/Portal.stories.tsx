import type { Meta, StoryObj } from "@storybook/react-vite";
import { Portal } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { overlayPanel } from "./_demoStyles";

const meta: Meta<typeof Portal> = {
  title: "Unstyled/Portal",
  component: Portal,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div>
      <p>This paragraph renders in place, inside the story canvas.</p>
      <Portal>
        <div style={{ ...overlayPanel, marginTop: 8 }}>
          Portalled to <code>document.body</code> - it escapes ancestor overflow/z-index/transform.
        </div>
      </Portal>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The portalled node is NOT inside the story canvas...
    await expect(canvas.queryByText(/Portalled to/)).toBeNull();
    // ...it lives under document.body.
    await expect(await within(document.body).findByText(/Portalled to/)).toBeVisible();
  },
};
