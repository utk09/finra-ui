import type { Meta, StoryObj } from "@storybook/react-vite";
import { PriceInput } from "@utk09/finra-ui-finance";
import { PriceInputBase } from "@utk09/finra-ui-finance/unstyled";
import { formatPrice, parsePrice } from "@utk09/finra-ui-finance/utils";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { inDark } from "./_shared";

const meta: Meta<typeof PriceInput> = {
  title: "Finance/PriceInput",
  component: PriceInput,
  parameters: {
    layout: "centered",
    // Docgen does not follow `extends` across modules, so the base's props are
    // otherwise missing from the table.
    docs: {
      inheritsFrom: PriceInputBase,
      // Mirrors the `Omit` on the styled props: these are the styled layer's
      // own injection points, not consumer API.
      inheritedOmit: ["classNames", "dataAttributes", "renderDisplay"],
    },
  },
  // Autodocs only for now (spinbutton ARIA value semantics vary by empty state);
  // enable a11y-test once the resting/empty states are verified against axe.
  tags: ["autodocs"],
  argTypes: {
    format: {
      control: "select",
      options: ["decimal", "bond32", "percent", "basis-points"],
      table: { defaultValue: { summary: "decimal" } },
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      table: { defaultValue: { summary: "primary" } },
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
    tickValidation: {
      control: "select",
      options: [undefined, "reject", "warn", "round", "snap"],
    },
    digitHierarchy: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    fullWidth: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    disabled: { control: "boolean", table: { defaultValue: { summary: "false" } } },
  },
  args: {
    "aria-label": "Price",
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 220 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * FX spot, the trader view: `1.23456` renders as a small **big figure**
 * (`1.23`), large bold **pips** (`45`, the focal digits), and a medium bold
 * **fractional pip** (`6`). Focus lands on the pips, ready to edit. ↑/↓ = 1 tick.
 */
export const FXSpot: Story = {
  args: {
    primaryPrecision: 4,
    precisionDigits: 1,
    tickSize: 0.00001,
    digitHierarchy: true,
    pipDigits: 2,
    bigFigureDigits: 2,
    selectOnFocus: "pips",
    defaultValue: 1.23456,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Price" });
    // The three zones are rendered as distinct overlay spans.
    await expect(canvas.getByText("1.23")).toBeInTheDocument(); // big figure
    await expect(canvas.getByText("45")).toBeInTheDocument(); // pips
    await expect(canvas.getByText("6")).toBeInTheDocument(); // fractional pip

    input.focus();
    await userEvent.keyboard("{ArrowUp}"); // +1 tick (0.00001)
    await expect(input).toHaveValue("1.23457");
  },
};

/** FX forward points, same 3-zone trader view with a finer big figure. */
export const FXForward: Story = {
  args: {
    primaryPrecision: 4,
    precisionDigits: 1,
    tickSize: 0.00001,
    digitHierarchy: true,
    pipDigits: 2,
    bigFigureDigits: 2,
    selectOnFocus: "pips",
    defaultValue: 1.09012,
  },
};

/**
 * The two-tier hierarchy, for quotes with no pips convention. Leave `pipDigits`
 * unset and `primaryPrecision` splits the fraction instead: primary digits at
 * full size, trailing precision digits smaller. The sign and the unit are
 * segments of their own.
 */
export const DecimalHierarchy: Story = {
  args: {
    format: "percent",
    digitHierarchy: true,
    primaryPrecision: 2,
    precisionDigits: 1,
    tickSize: 0.001,
    defaultValue: -0.125,
  },
};

/** US Treasury price in 32nds. ↑/↓ steps 1/32; `101-16+` = +1/64. */
export const BondPrice: Story = {
  args: {
    format: "bond32",
    defaultValue: 101.5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Price" });
    await expect(input).toHaveValue("101-16");
    input.focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("101-17");
  },
};

/** Percentage (e.g. a yield). */
export const Percentage: Story = {
  args: {
    format: "percent",
    precision: 3,
    tickSize: 0.001,
    defaultValue: 4.125,
  },
};

/** Basis points. */
export const BasisPoints: Story = {
  args: {
    format: "basis-points",
    precision: 1,
    tickSize: 0.5,
    defaultValue: 15,
  },
};

/** Tick-size validation: off-tick commits snap to the nearest 0.05. */
export const TickSizeDemo: Story = {
  args: {
    format: "decimal",
    precision: 2,
    tickSize: 0.05,
    tickValidation: "snap",
    defaultValue: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Price" });
    await userEvent.clear(input);
    await userEvent.type(input, "1.07");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("1.05"); // snapped
  },
};

/** Replace the formatter/parser - here values carry a `$` prefix. */
export const CustomFormatter: Story = {
  args: {
    precision: 2,
    defaultValue: 1234.5,
    formatter: (value) => `$${formatPrice(value, { precision: 2 })}`,
    parser: (input) => parsePrice(input.replace(/\$/g, ""), { precision: 2 }),
  },
};

/** Value constrained to a range; out-of-range commits are rejected. */
export const Validation: Story = {
  render: (args) => {
    const [status, setStatus] = useState<"error" | undefined>(undefined);
    return (
      <PriceInput
        {...args}
        precision={2}
        min={0}
        max={100}
        defaultValue={50}
        validationStatus={status}
        onValidate={(r) => setStatus(r.valid ? undefined : "error")}
        onChange={() => setStatus(undefined)}
      />
    );
  },
};

/**
 * Which zone of a rate a desk emphasises is a house convention, so every zone of
 * the digit hierarchy carries its own id: `price-input-big-figure`,
 * `price-input-pips`, `price-input-fractional-pip`, and one each for
 * `sign`, `integer`, `separator`, `primary`, `precision` and `unit`. Colour,
 * size and weight are all yours.
 *
 * ```css
 * [data-finra-ui="price-input-big-figure"] {
 *   color: #64748b;
 *   font-size: 0.66em;
 * }
 * [data-finra-ui="price-input-pips"] {
 *   color: #0f766e;
 *   font-size: 1.2em;
 * }
 * [data-finra-ui="price-input-fractional-pip"] {
 *   color: #b45309;
 *   font-size: 1em;
 * }
 * ```
 *
 * Those selectors are no more specific than the library's own, and they still
 * win, because everything the library ships sits in `@layer finra-ui` and your
 * stylesheet does not. The `:where()` wrapper below only stops the demo
 * touching the rest of this page; it contributes no specificity.
 *
 * The field chrome follows the usual tokens, so `--finra-actionable-emphasis`
 * recolours the focus ring and `--finra-status-danger-accent` the error border.
 */
export const Overrides: Story = {
  args: {
    primaryPrecision: 4,
    precisionDigits: 1,
    tickSize: 0.00001,
    digitHierarchy: true,
    pipDigits: 2,
    bigFigureDigits: 2,
    defaultValue: 1.23456,
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
      <div style={{ inlineSize: 200 }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Default</p>
        <PriceInput {...args} aria-label="Default price" />
      </div>
      <div className="price-hierarchy-demo" style={{ inlineSize: 200 }}>
        <style>{`
          :where(.price-hierarchy-demo) [data-finra-ui="price-input-big-figure"] {
            color: #64748b;
            font-size: 0.66em;
          }
          :where(.price-hierarchy-demo) [data-finra-ui="price-input-pips"] {
            color: #0f766e;
            font-size: 1.2em;
          }
          :where(.price-hierarchy-demo) [data-finra-ui="price-input-fractional-pip"] {
            color: #b45309;
            font-size: 1em;
          }
        `}</style>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Overridden</p>
        <PriceInput {...args} aria-label="Overridden price" />
      </div>
    </div>
  ),
};

/** Dark-mode counterpart of `FXSpot`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(FXSpot);

/**
 * Secondary variant in dark mode, with a value on screen.
 *
 * The value is the point. This variant paints its own field surface, and a
 * placeholder is drawn in the muted colour, so an empty field looks correct
 * even when the surface and the text resolve to the same colour. Only a
 * populated field puts that in front of the accessibility check.
 */
export const SecondaryVariantDark: Story = inDark({
  ...FXSpot,
  args: { ...FXSpot.args, variant: "secondary" },
});
