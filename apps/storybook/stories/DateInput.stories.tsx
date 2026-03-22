import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField } from "@utk09/finra-ui";
import { DateInput } from "@utk09/finra-ui-finance";
import { useState } from "react";
import { expect, fn, within } from "storybook/test";

const meta: Meta<typeof DateInput> = {
  title: "Components/DateInput",
  component: DateInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    format: {
      control: "select",
      options: ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "DD-MM-YYYY", "MM-DD-YYYY", "YYYY/MM/DD"],
      description: "Date format pattern. Determines separator and segment order.",
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
    disabled: {
      control: "boolean",
    },
    readOnly: {
      control: "boolean",
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
    "aria-label": "Date",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", "YYYY-MM-DD");
  },
};

export const WithValue: Story = {
  args: {
    "aria-label": "Date",
    value: new Date(2024, 2, 15),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveValue("2024-03-15");
  },
};

export const USFormat: Story = {
  args: {
    "aria-label": "Date",
    format: "MM/DD/YYYY",
    value: new Date(2024, 2, 15),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveValue("03/15/2024");
  },
};

export const EUFormat: Story = {
  args: {
    "aria-label": "Date",
    format: "DD/MM/YYYY",
    value: new Date(2024, 2, 15),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await expect(input).toHaveValue("15/03/2024");
  },
};

//  Constraint stories

export const MinMax: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null);
    const [error, setError] = useState<string>("");

    const min = new Date(2024, 0, 1);
    const max = new Date(2024, 11, 31);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <DateInput
          aria-label="Date"
          min={min}
          max={max}
          onChange={(d) => {
            setDate(d);
            setError("");
          }}
          onValidation={(result) => {
            if (!result.valid && result.error === "out-of-range") {
              setError("Date must be in 2024");
            }
          }}
          validationStatus={error ? "error" : undefined}
        />
        <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Range: Jan 1, 2024 - Dec 31, 2024
        </div>
        {error ? (
          <div style={{ fontSize: "0.75rem", color: "var(--color-error)" }}>{error}</div>
        ) : null}
        {date ? (
          <div style={{ fontSize: "0.75rem", color: "var(--color-success)" }}>
            Selected: {date.toLocaleDateString()}
          </div>
        ) : null}
      </div>
    );
  },
};

//  State stories

export const Disabled: Story = {
  args: {
    "aria-label": "Date",
    disabled: true,
    value: new Date(2024, 2, 15),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toBeDisabled();
  },
};

export const ReadOnly: Story = {
  args: {
    "aria-label": "Date",
    readOnly: true,
    value: new Date(2024, 2, 15),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox")).toHaveAttribute("readonly");
  },
};

//  Variant stories

export const Variants: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxInlineSize: 300 }}>
      <div>
        <p style={{ marginBlockEnd: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>Primary</p>
        <DateInput aria-label="Primary date" variant="primary" />
      </div>
      <div>
        <p style={{ marginBlockEnd: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>Secondary</p>
        <DateInput aria-label="Secondary date" variant="secondary" />
      </div>
      <div>
        <p style={{ marginBlockEnd: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>Tertiary</p>
        <DateInput aria-label="Tertiary date" variant="tertiary" />
      </div>
    </div>
  ),
};

//  Validation stories

export const ValidationStates: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxInlineSize: 300 }}>
      <div>
        <p style={{ marginBlockEnd: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>Error</p>
        <DateInput aria-label="Error date" validationStatus="error" value={new Date(2024, 0, 1)} />
      </div>
      <div>
        <p style={{ marginBlockEnd: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>Warning</p>
        <DateInput
          aria-label="Warning date"
          validationStatus="warning"
          value={new Date(2024, 0, 1)}
        />
      </div>
      <div>
        <p style={{ marginBlockEnd: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>Success</p>
        <DateInput
          aria-label="Success date"
          validationStatus="success"
          value={new Date(2024, 0, 1)}
        />
      </div>
    </div>
  ),
};

//  FormField integration

export const WithFormField: Story = {
  parameters: {
    layout: "padded",
  },
  render: () => {
    const [error, setError] = useState<string>("");

    return (
      <div style={{ maxInlineSize: 300 }}>
        <FormField
          label="Settlement Date"
          required
          helperText="Enter a date in YYYY-MM-DD format"
          validationStatus={error ? "error" : undefined}
          errorMessage={error}>
          <DateInput
            aria-label="Settlement date"
            validationStatus={error ? "error" : undefined}
            onValidation={(result) => {
              if (!result.valid && result.error) {
                const messages: Record<string, string> = {
                  "invalid-format": "Please enter a complete date",
                  "invalid-date": "This is not a valid calendar date",
                  "out-of-range": "Date is outside the allowed range",
                  "disabled-date": "This date is not available",
                };
                setError(messages[result.error] ?? "Invalid date");
              } else {
                setError("");
              }
            }}
          />
        </FormField>
      </div>
    );
  },
};

//  Interactive

export const Interactive: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null);
    const [text, setText] = useState("");

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <DateInput aria-label="Date" onChange={setDate} onInputChange={setText} />
        <div style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
          <div>Input text: &quot;{text}&quot;</div>
          <div>Parsed date: {date ? date.toISOString().split("T")[0] : "null"}</div>
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
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 500 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Formats */}
      <div>
        <p style={{ marginBlockEnd: "0.5rem", fontWeight: 600 }}>Formats</p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxInlineSize: 300 }}>
          <DateInput aria-label="ISO" format="YYYY-MM-DD" value={new Date(2024, 2, 15)} />
          <DateInput aria-label="US" format="MM/DD/YYYY" value={new Date(2024, 2, 15)} />
          <DateInput aria-label="EU" format="DD/MM/YYYY" value={new Date(2024, 2, 15)} />
          <DateInput aria-label="EU dash" format="DD-MM-YYYY" value={new Date(2024, 2, 15)} />
        </div>
      </div>

      {/* Variants */}
      <div>
        <p style={{ marginBlockEnd: "0.5rem", fontWeight: 600 }}>Variants</p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxInlineSize: 300 }}>
          <DateInput aria-label="Primary" variant="primary" />
          <DateInput aria-label="Secondary" variant="secondary" />
          <DateInput aria-label="Tertiary" variant="tertiary" />
        </div>
      </div>

      {/* Validation */}
      <div>
        <p style={{ marginBlockEnd: "0.5rem", fontWeight: 600 }}>Validation</p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxInlineSize: 300 }}>
          <DateInput aria-label="Error" validationStatus="error" value={new Date(2024, 0, 1)} />
          <DateInput aria-label="Warning" validationStatus="warning" value={new Date(2024, 0, 1)} />
          <DateInput aria-label="Success" validationStatus="success" value={new Date(2024, 0, 1)} />
        </div>
      </div>

      {/* States */}
      <div>
        <p style={{ marginBlockEnd: "0.5rem", fontWeight: 600 }}>States</p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxInlineSize: 300 }}>
          <DateInput aria-label="Disabled" disabled value={new Date(2024, 0, 1)} />
          <DateInput aria-label="Read-only" readOnly value={new Date(2024, 0, 1)} />
          <DateInput aria-label="Full width" fullWidth />
        </div>
      </div>
    </div>
  ),
};
