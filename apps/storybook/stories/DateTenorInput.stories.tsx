import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateTenorInput } from "@utk09/finra-ui-finance";
import { formatDate } from "@utk09/finra-ui-finance/utils";
import { useState } from "react";
import { expect, fn, within } from "storybook/test";

const meta: Meta<typeof DateTenorInput> = {
  title: "Finance/DateTenorInput",
  component: DateTenorInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs", "a11y-test"],
  argTypes: {
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
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
    dateAriaLabel: "Date",
  },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Basic stories

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Date")).toBeVisible();
  },
};

export const WithValues: Story = {
  args: {
    dateValue: new Date(2026, 5, 11),
    tenorValue: "3M",
    dateFormat: "YYYY-MM-DD",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByDisplayValue("2026-06-11")).toBeVisible();
    await expect(canvas.getByText("3M")).toBeVisible();
  },
};

export const Disabled: Story = {
  args: {
    dateValue: new Date(2026, 5, 11),
    tenorValue: "3M",
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Date")).toBeDisabled();
  },
};

export const RestrictedTenors: Story = {
  args: {
    allowedTenors: ["1M", "3M", "6M", "1Y", "5Y", "10Y"],
  },
};

//  Variants

export const Variants: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 400 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            marginBlockEnd: "0.25rem",
            color: "var(--color-neutral-500)",
          }}>
          Primary
        </div>
        <DateTenorInput dateAriaLabel="Date" variant="primary" />
      </div>
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            marginBlockEnd: "0.25rem",
            color: "var(--color-neutral-500)",
          }}>
          Secondary
        </div>
        <DateTenorInput dateAriaLabel="Date" variant="secondary" />
      </div>
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            marginBlockEnd: "0.25rem",
            color: "var(--color-neutral-500)",
          }}>
          Tertiary
        </div>
        <DateTenorInput dateAriaLabel="Date" variant="tertiary" />
      </div>
    </div>
  ),
};

//  Validation

export const ValidationStates: Story = {
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div style={{ minInlineSize: 400 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            marginBlockEnd: "0.25rem",
            color: "var(--color-neutral-500)",
          }}>
          Error
        </div>
        <DateTenorInput
          dateAriaLabel="Date"
          validationStatus="error"
          dateValue={new Date(2026, 5, 11)}
          tenorValue="3M"
        />
      </div>
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            marginBlockEnd: "0.25rem",
            color: "var(--color-neutral-500)",
          }}>
          Warning
        </div>
        <DateTenorInput
          dateAriaLabel="Date"
          validationStatus="warning"
          dateValue={new Date(2026, 2, 20)}
        />
      </div>
      <div>
        <div
          style={{
            fontSize: "0.75rem",
            marginBlockEnd: "0.25rem",
            color: "var(--color-neutral-500)",
          }}>
          Success
        </div>
        <DateTenorInput
          dateAriaLabel="Date"
          validationStatus="success"
          dateValue={new Date(2026, 5, 11)}
          tenorValue="3M"
        />
      </div>
    </div>
  ),
};

//  Interactive

export const TenorToDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null);
    const [tenor, setTenor] = useState<string | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <DateTenorInput
          dateAriaLabel="Date"
          dateValue={date}
          tenorValue={tenor}
          dateFormat="YYYY-MM-DD"
          onChange={({ date: d, tenor: t }) => {
            setDate(d);
            setTenor(t);
          }}
        />
        <div style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)" }}>
          <div>
            Tenor: <strong>{tenor ?? "none"}</strong>
          </div>
          <div>
            Date: <strong>{date ? formatDate(date, "YYYY-MM-DD") : "none"}</strong>
          </div>
        </div>
      </div>
    );
  },
};

export const CustomResolver: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null);
    const [tenor, setTenor] = useState<string | null>(null);

    // Custom resolver that skips weekends
    const weekdayResolver = (t: string, ref: Date): Date | null => {
      const units: Record<string, number> = {
        ON: 1,
        TN: 2,
        SN: 2,
        SW: 7,
      };
      const upper = t.toUpperCase();
      let days = units[upper];
      if (!days) {
        const match = upper.match(/^(\d+)([DWMY])$/);
        if (!match) return null;
        const val = parseInt(match[1], 10);
        const unit = match[2];
        if (unit === "D") days = val;
        else if (unit === "W") days = val * 7;
        else {
          // For months/years, use simple calendar math
          const result = new Date(ref);
          if (unit === "M") result.setMonth(result.getMonth() + val);
          else result.setFullYear(result.getFullYear() + val);
          // Skip to Monday if weekend
          while (result.getDay() === 0 || result.getDay() === 6) {
            result.setDate(result.getDate() + 1);
          }
          return result;
        }
      }
      const result = new Date(ref);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() !== 0 && result.getDay() !== 6) added++;
      }
      return result;
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Custom resolver: skips weekends (business days only)
        </div>
        <DateTenorInput
          dateAriaLabel="Date"
          dateValue={date}
          tenorValue={tenor}
          dateFormat="YYYY-MM-DD"
          tenorResolver={weekdayResolver}
          onChange={({ date: d, tenor: t }) => {
            setDate(d);
            setTenor(t);
          }}
        />
        <div style={{ fontSize: "0.875rem", color: "var(--color-neutral-600)" }}>
          <div>
            Tenor: <strong>{tenor ?? "none"}</strong>
          </div>
          <div>
            Resolved date: <strong>{date ? formatDate(date, "YYYY-MM-DD") : "none"}</strong>
          </div>
          {date ? (
            <div>
              Day:{" "}
              <strong>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]}</strong>
            </div>
          ) : null}
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
      <div style={{ minInlineSize: 400 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <DateTenorInput dateAriaLabel="Default" />
      <DateTenorInput
        dateAriaLabel="With values"
        dateValue={new Date(2026, 5, 11)}
        tenorValue="3M"
      />
      <DateTenorInput
        dateAriaLabel="Disabled"
        disabled
        dateValue={new Date(2026, 5, 11)}
        tenorValue="3M"
      />
      <DateTenorInput dateAriaLabel="Restricted" allowedTenors={["1M", "3M", "6M", "1Y"]} />
      <DateTenorInput dateAriaLabel="Full width" fullWidth />
    </div>
  ),
};
