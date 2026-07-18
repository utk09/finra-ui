import type { Meta, StoryObj } from "@storybook/react-vite";
import { PriceInput } from "@utk09/finra-ui-finance";
import { formatPrice, parsePrice } from "@utk09/finra-ui-finance/utils";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

const meta: Meta<typeof PriceInput> = {
  title: "Finance/PriceInput",
  component: PriceInput,
  parameters: {
    layout: "centered",
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
