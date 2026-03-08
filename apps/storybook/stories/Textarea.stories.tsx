import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@utk09/finra-ui";
import { expect, userEvent, within } from "storybook/test";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
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
    showCharCount: {
      control: "boolean",
    },
    autoResize: {
      control: "boolean",
    },
    minRows: {
      control: "number",
    },
    maxRows: {
      control: "number",
    },
    maxLength: {
      control: "number",
    },
    warningThreshold: {
      control: "number",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Basic stories ───

export const Default: Story = {
  args: {
    placeholder: "Enter your message...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeVisible();
    await userEvent.type(textarea, "Hello world");
    await expect(textarea).toHaveValue("Hello world");
  },
};

export const PrimaryVariant: Story = {
  args: {
    variant: "primary",
    placeholder: "Primary textarea",
  },
};

export const SecondaryVariant: Story = {
  args: {
    variant: "secondary",
    placeholder: "Secondary textarea",
  },
};

export const TertiaryVariant: Story = {
  args: {
    variant: "tertiary",
    placeholder: "Tertiary textarea",
  },
};

// ─── Character count stories ───

export const WithCharCount: Story = {
  args: {
    placeholder: "Type here...",
    showCharCount: true,
    maxLength: 200,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeVisible();
    // Check character count is displayed
    await expect(canvas.getByText("0/200")).toBeVisible();
    await userEvent.type(textarea, "Hello");
    await expect(canvas.getByText("5/200")).toBeVisible();
  },
};

export const WithWarningThreshold: Story = {
  args: {
    placeholder: "Type here...",
    showCharCount: true,
    maxLength: 50,
    warningThreshold: 40,
    defaultValue: "This text is getting close to the limit now!!",
  },
};

export const AtCharLimit: Story = {
  args: {
    placeholder: "Type here...",
    showCharCount: true,
    maxLength: 20,
    defaultValue: "At the char limit!!!", // exactly 20 characters
  },
};

// ─── Auto resize stories ───

export const AutoResize: Story = {
  args: {
    placeholder: "Start typing and the textarea will grow...",
    autoResize: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeVisible();
    await userEvent.type(textarea, "Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6");
  },
};

export const WithMinMaxRows: Story = {
  args: {
    placeholder: "Min 2 rows, max 6 rows",
    autoResize: true,
    minRows: 2,
    maxRows: 6,
  },
};

// ─── Validation stories ───

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: 320 }}>
      <Textarea validationStatus="error" defaultValue="Error state" aria-label="Error textarea" />
      <Textarea
        validationStatus="warning"
        defaultValue="Warning state"
        aria-label="Warning textarea"
      />
      <Textarea
        validationStatus="success"
        defaultValue="Success state"
        aria-label="Success textarea"
      />
    </div>
  ),
};

// ─── State stories ───

export const Disabled: Story = {
  args: {
    "aria-label": "Disabled textarea",
    defaultValue: "This textarea is disabled",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toBeDisabled();
  },
};

export const ReadOnly: Story = {
  args: {
    "aria-label": "Read-only textarea",
    defaultValue: "This textarea is read-only",
    readOnly: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");
    await expect(textarea).toHaveAttribute("readonly");
  },
};

export const FullWidth: Story = {
  args: {
    placeholder: "Full width textarea",
    fullWidth: true,
  },
  parameters: {
    layout: "padded",
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
          <Textarea variant="primary" placeholder="Primary" />
          <Textarea variant="secondary" placeholder="Secondary" />
          <Textarea variant="tertiary" placeholder="Tertiary" />
        </div>
      </div>
      {/* Validation statuses */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Validation states</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Textarea
            validationStatus="error"
            defaultValue="Error state"
            aria-label="Error textarea"
          />
          <Textarea
            validationStatus="warning"
            defaultValue="Warning state"
            aria-label="Warning textarea"
          />
          <Textarea
            validationStatus="success"
            defaultValue="Success state"
            aria-label="Success textarea"
          />
        </div>
      </div>
      {/* Character counting */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Character counting</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Textarea showCharCount maxLength={100} placeholder="With char count" />
          <Textarea
            showCharCount
            maxLength={50}
            warningThreshold={40}
            defaultValue="This text is almost at the warning"
            aria-label="Warning threshold textarea"
          />
          <Textarea
            showCharCount
            maxLength={20}
            defaultValue="At the char limit!!!"
            aria-label="At limit textarea"
          />
        </div>
      </div>
      {/* Auto resize */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>Auto resize</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Textarea autoResize placeholder="Auto resize (no max)" />
          <Textarea autoResize minRows={2} maxRows={5} placeholder="Auto resize (2-5 rows)" />
        </div>
      </div>
      {/* States */}
      <div>
        <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>States</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Textarea disabled defaultValue="Disabled" aria-label="Disabled textarea" />
          <Textarea readOnly defaultValue="Read-only" aria-label="Read-only textarea" />
        </div>
      </div>
    </div>
  ),
};
