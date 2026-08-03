import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateInputBase } from "@utk09/finra-ui-finance/unstyled";
import { expect, within } from "storybook/test";

const meta: Meta<typeof DateInputBase> = {
  title: "Unstyled/DateInputBase",
  component: DateInputBase,
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
      <DateInputBase aria-label="Default date" />
      <DateInputBase
        format="MM/DD/YYYY"
        value={new Date(2024, 2, 15)}
        aria-label="US format date"
      />
      <DateInputBase disabled value={new Date(2024, 0, 1)} aria-label="Disabled date" />
      <DateInputBase readOnly value={new Date(2024, 5, 20)} aria-label="Read-only date" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Default date");
    await expect(input).toBeVisible();
  },
};
