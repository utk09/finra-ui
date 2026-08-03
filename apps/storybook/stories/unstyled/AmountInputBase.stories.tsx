import type { Meta, StoryObj } from "@storybook/react-vite";
import { AmountInputBase } from "@utk09/finra-ui-finance/unstyled";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof AmountInputBase> = {
  title: "Unstyled/AmountInputBase",
  component: AmountInputBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Human notation in, a real number out. `10m` commits `10000000` - the
 * shorthand is an input grammar, never the state. Focus shows the full digits
 * (a caret among group separators is hostile to edit); blur shows the formatted
 * value, abbreviated only where that loses nothing.
 */
export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
      <AmountInputBase
        aria-label="Notional"
        locale="en-US"
        currency="USD"
        step={1_000_000}
        defaultValue={1_230_000}
      />
      <AmountInputBase aria-label="Exact notional" locale="en-US" defaultValue={1_500_123} />
      <AmountInputBase aria-label="Disabled notional" locale="en-US" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Notional" });

    // 1500123 has no exact abbreviation, so it is left whole rather than
    // rounded to 1.5M.
    await expect(canvas.getByRole("spinbutton", { name: "Exact notional" })).toHaveValue(
      "1,500,123",
    );

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "10m");
    await userEvent.tab();
    await expect(input).toHaveValue("$10M");
  },
};
