import type { Meta, StoryObj } from "@storybook/react-vite";
import { PriceInputBase } from "@utk09/finra-ui-finance/unstyled";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof PriceInputBase> = {
  title: "Unstyled/PriceInputBase",
  component: PriceInputBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Market price entry. The digit hierarchy (big figure vs pips) is expressed as
 * segment elements the styled layer colours - unstyled, the value and the tick
 * arithmetic are still exactly right, which is the point of the split.
 */
export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
      <PriceInputBase
        aria-label="FX rate"
        instrument={{ primaryPrecision: 4, precisionDigits: 1, tickSize: 0.00005 }}
        defaultValue={1.0834}
      />
      <PriceInputBase aria-label="Yield" precision={3} tickSize={0.001} defaultValue={4.125} />
      <PriceInputBase aria-label="Disabled rate" precision={2} disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "FX rate" });

    // ArrowUp steps one tick - 0.00005, not 1 - because the instrument says so.
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("1.08345");
  },
};
