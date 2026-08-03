import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "@utk09/finra-ui";
import { expect, userEvent, within } from "storybook/test";

import { forwardsTo, inDark, NATIVE, nativeFieldArgTypes } from "./_shared";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
    // No `inheritsFrom`: this component composes `TextareaBase` rather than
    // re-declaring its props, so docgen already sees everything it declares.
    docs: { forwardsTo: forwardsTo("textarea", "textarea element") },
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    // Declared on `TextareaHTMLAttributes`, so react-docgen cannot see them and
    // there is nothing for the docgen backfill to read.
    disabled: nativeFieldArgTypes.disabled,
    readOnly: nativeFieldArgTypes.readOnly,
    placeholder: nativeFieldArgTypes.placeholder,
    maxLength: {
      control: "number",
      description:
        "Native character limit. The browser stops input at this length; `showCharCount` renders it as the counter's denominator.",
      table: { category: NATIVE, type: { summary: "number" } },
    },
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
    warningThreshold: {
      control: "number",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

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

//  Character count stories

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

//  Auto resize stories

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

//  Validation stories

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

//  State stories

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

//  Showcase stories

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

/**
 * Restyling the field chrome and the counter.
 *
 * Nothing here is portalled, so an override declared on an ancestor reaches every
 * part. Border, radius and the warning colour are semantic tokens; the counter's
 * alignment has no token behind it and is reached through
 * `[data-finra-ui="textarea-count"]`, which wins because the library ships inside
 * `@layer finra-ui`.
 */
export const Overrides: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
      <div>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Default</p>
        <Textarea
          aria-label="Default notes"
          showCharCount
          maxLength={50}
          warningThreshold={40}
          defaultValue="Settlement instructions are nearly complete."
        />
      </div>
      <div
        className="textarea-override-demo"
        style={
          {
            // The field is in its warning tier, so this drives both the border
            // and the counter. `--finra-container-border` is deliberately absent:
            // the warning status takes the border over, so overriding it here
            // would change nothing and imply it does.
            "--finra-status-warning-accent": "#0369a1",
            "--finra-radius-md": "0.75rem",
          } as React.CSSProperties
        }>
        <style>{`
          :where(.textarea-override-demo) [data-finra-ui="textarea-count"] {
            text-align: start;
            font-variant-numeric: normal;
            letter-spacing: var(--finra-tracking-wide);
          }
        `}</style>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.75rem" }}>Overridden</p>
        <Textarea
          aria-label="Overridden notes"
          showCharCount
          maxLength={50}
          warningThreshold={40}
          defaultValue="Settlement instructions are nearly complete."
        />
      </div>
    </div>
  ),
};

/** Dark-mode counterpart of `Default`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Default);

/**
 * Secondary variant in dark mode, with a value on screen.
 *
 * The value is the point. This variant paints its own field surface, and a
 * placeholder is drawn in the muted colour, so an empty field looks correct
 * even when the surface and the text resolve to the same colour. Only a
 * populated field puts that in front of the accessibility check.
 */
export const SecondaryVariantDark: Story = inDark({
  ...SecondaryVariant,
  args: { ...SecondaryVariant.args, defaultValue: "Settlement instructions confirmed." },
});
