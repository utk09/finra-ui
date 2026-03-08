import type { Meta, StoryObj } from "@storybook/react-vite";
import { NumberInput } from "@utk09/finra-ui";
import { fn, expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof NumberInput> = {
  title: "Components/NumberInput",
  component: NumberInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
    fullWidth: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    readOnly: {
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
    precision: {
      control: "number",
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
    "aria-label": "Number input",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toBeVisible();
    // Click increment
    const incrementButton = canvas.getByRole("button", { name: "Increment" });
    await userEvent.click(incrementButton);
    await expect(input).toHaveValue("1");
  },
};

export const PrimaryVariant: Story = {
  args: {
    variant: "primary",
    "aria-label": "Primary number input",
    defaultValue: 10,
  },
};

export const SecondaryVariant: Story = {
  args: {
    variant: "secondary",
    "aria-label": "Secondary number input",
    defaultValue: 10,
  },
};

export const TertiaryVariant: Story = {
  args: {
    variant: "tertiary",
    "aria-label": "Tertiary number input",
    defaultValue: 10,
  },
};

// ─── Constraint stories ───

export const WithMinMax: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 50,
    "aria-label": "Value (0-100)",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("aria-valuemin", "0");
    await expect(input).toHaveAttribute("aria-valuemax", "100");
  },
};

export const WithStep: Story = {
  args: {
    step: 5,
    defaultValue: 0,
    "aria-label": "Step by 5",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const incrementButton = canvas.getByRole("button", { name: "Increment" });
    await userEvent.click(incrementButton);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toHaveValue("5");
    await userEvent.click(incrementButton);
    await expect(input).toHaveValue("10");
  },
};

export const WithPrecision: Story = {
  args: {
    precision: 2,
    defaultValue: 3.14,
    step: 0.01,
    "aria-label": "Precision input",
  },
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 42,
    "aria-label": "Input with default",
  },
};

// ─── Validation stories ───

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <NumberInput validationStatus="error" defaultValue={-5} aria-label="Error state" />
      <NumberInput validationStatus="warning" defaultValue={95} aria-label="Warning state" />
      <NumberInput validationStatus="success" defaultValue={50} aria-label="Success state" />
    </div>
  ),
};

// ─── State stories ───

export const Disabled: Story = {
  args: {
    defaultValue: 10,
    disabled: true,
    "aria-label": "Disabled input",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toBeDisabled();
    const buttons = canvas.getAllByRole("button");
    for (const button of buttons) {
      await expect(button).toBeDisabled();
    }
  },
};

export const ReadOnly: Story = {
  args: {
    defaultValue: 42,
    readOnly: true,
    "aria-label": "Read-only input",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toHaveAttribute("readonly");
  },
};

export const FullWidth: Story = {
  args: {
    defaultValue: 50,
    fullWidth: true,
    "aria-label": "Full width input",
  },
  parameters: {
    layout: "padded",
  },
};

// ─── Practical example stories ───

export const CurrencyExample: Story = {
  args: {
    precision: 2,
    min: 0,
    step: 0.01,
    defaultValue: 9.99,
    "aria-label": "Price (USD)",
  },
};

export const PercentExample: Story = {
  args: {
    min: 0,
    max: 100,
    step: 0.5,
    defaultValue: 75,
    "aria-label": "Percentage",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("aria-valuemin", "0");
    await expect(input).toHaveAttribute("aria-valuemax", "100");
  },
};

// ─── Showcase stories ───

export const AllVariations: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 400 }}>
      {/* Variants */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Variants</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <NumberInput variant="primary" defaultValue={10} aria-label="Primary" />
          <NumberInput variant="secondary" defaultValue={20} aria-label="Secondary" />
          <NumberInput variant="tertiary" defaultValue={30} aria-label="Tertiary" />
        </div>
      </div>
      {/* Validation */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Validation states</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <NumberInput validationStatus="error" defaultValue={-5} aria-label="Error" />
          <NumberInput validationStatus="warning" defaultValue={95} aria-label="Warning" />
          <NumberInput validationStatus="success" defaultValue={50} aria-label="Success" />
        </div>
      </div>
      {/* Constraints */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Constraints</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <NumberInput min={0} max={100} defaultValue={50} aria-label="Min 0 / Max 100" />
          <NumberInput step={5} defaultValue={0} aria-label="Step 5" />
          <NumberInput precision={2} step={0.01} defaultValue={3.14} aria-label="Precision 2" />
        </div>
      </div>
      {/* Practical examples */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Practical examples</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <NumberInput
            precision={2}
            min={0}
            step={0.01}
            defaultValue={9.99}
            aria-label="Currency"
          />
          <NumberInput min={0} max={100} step={0.5} defaultValue={75} aria-label="Percentage" />
        </div>
      </div>
      {/* States */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>States</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <NumberInput disabled defaultValue={10} aria-label="Disabled" />
          <NumberInput readOnly defaultValue={42} aria-label="Read-only" />
        </div>
      </div>
    </div>
  ),
};
