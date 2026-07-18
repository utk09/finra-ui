import type { Meta, StoryObj } from "@storybook/react-vite";
import { TenorPicker } from "@utk09/finra-ui-finance";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

const meta: Meta<typeof TenorPicker> = {
  title: "Finance/TenorPicker",
  component: TenorPicker,
  parameters: {
    layout: "centered",
  },
  // Autodocs only (no a11y-test): the open popup is a roving listbox whose
  // options carry a nested favourite-toggle button. Axe's nested-interactive
  // gate for that pattern is tracked with the other listbox a11y work in
  // Phase 6; add "a11y-test" once it lands (mirrors DateTenorPicker).
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      table: { defaultValue: { summary: "primary" } },
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
    allowCustom: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    showFavourites: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    fullWidth: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    disabled: { control: "boolean", table: { defaultValue: { summary: "false" } } },
  },
  args: {
    "aria-label": "Tenor",
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 260 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Default market tenor set, grouped by Overnight / Weeks / Months / Years. */
export const Default: Story = {};

/** Pre-selected value echoes its canonical form into the field. */
export const WithValue: Story = {
  args: { value: "3M" },
};

/**
 * Type a free-form tenor — short (`3m`), long (`3 months`), or compound (`1y6m`).
 * The parser canonicalises it on commit.
 */
export const FreeFormParsing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Tenor" });
    await userEvent.type(input, "1y6m");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("1Y6M");
  },
};

/** Favourited tenors are lifted into a pinned group; toggle with the star. */
export const Favourites: Story = {
  render: (args) => {
    const [favourites, setFavourites] = useState<string[]>(["3M", "1Y"]);
    return (
      <TenorPicker
        {...args}
        favourites={favourites}
        onFavouriteChange={(_tenor, _active, next) => setFavourites(next)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "Tenor" }));
    await expect(canvas.getByRole("group", { name: "Favourites" })).toBeInTheDocument();
  },
};

/** Reorder and hide groups, and relabel a heading. */
export const CustomGroups: Story = {
  args: {
    groupOrder: ["years", "months", "weeks"],
    hiddenGroups: ["overnight", "tomorrow", "spot"],
    groupLabels: { years: "Long-dated" },
  },
};

/** Individual tenors can be disabled. */
export const DisabledTenors: Story = {
  args: {
    disabledTenors: ["ON", "TN", "SN", "1W"],
  },
};

/** Restrict to a curated list and forbid free-form entry. */
export const FixedList: Story = {
  args: {
    tenors: ["1M", "3M", "6M", "1Y"],
    allowCustom: false,
    showFavourites: false,
    placeholder: "Select a tenor…",
  },
};

/** Flat, ungrouped list — the drop-in replacement for the deprecated `TenorInput`. */
export const Flat: Story = {
  args: {
    grouped: false,
    showFavourites: false,
    placeholder: "Select tenor…",
  },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export const Validation: Story = {
  args: { validationStatus: "error", value: "3M" },
};

export const Disabled: Story = {
  args: { disabled: true, value: "3M" },
};
