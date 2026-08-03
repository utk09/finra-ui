import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTenorPickerBase } from "@utk09/finra-ui-finance/unstyled";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof DateTenorPickerBase> = {
  title: "Unstyled/DateTenorPickerBase",
  component: DateTenorPickerBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One field accepting either an absolute date or a relative tenor. The mode is
 * decided by the parser, not by a toggle, and the resolved date is derived - so
 * all of it is visible without a stylesheet.
 */
export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 340 }}>
      <DateTenorPickerBase
        aria-label="Value date"
        referenceDate={new Date(2026, 5, 11)}
        showResolvedDate
        // The base takes a renderer, not a boolean: what a mode badge *looks
        // like* is the styled layer's business.
        renderModeIndicator={(mode) => (mode ? `[${mode}]` : null)}
      />
      <DateTenorPickerBase aria-label="Disabled value date" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Value date" });

    // A tenor resolves against referenceDate; an absolute date would not.
    await userEvent.type(input, "3M");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("3M");
  },
};
