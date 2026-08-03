import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof InputBase> = {
  title: "Unstyled/InputBase",
  component: InputBase,
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
      <InputBase placeholder="Unstyled input" aria-label="Default input" />
      <InputBase defaultValue="With value" aria-label="Input with value" />
      <InputBase placeholder="Disabled" disabled aria-label="Disabled input" />
      <InputBase defaultValue="Read-only" readOnly aria-label="Read-only input" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default input");
    await expect(input).toBeVisible();
    await userEvent.type(input, "Hello");
    await expect(input).toHaveValue("Hello");
  },
};
