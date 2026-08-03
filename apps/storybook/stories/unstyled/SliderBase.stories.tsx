import type { Meta, StoryObj } from "@storybook/react-vite";
import { SliderBase } from "@utk09/finra-ui/unstyled";
import { expect, within } from "storybook/test";

import { forwardsTo } from "../_shared";

const meta: Meta<typeof SliderBase> = {
  title: "Unstyled/SliderBase",
  component: SliderBase,
  parameters: {
    layout: "padded",
    docs: { forwardsTo: forwardsTo("input", "range input") },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 300 }}>
      <label
        htmlFor="sl-default"
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Volume
        <SliderBase id="sl-default" min={0} max={100} defaultValue={50} aria-label="Volume" />
      </label>
      <label
        htmlFor="sl-stepped"
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Stepped (10)
        <SliderBase
          id="sl-stepped"
          min={0}
          max={100}
          step={10}
          defaultValue={30}
          aria-label="Stepped"
        />
      </label>
      <label
        htmlFor="sl-disabled"
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Disabled
        <SliderBase
          id="sl-disabled"
          min={0}
          max={100}
          defaultValue={70}
          disabled
          aria-label="Disabled"
        />
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByLabelText("Volume");
    await expect(slider).toBeVisible();
  },
};
