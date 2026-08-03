import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckboxBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof CheckboxBase> = {
  title: "Unstyled/CheckboxBase",
  component: CheckboxBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("input", "checkbox input") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label htmlFor="cb-accept" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-accept" aria-label="Accept terms" /> Accept terms
      </label>
      <label htmlFor="cb-checked" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-checked" defaultChecked aria-label="Checked" /> Checked
      </label>
      <label htmlFor="cb-disabled" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-disabled" disabled aria-label="Disabled" /> Disabled
      </label>
      <label
        htmlFor="cb-indeterminate"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckboxBase id="cb-indeterminate" indeterminate aria-label="Indeterminate" />{" "}
        Indeterminate
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByLabelText("Accept terms");
    await expect(checkbox).toBeVisible();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};
