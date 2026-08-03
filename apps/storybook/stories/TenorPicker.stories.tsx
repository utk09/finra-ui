import type { Meta, StoryObj } from "@storybook/react-vite";
import { TenorPicker } from "@utk09/finra-ui-finance";
import { TenorPickerBase } from "@utk09/finra-ui-finance/unstyled";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { inDark, nativeFieldArgTypes } from "./_shared";

const meta: Meta<typeof TenorPicker> = {
  title: "Finance/TenorPicker",
  component: TenorPicker,
  parameters: {
    layout: "centered",
    // Docgen does not follow `extends` across modules, so without this the props
    // the base declares are missing from the table. The omit list mirrors the
    // `Omit<TenorPickerBaseProps, …>` in `TenorPickerProps`, or the table would
    // advertise props this component does not accept.
    docs: {
      inheritsFrom: TenorPickerBase,
      inheritedOmit: [
        "classNames",
        "dataAttributes",
        "renderIndicator",
        "renderFavourite",
        "renderCheck",
      ],
    },
  },
  // The favourite star is decorative (click it, or Ctrl+D), so options contain
  // no nested interactive controls and the a11y gate applies.
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    "aria-label": nativeFieldArgTypes["aria-label"],
    // Named here because the value is an array: `condenseDefault` can recover a
    // function's name from its source but not a constant's, so an array default
    // reaches the cell as a shape hint unless the story says what it is.
    tenors: { table: { defaultValue: { summary: "STANDARD_TENORS" } } },
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
 * Type a free-form tenor - short (`3m`), long (`3 months`), or compound (`1y6m`).
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

/** Flat, ungrouped list - the drop-in replacement for the deprecated `TenorInput`. */
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

/**
 * Restyling the field and its grouped list. The popup renders inside the root
 * rather than in a portal, so an override on an ancestor reaches it with no
 * `container` needed.
 *
 * Semantic tokens carry the accent and radius. The group heading's casing and the
 * favourite star's size are library decisions with no token behind them, and are
 * reached through `[data-finra-ui="tenor-picker-group-label"]` and
 * `[data-finra-ui="tenor-picker-favourite"]`, which win because the library ships
 * inside `@layer finra-ui`.
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
      <div style={{ inlineSize: "14rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Default</p>
        <TenorPicker aria-label="Default tenor" value="3M" favourites={["3M", "1Y"]} />
      </div>
      <div
        className="tenor-picker-override-demo"
        style={
          {
            inlineSize: "14rem",
            "--finra-actionable-emphasis": "#b45309",
            "--finra-actionable-accent-subtle": "#fef3c7",
            "--finra-radius-md": "0.75rem",
          } as React.CSSProperties
        }>
        <style>{`
          :where(.tenor-picker-override-demo) [data-finra-ui="tenor-picker-group-label"] {
            text-transform: none;
            letter-spacing: var(--finra-tracking-normal);
            font-size: var(--finra-text-sm);
          }
          :where(.tenor-picker-override-demo) [data-finra-ui="tenor-picker-favourite"] {
            font-size: var(--finra-text-lg);
          }
        `}</style>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Overridden</p>
        <TenorPicker aria-label="Overridden tenor" value="3M" favourites={["3M", "1Y"]} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // Open it, so the group headings and stars being overridden are on screen.
    // A resting-state view shows none of those parts.
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "Overridden tenor" }));
    await waitFor(async () =>
      expect(await canvas.findByRole("group", { name: "Favourites" })).toBeVisible(),
    );
  },
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);

/**
 * Secondary variant in dark mode, with a value on screen.
 *
 * The value is the point. This variant paints its own field surface, and a
 * placeholder is drawn in the muted colour, so an empty field looks correct
 * even when the surface and the text resolve to the same colour. Only a
 * populated field puts that in front of the accessibility check.
 */
export const SecondaryVariantDark: Story = inDark({
  ...WithValue,
  args: { ...WithValue.args, variant: "secondary" },
});
