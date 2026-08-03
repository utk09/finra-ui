import type { Meta, StoryObj } from "@storybook/react-vite";
import { AmountInput } from "@utk09/finra-ui-finance";
import { AmountInputBase } from "@utk09/finra-ui-finance/unstyled";
import { compactSuffixesForLocale } from "@utk09/finra-ui-finance/utils";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { inDark, TokenScope } from "./_shared";

const meta: Meta<typeof AmountInput> = {
  title: "Finance/AmountInput",
  component: AmountInput,
  parameters: {
    layout: "centered",
    // Docgen does not follow `extends` across modules, so the base's props are
    // otherwise missing from the table.
    docs: {
      inheritsFrom: AmountInputBase,
      // Mirrors the `Omit` on the styled props: these are the styled layer's
      // own injection points, not consumer API.
      inheritedOmit: ["classNames", "dataAttributes"],
    },
  },
  // Autodocs only for now, matching PriceInput: spinbutton ARIA value semantics
  // vary by empty state, so a11y-test waits until those are verified against axe.
  tags: ["autodocs"],
  argTypes: {
    format: {
      control: "select",
      options: ["compact", "full", "accounting", "plain"],
      table: { defaultValue: { summary: "compact" } },
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
    currency: { control: "text" },
    step: { control: "number", table: { defaultValue: { summary: "1" } } },
    fullWidth: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    disabled: { control: "boolean", table: { defaultValue: { summary: "false" } } },
  },
  args: {
    "aria-label": "Notional",
    locale: "en-US",
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
 * The point of the component: type how a trader talks. `1.23M`, `10m`, `2bn`
 * and `1e5` all resolve to a real number, and that number - never the
 * shorthand - is what `onChange` reports and what the field holds.
 *
 * Focus shows the full digits, because a caret in a string full of separators
 * is hostile to edit. Blur shows the formatted value.
 */
export const Shorthand: Story = {
  args: {
    currency: "USD",
    step: 1_000_000,
    defaultValue: 1_230_000,
  },
};

/**
 * The same field, driven end to end: `2bn` in, `2000000000` held, `$2B` at
 * rest.
 *
 * Kept apart from `Shorthand` because a story carrying an interaction
 * replays it on every visit - the field types itself, which is useful to watch
 * once and distracting when you opened the page to look at the component.
 */
export const ShorthandInteraction: Story = {
  args: {
    currency: "USD",
    step: 1_000_000,
    defaultValue: 1_230_000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Notional" });

    await expect(input).toHaveValue("$1.23M");

    // Focused: the plain, editable digits.
    await userEvent.click(input);
    await expect(input).toHaveValue("1230000");

    await userEvent.clear(input);
    await userEvent.type(input, "2bn");

    // Enter commits without leaving the field, so the expansion is shown in
    // full - confirmation that the shorthand resolved to a real number.
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("2000000000");

    await userEvent.tab();
    await expect(input).toHaveValue("$2B");
  },
};

/**
 * Abbreviation happens **only when it costs nothing**. `1,500,000` is exactly
 * `1.5M`, so it abbreviates; `1,500,123` is not, so it stays whole rather than
 * rounding itself into a different notional.
 */
export const NeverRounds: Story = {
  args: {
    defaultValue: 1_500_123,
  },
};

/** Retyping the same amount without the stray digits lets it abbreviate. */
export const NeverRoundsInteraction: Story = {
  args: {
    defaultValue: 1_500_123,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Notional" });

    await expect(input).toHaveValue("1,500,123");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "1500000");
    await userEvent.tab();
    await expect(input).toHaveValue("1.5M");
  },
};

/**
 * `format="full"` opts out of abbreviation entirely - the amount is always
 * shown grouped and whole, however large, with the currency's own precision.
 *
 * Shorthand still works on the way *in*: `10m` commits `10000000` and rests as
 * `$10,000,000.00`. The format controls display only; it never touches what the
 * field parses or what it holds.
 */
export const FullNotation: Story = {
  args: {
    format: "full",
    currency: "USD",
    step: 1_000_000,
    defaultValue: 2_500_000_000,
  },
};

/** `10m` in, `$10,000,000.00` at rest - the format never touches what is parsed. */
export const FullNotationInteraction: Story = {
  args: {
    format: "full",
    currency: "USD",
    step: 1_000_000,
    defaultValue: 2_500_000_000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Notional" });

    // The default `compact` would render this "2.5B".
    await expect(input).toHaveValue("$2,500,000,000.00");

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "10m");
    await userEvent.tab();
    await expect(input).toHaveValue("$10,000,000.00");
  },
};

/**
 * `K`/`M`/`B`/`T` ship by default (`bn` is read as an alias for `B`, though the
 * field always writes `B`). Anything else is opt-in, so an unconfigured house
 * convention fails loudly instead of committing a value off by 10⁶.
 */
export const CustomSuffixes: Story = {
  args: {
    suffixes: compactSuffixesForLocale("en-IN"),
    defaultValue: 25_000_000,
  },
};

/** `1.5Cr` parses and rests as `1.5Cr`, because the table defines both directions. */
export const CustomSuffixesInteraction: Story = {
  args: {
    suffixes: compactSuffixesForLocale("en-IN"),
    defaultValue: 25_000_000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Notional" });

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "1.5Cr");
    await userEvent.tab();
    await expect(input).toHaveValue("1.5Cr");
  },
};

