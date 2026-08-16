import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "@utk09/finra-ui";
import { SliderBase } from "@utk09/finra-ui/unstyled";
import { useState } from "react";
import { expect, fn, within } from "storybook/test";

import { forwardsTo, inDark, NATIVE, Stack } from "./_shared";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
    docs: {
      inheritsFrom: SliderBase,
      // Mirrors the `Omit` on the styled props: the wrapper owns the root's
      // class, so the base's is not consumer API here.
      inheritedOmit: ["className"],
      forwardsTo: forwardsTo("input", "range input"),
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
      description:
        "Native disabled state. A disabled slider is not focusable and reports no value.",
      table: { category: NATIVE, type: { summary: "boolean" } },
    },
    showValue: {
      control: "boolean",
    },
    formatValue: { control: { disable: true } },
    onChange: {
      description:
        "Fires on every movement of the thumb, not on release, so a controlled slider tracks the drag. Read `event.target.value`, which is always a string.",
      table: {
        category: NATIVE,
        type: { summary: "(event: ChangeEvent<HTMLInputElement>) => void" },
      },
    },
    value: {
      control: "number",
      description:
        "Controlled value. Supply `onChange` alongside it, or the thumb cannot move. Leave unset and use `defaultValue` for an uncontrolled slider.",
      table: { category: NATIVE, type: { summary: "number | string" } },
    },
    defaultValue: {
      control: "number",
      description:
        "Starting value for an uncontrolled slider. With neither this nor `value`, a range input starts halfway between `min` and `max`.",
      table: { category: NATIVE, type: { summary: "number | string" } },
    },
    min: {
      control: "number",
      description: "Lower bound of the range.",
      table: {
        category: NATIVE,
        type: { summary: "number | string" },
        defaultValue: { summary: "0" },
      },
    },
    max: {
      control: "number",
      description: "Upper bound of the range.",
      table: {
        category: NATIVE,
        type: { summary: "number | string" },
        defaultValue: { summary: "100" },
      },
    },
    step: {
      control: "number",
      description:
        'Granularity the value snaps to. `"any"` removes snapping. Dragging between two steps resolves to the nearer one.',
      table: {
        category: NATIVE,
        type: { summary: 'number | "any"' },
        defaultValue: { summary: "1" },
      },
    },
  },
  args: {
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  args: {
    label: "Volume",
    defaultValue: 50,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");
    await expect(slider).toBeVisible();
  },
};

export const WithValue: Story = {
  args: {
    label: "Brightness",
    showValue: true,
    defaultValue: 75,
  },
};

export const CustomRange: Story = {
  args: {
    label: "Temperature",
    showValue: true,
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 50,
  },
};

/**
 * `formatValue` gives the raw number a unit. It sets `aria-valuetext` as well
 * as the readout, so what is announced and what is on screen cannot disagree,
 * and it applies with `showValue` off too: the format says what the number
 * means, not whether it is visible. `aria-valuenow` is left alone for
 * assistive technology that ignores `aria-valuetext`.
 *
 * The callback receives the resolved bounds, so a percentage of a range that
 * does not start at zero needs no bookkeeping at the call site.
 */
export const FormattedValue: Story = {
  args: {
    label: "Volume",
    showValue: true,
    defaultValue: 45,
    formatValue: (value: number) => `${value}%`,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");

    await expect(canvas.getByText("45%")).toBeVisible();
    await expect(slider).toHaveAttribute("aria-valuetext", "45%");
    // The raw value survives beside the formatted one.
    await expect(slider).toHaveValue("45");
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled slider",
    defaultValue: 30,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("slider")).toBeDisabled();
  },
};

export const WithoutLabel: Story = {
  args: {
    "aria-label": "Unlabelled slider",
    defaultValue: 50,
  },
};

/**
 * With no `value` or `defaultValue`, a range input starts halfway between its
 * bounds. The readout reports that starting point rather than sitting empty.
 */
export const UnsetValue: Story = {
  args: {
    label: "Spread",
    showValue: true,
    min: 20,
    max: 80,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");
    await expect(slider).toHaveValue("50");
    await expect(canvas.getByText("50")).toBeVisible();
  },
};

//  Interactive

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState(50);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Slider
          label="Opacity"
          showValue
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <div
          style={{
            inlineSize: 80,
            blockSize: 80,
            backgroundColor: "var(--finra-actionable-accent)",
            opacity: value / 100,
            borderRadius: "var(--finra-radius-md)",
          }}
        />
      </div>
    );
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 400 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <Slider label="Default" defaultValue={50} />
      <Slider label="With value" showValue defaultValue={75} />
      <Slider label="Custom range" showValue min={0} max={200} step={10} defaultValue={100} />
      <Slider label="Disabled" disabled defaultValue={30} />
      <Slider aria-label="No label" defaultValue={60} />
    </div>
  ),
};

/**
 * Two supported ways to restyle, both shown against an untouched control.
 *
 * Re-point a token on any ancestor and every slider below follows, dark mode
 * included. For anything a token does not cover, target the part by its
 * `data-finra-ui` id: `slider`, `slider-header`, `slider-label`, `slider-value`
 * and `slider-input`.
 *
 * ```css
 * [data-finra-ui="slider-value"] {
 *   font-variant-numeric: tabular-nums;
 *   padding: 0.125rem 0.375rem;
 *   border-radius: 0.25rem;
 * }
 * ```
 *
 * That rule is no more specific than the library's own and still wins, because
 * everything the library ships sits in `@layer finra-ui` and your stylesheet
 * does not. The `:where()` wrapper below only stops the demo leaking onto the
 * rest of this page; it adds no specificity.
 *
 * The track and thumb are the native range pseudo-elements, so a rule aimed at
 * them hangs off `slider-input` with `::-webkit-slider-thumb` and
 * `::-moz-range-thumb`, not off a part id.
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    // Each variant gets its own block of the same width, so the three are a
    // like-for-like comparison rather than three different layouts.
    <Stack gap="1.5rem">
      <div style={{ inlineSize: "20rem" }}>
        <Slider label="Default" showValue defaultValue={60} />
      </div>
      <div
        style={
          { inlineSize: "20rem", "--finra-actionable-accent": "#b45309" } as React.CSSProperties
        }>
        <Slider label="Token" showValue defaultValue={60} />
      </div>
      <div className="slider-readout-demo" style={{ inlineSize: "20rem" }}>
        <style>{`
          :where(.slider-readout-demo) [data-finra-ui="slider-value"] {
            font-variant-numeric: tabular-nums;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            background: var(--finra-actionable-accent-subtle);
            color: var(--finra-container-foreground);
          }
        `}</style>
        <Slider label="Selector" showValue defaultValue={60} />
      </div>
    </Stack>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);
