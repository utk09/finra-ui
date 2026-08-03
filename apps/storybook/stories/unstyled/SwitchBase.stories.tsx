import type { Meta, StoryObj } from "@storybook/react-vite";
import { SwitchBase } from "@utk09/finra-ui/unstyled";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof SwitchBase> = {
  title: "Unstyled/SwitchBase",
  component: SwitchBase,
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
      <label
        htmlFor="sw-notifications"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <SwitchBase id="sw-notifications" aria-label="Toggle notifications" /> Notifications
      </label>
      <label htmlFor="sw-active" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <SwitchBase id="sw-active" defaultChecked aria-label="Active switch" /> Active
      </label>
      <label htmlFor="sw-disabled" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <SwitchBase id="sw-disabled" disabled aria-label="Disabled switch" /> Disabled
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByLabelText("Toggle notifications");
    await expect(switchEl).toBeVisible();
    await userEvent.click(switchEl);
    await expect(switchEl).toBeChecked();
  },
};
