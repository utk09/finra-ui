import type { Meta, StoryObj } from "@storybook/react-vite";
import { TenorInput } from "@utk09/finra-ui/finance";
import { useState } from "react";
import { fn } from "storybook/test";

const meta: Meta<typeof TenorInput> = {
  title: "Finance/TenorInput",
  component: TenorInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
    allowCustom: { control: "boolean" },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
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
    "aria-label": "Tenor",
  },
};

export const WithValue: Story = {
  args: {
    "aria-label": "Tenor",
    value: "3M",
  },
};

export const AllowCustom: Story = {
  args: {
    "aria-label": "Tenor",
    allowCustom: true,
    placeholder: "Type or select tenor...",
  },
};

export const RestrictedTenors: Story = {
  args: {
    "aria-label": "Tenor",
    allowedTenors: ["ON", "1W", "1M", "3M", "6M", "1Y"],
  },
};

export const ExtraTenors: Story = {
  args: {
    "aria-label": "Tenor",
    extraTenors: ["4M", "7Y", "50Y"],
  },
};

export const Disabled: Story = {
  args: {
    "aria-label": "Tenor",
    value: "6M",
    disabled: true,
  },
};

//  Variants

export const Variants: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 500 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <label htmlFor="tenor-primary">
        Primary
        <TenorInput id="tenor-primary" aria-label="Primary tenor" variant="primary" />
      </label>
      <label htmlFor="tenor-secondary">
        Secondary
        <TenorInput id="tenor-secondary" aria-label="Secondary tenor" variant="secondary" />
      </label>
      <label htmlFor="tenor-tertiary">
        Tertiary
        <TenorInput id="tenor-tertiary" aria-label="Tertiary tenor" variant="tertiary" />
      </label>
    </div>
  ),
};

//  Interactive

export const Interactive: Story = {
  render: () => {
    const [tenor, setTenor] = useState<string | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <TenorInput aria-label="Tenor" value={tenor} onChange={setTenor} allowCustom />
        <div style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)" }}>
          Selected: <strong>{tenor ?? "none"}</strong>
        </div>
      </div>
    );
  },
};

//  Showcase

export const AllStates: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 500 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <TenorInput aria-label="Default" />
      <TenorInput aria-label="With value" value="3M" />
      <TenorInput aria-label="Disabled" disabled value="1Y" />
      <TenorInput
        aria-label="Restricted"
        allowedTenors={["1M", "3M", "6M", "1Y"]}
        placeholder="Short tenors only"
      />
      <TenorInput aria-label="Custom allowed" allowCustom placeholder="Type any tenor..." />
    </div>
  ),
};
