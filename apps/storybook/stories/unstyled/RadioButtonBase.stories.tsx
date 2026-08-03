import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioButtonBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof RadioButtonBase> = {
  title: "Unstyled/RadioButtonBase",
  component: RadioButtonBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("input", "radio input") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label htmlFor="rb-option-a" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioButtonBase id="rb-option-a" name="rb-group" aria-label="Option A" /> Option A
      </label>
      <label htmlFor="rb-option-b" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioButtonBase id="rb-option-b" name="rb-group" defaultChecked aria-label="Option B" />{" "}
        Option B (checked)
      </label>
      <label htmlFor="rb-option-c" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <RadioButtonBase id="rb-option-c" name="rb-group" disabled aria-label="Option C" /> Option C
        (disabled)
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const radio = canvas.getByLabelText("Option A");
    await expect(radio).toBeVisible();
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
  },
};
