import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip, TooltipContent, TooltipTrigger } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { overlayPanel, triggerButton } from "./_demoStyles";

const meta: Meta<typeof Tooltip> = {
  title: "Unstyled/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    // Zero delay so the interaction is snappy in the demo (default is 700ms).
    <Tooltip openDelay={0} closeDelay={0}>
      <TooltipTrigger style={triggerButton}>Hover me</TooltipTrigger>
      <TooltipContent style={{ ...overlayPanel, maxWidth: 200, fontSize: "0.8125rem" }}>
        Tooltips portal out and follow the trigger.
      </TooltipContent>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Hover me" });
    await userEvent.hover(trigger);
    const tip = await within(document.body).findByRole("tooltip");
    await expect(tip).toBeVisible();
    await userEvent.unhover(trigger);
    await waitFor(() => expect(within(document.body).queryByRole("tooltip")).toBeNull());
  },
};
