import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "@utk09/finra-ui";
import { fn, expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
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
    label: "Enable notifications",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const switchEl = canvas.getByRole("switch");
    await expect(switchEl).toBeVisible();
    await expect(switchEl).not.toBeChecked();
    await userEvent.click(switchEl);
    await expect(switchEl).toBeChecked();
  },
};

export const Checked: Story = {
  args: {
    label: "Active",
    defaultChecked: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled switch",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeDisabled();
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Disabled and on",
    disabled: true,
    defaultChecked: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    "aria-label": "Standalone switch",
  },
};

// ─── Showcase ───

export const AllStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Switch label="Unchecked" />
      <Switch label="Checked" defaultChecked />
      <Switch label="Disabled Off" disabled />
      <Switch label="Disabled On" disabled defaultChecked />
      <Switch aria-label="Without label" />
    </div>
  ),
};
