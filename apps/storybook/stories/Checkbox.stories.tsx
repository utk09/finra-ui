import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "@utk09/finra-ui";
import { fn, expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
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

// ─── Basic stories ───

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

// ─── Interactive ───

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

// ─── Showcase ───

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
