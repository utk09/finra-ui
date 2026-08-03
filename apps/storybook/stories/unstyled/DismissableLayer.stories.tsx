import type { Meta, StoryObj } from "@storybook/react-vite";
import { DismissableLayer } from "@utk09/finra-ui/unstyled";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { overlayPanel, triggerButton } from "./_demoStyles";

const meta: Meta<typeof DismissableLayer> = {
  title: "Unstyled/DismissableLayer",
  component: DismissableLayer,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <button type="button" style={triggerButton} onClick={() => setOpen(true)}>
          Open layer
        </button>
        {open ? (
          <DismissableLayer
            onDismiss={() => setOpen(false)}
            style={{ ...overlayPanel, marginTop: 8 }}>
            <p style={{ margin: 0 }}>Press Escape or click outside to dismiss.</p>
          </DismissableLayer>
        ) : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open layer" }));
    await expect(canvas.getByText(/click outside to dismiss/i)).toBeVisible();
    // Escape dismisses the topmost layer.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByText(/click outside to dismiss/i)).toBeNull());
  },
};
