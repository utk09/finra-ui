import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "@utk09/finra-ui";
import { CheckboxBase } from "@utk09/finra-ui/unstyled";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { inDark, Row, Stack, TokenScope } from "./_shared";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
    // Picks up `indeterminate`, which is declared on the base rather than here.
    docs: {
      inheritsFrom: CheckboxBase,
      // Mirrors the `Omit` on the styled props: these are the styled layer's
      // own injection points, not consumer API.
      inheritedOmit: ["className"],
    },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    indeterminate: {
      control: "boolean",
    },
  },
  args: {
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  args: {
    label: "Accept terms and conditions",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await expect(checkbox).toBeInTheDocument();
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(canvas.getByText("Accept terms and conditions"));
    await expect(checkbox).toBeChecked();
  },
};

export const Checked: Story = {
  args: {
    label: "Checked checkbox",
    defaultChecked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled checkbox",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox")).toBeDisabled();
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Disabled and checked",
    disabled: true,
    defaultChecked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: "Select all",
    indeterminate: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    "aria-label": "Standalone checkbox",
  },
};

//  Interactive

export const Controlled: Story = {
  render: () => {
    const [items, setItems] = useState([
      { id: "item1", label: "Item 1", checked: true },
      { id: "item2", label: "Item 2", checked: false },
      { id: "item3", label: "Item 3", checked: true },
    ]);

    const allChecked = items.every((i) => i.checked);
    const someChecked = items.some((i) => i.checked) && !allChecked;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <Checkbox
          label="Select all"
          checked={allChecked}
          indeterminate={someChecked}
          onChange={() => {
            const newChecked = !allChecked;
            setItems(items.map((i) => ({ ...i, checked: newChecked })));
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            paddingLeft: "1.5rem",
          }}>
          {items.map((item) => (
            <Checkbox
              key={item.id}
              label={item.label}
              checked={item.checked}
              onChange={() => {
                setItems(items.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)));
              }}
            />
          ))}
        </div>
      </div>
    );
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled Checked" disabled defaultChecked />
      <Checkbox aria-label="Without label" />
    </div>
  ),
};

/**
 * The checked indicator reads `--finra-actionable-accent`, so one declaration
 * on an ancestor retints every checkbox in a region.
 *
 * ```css
 * .brand-region {
 *   --finra-actionable-accent: #b45309;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <Stack gap="1.25rem">
      <Row>
        <span style={{ minInlineSize: "6rem" }}>Default</span>
        <Checkbox label="Confirmed" defaultChecked />
        <Checkbox label="Indeterminate" indeterminate />
      </Row>
      <TokenScope tokens={{ "--finra-actionable-accent": "#b45309" }}>
        <span style={{ minInlineSize: "6rem" }}>Overridden</span>
        <Checkbox label="Confirmed" defaultChecked />
        <Checkbox label="Indeterminate" indeterminate />
      </TokenScope>
    </Stack>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);
