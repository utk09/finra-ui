import type { Meta, StoryObj } from "@storybook/react-vite";
import { FocusScope } from "@utk09/finra-ui/unstyled";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { overlayPanel, triggerButton } from "./_demoStyles";

const meta: Meta<typeof FocusScope> = {
  title: "Unstyled/FocusScope",
  component: FocusScope,
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
          Activate scope
        </button>
        {open ? (
          <FocusScope style={{ ...overlayPanel, marginTop: 8, display: "flex", gap: "0.5rem" }}>
            <button type="button" style={triggerButton}>
              First
            </button>
            <button type="button" style={triggerButton}>
              Second
            </button>
            <button type="button" style={triggerButton} onClick={() => setOpen(false)}>
              Close
            </button>
          </FocusScope>
        ) : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Activate scope" }));
    // Focus moves to the first tabbable inside the scope on mount.
    await waitFor(() => expect(canvas.getByRole("button", { name: "First" })).toHaveFocus());
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Second" })).toHaveFocus();
    // Closing unmounts the scope and restores focus to the trigger.
    await userEvent.click(canvas.getByRole("button", { name: "Close" }));
    await expect(canvas.getByRole("button", { name: "Activate scope" })).toHaveFocus();
  },
};
