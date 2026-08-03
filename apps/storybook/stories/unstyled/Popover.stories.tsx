import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { overlayPanel, triggerButton } from "./_demoStyles";

const meta: Meta<typeof Popover> = {
  title: "Unstyled/Popover",
  component: Popover,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger style={triggerButton}>Open popover</PopoverTrigger>
      <PopoverContent style={overlayPanel}>
        <p style={{ marginTop: 0 }}>A popover portals out with a focus trap and outside-dismiss.</p>
        <PopoverClose style={triggerButton}>Close</PopoverClose>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open popover" }));
    const panel = await within(document.body).findByRole("dialog");
    await expect(panel).toBeVisible();
    await userEvent.click(within(panel).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
  },
};