/** Per-currency precision comes from `Intl`: JPY has no minor unit, KWD has three. */
export const Currencies: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <AmountInput {...args} aria-label="USD" currency="USD" defaultValue={1234.5} />
      <AmountInput {...args} aria-label="JPY" currency="JPY" defaultValue={1500} />
      <AmountInput {...args} aria-label="KWD" currency="KWD" defaultValue={1234.567} />
      <AmountInput {...args} aria-label="EUR" currency="EUR" locale="de-DE" defaultValue={2.5e9} />
    </div>
  ),
};

/** Accounting convention: negatives in parentheses, and `(1,234)` parses back. */
export const Accounting: Story = {
  args: {
    format: "accounting",
    currency: "USD",
    defaultValue: -1234.5,
  },
};

/**
 * Stepping is prop-driven, because every desk wants its own. Arrow steps by
 * `step`; Shift+Arrow and PageUp/PageDown step by `largeStep` (ten steps by
 * default).
 */
export const Stepping: Story = {
  args: {
    step: 100_000,
    largeStep: 1_000_000,
    defaultValue: 1_000_000,
  },
};

/** Arrow steps by `step`, PageUp by `largeStep`, both in the editable form. */
export const SteppingInteraction: Story = {
  args: {
    step: 100_000,
    largeStep: 1_000_000,
    defaultValue: 1_000_000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton", { name: "Notional" });

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("1100000");

    await userEvent.keyboard("{PageUp}");
    await expect(input).toHaveValue("2100000");
  },
};

/** Value constrained to a range; out-of-range commits revert. */
export const Validation: Story = {
  render: (args) => {
    const [status, setStatus] = useState<"error" | undefined>(undefined);
    return (
      <AmountInput
        {...args}
        min={0}
        max={10_000_000}
        defaultValue={5_000_000}
        validationStatus={status}
        onValidate={(result) => setStatus(result.valid ? undefined : "error")}
        onChange={() => setStatus(undefined)}
      />
    );
  },
};

/**
 * Controlled: the parent owns the value, and the field shows whatever the
 * parent settled on.
 *
 * The second field rejects any amount above 10M. Type `50m` into it and the
 * display comes back to the parent's value rather than keeping the number it
 * proposed - a controlled field must never show one amount while `value` holds
 * another.
 */
export const Controlled: Story = {
  render: (args) => {
    const [free, setFree] = useState<number | null>(1_230_000);
    const [capped, setCapped] = useState<number | null>(1_230_000);

    return (
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <AmountInput {...args} aria-label="Accepts" value={free} onChange={setFree} />
        <AmountInput
          {...args}
          aria-label="Rejects above 10M"
          value={capped}
          onChange={(next) => {
            if (next === null || next <= 10_000_000) setCapped(next);
          }}
        />
        <output style={{ font: "inherit" }}>
          accepts: {String(free)} · rejects: {String(capped)}
        </output>
      </div>
    );
  },
  args: {
    currency: "USD",
  },
};

/** Emphasis levels, status colours and the disabled state. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <AmountInput {...args} aria-label="Primary" defaultValue={1_500_000} />
      <AmountInput {...args} aria-label="Secondary" variant="secondary" defaultValue={1_500_000} />
      <AmountInput {...args} aria-label="Tertiary" variant="tertiary" defaultValue={1_500_000} />
      <AmountInput {...args} aria-label="Error" validationStatus="error" defaultValue={1_500_000} />
      <AmountInput {...args} aria-label="Disabled" disabled defaultValue={1_500_000} />
    </div>
  ),
};

/**
 * The field takes its focus ring from `--finra-actionable-emphasis` and its
 * error state from `--finra-status-danger-accent`.
 *
 * ```css
 * .brand-region {
 *   --finra-actionable-emphasis: #7c3aed;
 * }
 * ```
 */
export const Overrides: Story = {
  render: (args) => (
    <TokenScope
      align="flex-start"
      tokens={{
        "--finra-actionable-emphasis": "#7c3aed",
        "--finra-status-danger-accent": "#9f1239",
      }}>
      <div style={{ inlineSize: 200 }}>
        <AmountInput {...args} aria-label="Focus me" currency="USD" defaultValue={1_230_000} />
      </div>
      <div style={{ inlineSize: 200 }}>
        <AmountInput
          {...args}
          aria-label="Rejected"
          currency="USD"
          validationStatus="error"
          defaultValue={1_230_000}
        />
      </div>
    </TokenScope>
  ),
  play: async ({ canvasElement }) => {
    within(canvasElement).getByRole("spinbutton", { name: "Focus me" }).focus();
  },
};

/** Dark-mode counterpart of `Shorthand`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Shorthand);

/**
 * Secondary variant in dark mode, with a value on screen.
 *
 * The value is the point. This variant paints its own field surface, and a
 * placeholder is drawn in the muted colour, so an empty field looks correct
 * even when the surface and the text resolve to the same colour. Only a
 * populated field puts that in front of the accessibility check.
 */
export const SecondaryVariantDark: Story = inDark({
  ...Shorthand,
  args: { ...Shorthand.args, variant: "secondary" },
});
