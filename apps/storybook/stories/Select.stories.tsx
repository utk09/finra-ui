import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectContent, SelectTrigger } from "@utk09/finra-ui";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { darkMode, darkModeOpen } from "./_shared";

const options = [
  { value: "aapl", label: "Apple" },
  { value: "msft", label: "Microsoft" },
  { value: "goog", label: "Alphabet" },
  { value: "amzn", label: "Amazon", disabled: true },
  { value: "nvda", label: "NVIDIA" },
];

const manyOptions = Array.from({ length: 30 }, (_, i) => ({
  value: `opt-${i}`,
  label: `Option ${i + 1}`,
}));

const PLACEMENTS = [
  "top",
  "top-start",
  "top-end",
  "right",
  "right-start",
  "right-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
] as const;

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  // The root owns state and renders nothing. Without these, the page documents
  // its props and none of the parts a consumer actually composes.
  subcomponents: { SelectTrigger, SelectContent },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    placeholder: { control: "text" },
    placement: {
      control: "select",
      options: PLACEMENTS,
      table: { defaultValue: { summary: "bottom" } },
    },
    offset: {
      control: { type: "number", min: 0, max: 40 },
      table: { defaultValue: { summary: "6" } },
    },
    loop: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    dismissOnEscape: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    dismissOnOutside: { control: "boolean", table: { defaultValue: { summary: "true" } } },
    // No interactive control, but they stay in the table: a consumer needs to
    // know they exist.
    options: { control: { disable: true } },
    children: { control: { disable: true } },
    value: { control: { disable: true } },
    defaultValue: { control: { disable: true } },
    open: { control: { disable: true } },
    defaultOpen: { control: { disable: true } },
    onValueChange: { control: { disable: true } },
    onOpenChange: { control: { disable: true } },
  },
  args: {
    options,
    placeholder: "Select a ticker",
    placement: "bottom",
    offset: 6,
    loop: true,
    dismissOnEscape: true,
    dismissOnOutside: true,
  },
  render: (args) => (
    <div style={{ inlineSize: "16rem" }}>
      <Select {...args}>
        <SelectTrigger aria-label="Ticker" />
        <SelectContent aria-label="Tickers" />
      </Select>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Select-only combobox (APG activedescendant): open, arrow, type-ahead, Enter to pick. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Ticker" });
    await userEvent.click(trigger);

    // The listbox is portalled to <body>, outside the story canvas.
    const listbox = await within(document.body).findByRole("listbox");
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(within(listbox).getByRole("option", { name: "Microsoft" }));
    await waitFor(() => expect(within(document.body).queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Microsoft");
  },
};

/** A pre-selected value renders in the trigger. */
export const WithSelectedValue: Story = {
  args: { defaultValue: "goog" },
};

/** Disabled options (Amazon) are shown but not selectable and skipped by the keyboard. */
export const DisabledOptions: Story = {};

/** Long lists scroll inside the listbox; type-ahead still jumps by first letter. */
export const ManyOptions: Story = {
  args: { options: manyOptions, placeholder: "Pick an option" },
};

/** Opens upward when there is more room above the trigger. */
export const TopPlacement: Story = {
  args: { placement: "top" },
};

/** Closed trigger in dark mode. */
export const DarkMode: Story = {
  ...darkMode,
  args: { defaultValue: "goog" },
};

/**
 * The listbox left open in dark mode.
 *
 * This is the story that matters for the accessibility check. The listbox is
 * portalled to `<body>`, so a closed-trigger story tells axe nothing about the
 * options, their hover and selected states, or the surface they sit on.
 */
export const DarkModeOpen: Story = {
  ...darkModeOpen,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "Ticker" }));
    const listbox = await within(document.body).findByRole("listbox");
    await waitFor(() => expect(listbox).toBeVisible());
    // Deliberately left open: the a11y check is an afterEach, so whatever is on
    // screen when play resolves is what gets audited.
  },
};

/**
 * Two supported ways to restyle, both shown against an untouched select.
 *
 * Re-point a token on any ancestor and every part below follows, dark mode
 * included. For anything a token does not cover, target the part by its
 * `data-finra-ui` id: `select-trigger`, `select-value`, `select-indicator`,
 * `select` for the listbox panel, and `select-option`.
 *
 * ```css
 * [data-finra-ui="select-option"][data-selected] {
 *   border-inline-start: 3px solid var(--finra-actionable-emphasis);
 * }
 * ```
 *
 * Selected and highlighted state are read from `data-selected` and
 * `data-active`, which each option already carries, so no extra id is needed
 * to reach them. The library already sets a heavier weight on the selected
 * option, so a rule that only restated that would demonstrate nothing.
 *
 * **The listbox portals to `document.body`.** A token declared on a wrapper
 * cannot reach it, because custom properties inherit through the DOM and the
 * popup is not inside that wrapper. Pass `container` to bring it back into a
 * node you own, which is what makes the override below apply.
 */
export const Overrides: Story = {
  render: function Render() {
    const [scope, setScope] = useState<HTMLDivElement | null>(null);
    return (
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        <div style={{ inlineSize: "12rem" }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Default</p>
          <Select options={options} defaultValue="msft" placeholder="Select a ticker">
            <SelectTrigger aria-label="Default ticker" />
            <SelectContent aria-label="Default tickers" />
          </Select>
        </div>
        <div
          ref={setScope}
          className="select-override-demo"
          style={
            {
              inlineSize: "12rem",
              "--finra-actionable-accent-subtle": "#ede9fe",
              "--finra-actionable-emphasis": "#8b5cf6",
              "--finra-radius-md": "0.75rem",
            } as React.CSSProperties
          }>
          <style>{`
            :where(.select-override-demo) [data-finra-ui="select-option"][data-selected] {
              border-inline-start: 3px solid var(--finra-actionable-emphasis);
              padding-inline-start: calc(var(--finra-spacing-2) - 3px);
            }
          `}</style>
          <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Overridden</p>
          <Select options={options} defaultValue="msft" placeholder="Select a ticker">
            <SelectTrigger aria-label="Overridden ticker" />
            <SelectContent aria-label="Overridden tickers" container={scope} />
          </Select>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    // Open it, so the portalled listbox is on screen and visibly inside the
    // scope. A resting-state view shows none of the parts being overridden.
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox", { name: "Overridden ticker" }));
    const listbox = await within(document.body).findByRole("listbox", {
      name: "Overridden tickers",
    });
    await waitFor(() => expect(listbox).toBeVisible());
  },
};

/** Drive the value yourself to react to changes (here, echoing the selection). */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", inlineSize: "16rem" }}>
        <Select {...args} value={value} onValueChange={setValue}>
          <SelectTrigger aria-label="Ticker" />
          <SelectContent aria-label="Tickers" />
        </Select>
        <small>Selected: {value ?? "none"}</small>
      </div>
    );
  },
};
