import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTenorInputBase } from "@utk09/finra-ui-finance/unstyled";
import { expect, within } from "storybook/test";

const meta: Meta<typeof DateTenorInputBase> = {
  title: "Unstyled/DateTenorInputBase",
  component: DateTenorInputBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 400 }}>
      <DateTenorInputBase dateAriaLabel="Date" tenorAriaLabel="Tenor" />
      <DateTenorInputBase
        dateAriaLabel="With values date"
        tenorAriaLabel="With values tenor"
        dateValue={new Date(2026, 5, 11)}
        tenorValue="3M"
      />
      <DateTenorInputBase dateAriaLabel="Disabled date" tenorAriaLabel="Disabled tenor" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Date");
    await expect(input).toBeVisible();
  },
};
