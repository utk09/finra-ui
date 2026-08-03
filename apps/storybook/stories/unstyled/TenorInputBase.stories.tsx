import type { Meta, StoryObj } from "@storybook/react-vite";
import { TenorInputBase } from "@utk09/finra-ui-finance/unstyled";
import { expect, within } from "storybook/test";

const meta: Meta<typeof TenorInputBase> = {
  title: "Unstyled/TenorInputBase",
  component: TenorInputBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
      <TenorInputBase aria-label="Default tenor" placeholder="Select tenor..." />
      <TenorInputBase aria-label="With value" value="3M" />
      <TenorInputBase aria-label="Disabled tenor" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default tenor");
    await expect(input).toBeVisible();
  },
};
