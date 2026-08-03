import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberInputBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof NumberInputBase> = {
  title: "Unstyled/NumberInputBase",
  component: NumberInputBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("input", "input element") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
      <NumberInputBase placeholder="Unstyled number input" aria-label="Default number input" />
      <NumberInputBase defaultValue="42" aria-label="Number input with value" />
      <NumberInputBase placeholder="Disabled" disabled aria-label="Disabled number input" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default number input");
    await expect(input).toBeVisible();
    await userEvent.type(input, "123");
    await expect(input).toHaveValue("123");
  },
};
