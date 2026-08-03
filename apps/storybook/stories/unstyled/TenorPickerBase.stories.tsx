import type { Meta, StoryObj } from "@storybook/react-vite";
import { TenorPickerBase } from "@utk09/finra-ui-finance/unstyled";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof TenorPickerBase> = {
  title: "Unstyled/TenorPickerBase",
  component: TenorPickerBase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Grouped tenor selection with no styling: the groups are real `role="group"`
 * containers, the favourite star is a decorative span (a listbox option may own
 * no interactive descendant), and free-form entry canonicalises on commit.
 */
export const Default: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 300 }}>
      <TenorPickerBase
        aria-label="Default tenor"
        placeholder="Select or type a tenor..."
        defaultFavourites={["3M"]}
        renderFavourite={(active) => (active ? "*" : "-")}
      />
      <TenorPickerBase aria-label="Flat tenor" grouped={false} showFavourites={false} />
      <TenorPickerBase aria-label="Disabled tenor" disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Default tenor" });

    // Free-form entry is canonicalised by the parser, unstyled included.
    await userEvent.type(input, "1y6m");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("1Y6M");
  },
};
