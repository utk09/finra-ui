import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  type DateTenorInvalidReason,
  type DateTenorParserFn,
  DateTenorPicker,
  type DateTenorValue,
} from "@utk09/finra-ui-finance";
import { formatDate, parseDateTenor } from "@utk09/finra-ui-finance/utils";
import { useEffect, useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

// Set to the real current date so tenors resolve to sensible forward dates (4M → +4 months).
const REF = new Date(2026, 6, 18);

const meta: Meta<typeof DateTenorPicker> = {
  title: "Finance/DateTenorPicker",
  component: DateTenorPicker,
  parameters: {
    layout: "centered",
  },
  // Autodocs only (no a11y-test): opening the popup renders the Calendar grid,
  // whose APG grid-semantics gaps are tracked in Phase 6. Add the a11y gate
  // once that lands (mirrors the Calendar story).
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary"],
      table: { defaultValue: { summary: "primary" } },
    },
    validationStatus: {
      control: "select",
      options: [undefined, "error", "warning", "success"],
    },
    dateFormat: {
      control: "select",
      options: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"],
      table: { defaultValue: { summary: "YYYY-MM-DD" } },
    },
    fullWidth: { control: "boolean", table: { defaultValue: { summary: "false" } } },
    disabled: { control: "boolean", table: { defaultValue: { summary: "false" } } },
  },
  args: {
    "aria-label": "Value date",
    referenceDate: REF,
    onChange: fn(),
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

/** Type a tenor (`3M`), a spot expression (`Spot + 3M`), a keyword (`Today`), or a date. */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Value date" });
    await userEvent.type(input, "3M");
    await userEvent.keyboard("{Enter}");
    // Canonical display echoes back into the field.
    await expect(input).toHaveValue("3M");
  },
};

/** Drive the value yourself; here the resolved settlement date is echoed below. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState<DateTenorValue | null>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minInlineSize: 360 }}>
        <DateTenorPicker {...args} value={value} onChange={setValue} />
        <small style={{ fontFamily: "monospace" }}>
          {value
            ? `${value.mode}: ${value.display} → ${
                value.date ? formatDate(value.date, "YYYY-MM-DD") : "--"
              }`
            : "no value"}
        </small>
      </div>
    );
  },
};

/** Uncontrolled with an initial value; the component owns its own state. */
export const Uncontrolled: Story = {
  args: {
    defaultValue: {
      input: "Spot + 3M",
      display: "Spot + 3M",
      mode: "spot-relative",
      tenor: "3M",
      date: new Date(2026, 3, 15),
    },
  },
};

/** Fully keyboard-driven: Ctrl+Space opens the tenor list, arrows navigate, Enter commits. */
export const KeyboardOnly: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Value date" });
    input.focus();

    await userEvent.keyboard("{Control>} {/Control}"); // open tenor list
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Enter}"); // commit the highlighted (first) tenor
    await expect(input).toHaveValue("ON");
  },
};

/** Inject a business calendar - weekends are non-business days and become unselectable. */
export const BusinessCalendar: Story = {
  args: {
    calendar: { isBusinessDay: (d: Date) => d.getDay() !== 0 && d.getDay() !== 6 },
  },
};

/** Constrain to a window (today … +6M) and block specific upcoming dates + tenors. */
export const DisabledDates: Story = {
  render: (args) => {
    const today = new Date();
    const day = (offset: number) =>
      new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    return (
      <DateTenorPicker
        {...args}
        minDate={today}
        maxDate={new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())}
        disabledDates={[day(3), day(4)]}
        disabledTenors={["ON", "TN", "SN"]}
      />
    );
  },
};

/** Replace the parser: here `XMAS` resolves to Christmas, everything else falls through. */
export const CustomParser: Story = {
  render: (args) => {
    const parser: DateTenorParserFn = (input, ctx) => {
      if (input.trim().toUpperCase() === "XMAS") {
        return {
          valid: true,
          mode: "date",
          date: new Date(2026, 11, 25),
          tenor: null,
          display: "Christmas",
        };
      }
      return parseDateTenor(input, ctx);
    };
    return <DateTenorPicker {...args} parser={parser} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Value date" });
    await userEvent.type(input, "xmas");
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("Christmas");
  },
};

/** Unparseable / out-of-range input is rejected via `onInvalid`; nothing is committed. */
export const BrokenDates: Story = {
  render: (args) => {
    const [reason, setReason] = useState<DateTenorInvalidReason | null>(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minInlineSize: 360 }}>
        <DateTenorPicker
          {...args}
          onInvalid={setReason}
          onChange={() => setReason(null)}
          validationStatus={reason ? "error" : undefined}
        />
        {reason ? <small style={{ color: "crimson" }}>Rejected: {reason}</small> : null}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "Value date" });
    await userEvent.type(input, "not a date");
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText(/Rejected: unrecognized/)).toBeVisible();
  },
};

/** Holidays arrive asynchronously; once loaded they become non-business days. */
export const AsyncHolidayProvider: Story = {
  render: (args) => {
    // Local Y-M-D (not toISOString, which would shift a local-midnight date
    // across the UTC boundary in some timezones).
    const iso = (d: Date) => formatDate(d, "YYYY-MM-DD");
    const [holidays, setHolidays] = useState<Set<string> | null>(null);
    useEffect(() => {
      const today = new Date();
      const day = (offset: number) =>
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      const timer = setTimeout(() => {
        // Pretend a holiday service returned a couple of upcoming dates.
        setHolidays(new Set([formatDate(day(6), "YYYY-MM-DD"), formatDate(day(13), "YYYY-MM-DD")]));
      }, 400);
      return () => clearTimeout(timer);
    }, []);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minInlineSize: 360 }}>
        <DateTenorPicker
          {...args}
          calendar={{
            isBusinessDay: (d: Date) => {
              if (d.getDay() === 0 || d.getDay() === 6) return false;
              return holidays ? !holidays.has(iso(d)) : true;
            },
          }}
        />
        <small>{holidays ? "Holiday calendar loaded" : "Loading holidays…"}</small>
      </div>
    );
  },
};

/**
 * Shows the resolved settlement date + mode/broken-date badges beside the field
 * (FIN-003-04/06/07). Type a non-standard date (e.g. `2027-07-13`) to see the
 * "Broken" badge.
 */
export const WithResolvedDate: Story = {
  args: {
    showResolvedDate: true,
    showModeIndicator: true,
    showBrokenDate: true,
    resolvedDateFormat: (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    defaultValue: {
      input: "Spot + 3M",
      display: "Spot + 3M",
      mode: "spot-relative",
      tenor: "3M",
      date: new Date(2026, 3, 15),
    },
  },
};
