import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "@utk09/finra-ui";
import { fn, expect, within } from "storybook/test";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: {
      control: "boolean",
    },
    showValue: {
      control: "boolean",
    },
    min: {
      control: "number",
    },
    max: {
      control: "number",
    },
    step: {
      control: "number",
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

// ─── Basic stories ───

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

// ─── Interactive ───

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
            backgroundColor: "var(--color-primary-600)",
            opacity: value / 100,
            borderRadius: "var(--radius-md)",
          }}
        />
      </div>
    );
  },
};

// ─── Showcase ───

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
