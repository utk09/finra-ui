import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateInput } from "@utk09/finra-ui-finance";
import type { CalendarClassNames } from "@utk09/finra-ui-finance/unstyled";
import { CalendarBase } from "@utk09/finra-ui-finance/unstyled";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

//  Inline styles to approximate the styled Calendar look
// CalendarBase is unstyled by design; we provide classNames to style it.
// In a real app you'd use CSS modules or your own stylesheet.

const S: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    padding: "0.75rem",
    userSelect: "none",
    fontFamily: "var(--font-sans)",
    border: "var(--border-width-thin) solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    backgroundColor: "var(--color-background)",
    boxShadow: "var(--shadow-lg)",
    inlineSize: 280,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingBlockEnd: "0.125rem",
  },
  navButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    blockSize: "1.5rem",
    inlineSize: "1.5rem",
    padding: 0,
    border: "none",
    borderRadius: "var(--radius-sm)",
    background: "transparent",
    color: "var(--color-neutral-500)",
    cursor: "pointer",
    fontSize: "0.75rem",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: "var(--text-sm)",
    fontWeight: 600,
    color: "var(--color-foreground)",
    whiteSpace: "nowrap",
  },
  weekdayRow: {},
  weekday: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    blockSize: "1.75rem",
    fontSize: "var(--text-xs)",
    fontWeight: 500,
    color: "var(--color-neutral-500)",
    textDecoration: "none",
    cursor: "default",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "1px",
  },
  day: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    blockSize: "2rem",
    inlineSize: "2rem",
    margin: "auto",
    padding: 0,
    border: "none",
    borderRadius: "var(--radius-sm)",
    background: "transparent",
    fontSize: "var(--text-sm)",
    fontVariantNumeric: "tabular-nums",
    color: "var(--color-foreground)",
    cursor: "pointer",
  },
  dayToday: {
    fontWeight: 700,
    color: "var(--color-primary-600)",
  },
  daySelected: {
    backgroundColor: "var(--color-primary-500)",
    color: "var(--color-neutral-0)",
  },
  dayDisabled: {
    color: "var(--color-neutral-200)",
    cursor: "not-allowed",
  },
  dayOutside: {
    color: "var(--color-neutral-200)",
    cursor: "not-allowed",
  },
};

// Generate CSS module-like class names from inline styles by creating a <style> tag
// This is a storybook-only approach; real apps use CSS modules or the styled DateInput/DateTenorInput.

const CSS_PREFIX = "cal-story";
const classNameMap: Record<string, string> = {};
let cssText = "";

for (const [key, styles] of Object.entries(S)) {
  const cn = `${CSS_PREFIX}-${key}`;
  classNameMap[key] = cn;
  const rules = Object.entries(styles)
    .map(([prop, val]) => {
      // Convert camelCase to kebab-case
      const kebab = prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${kebab}: ${val}`;
    })
    .join("; ");
  cssText += `.${cn} { ${rules} }\n`;
}

// Hover/focus styles (can't do with inline styles)
cssText += `
.${classNameMap.navButton}:hover { background-color: var(--color-neutral-100); color: var(--color-foreground); }
.${classNameMap.day}:hover:not(:disabled) { background-color: var(--color-neutral-100); }
.${classNameMap.daySelected}:hover:not(:disabled) { background-color: var(--color-primary-600); }
.${classNameMap.dayToday}.${classNameMap.daySelected} { color: var(--color-neutral-0); }
`;

const calendarClassNames: CalendarClassNames = {
  root: classNameMap.root,
  header: classNameMap.header,
  navButton: classNameMap.navButton,
  title: classNameMap.title,
  weekdayRow: classNameMap.weekdayRow,
  weekday: classNameMap.weekday,
  grid: classNameMap.grid,
  row: classNameMap.row,
  day: classNameMap.day,
  dayToday: classNameMap.dayToday,
  daySelected: classNameMap.daySelected,
  dayDisabled: classNameMap.dayDisabled,
  dayOutside: classNameMap.dayOutside,
};

function StyleTag() {
  const styleRef = useRef<HTMLStyleElement>(null);

  useEffect(() => {
    if (styleRef.current) {
      styleRef.current.textContent = cssText;
    }
  }, []);

  return <style ref={styleRef} />;
}

//  Meta

const meta: Meta<typeof CalendarBase> = {
  title: "Components/Calendar",
  component: CalendarBase,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <StyleTag />
        <Story />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

//  Stories

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          classNames={calendarClassNames}
          today={new Date(2026, 2, 18)}
        />
        <div
          style={{
            fontSize: "0.75rem",
            fontFamily: "monospace",
            color: "var(--color-neutral-500)",
          }}>
          Selected: {selected ? selected.toISOString().split("T")[0] : "none"}
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("March 2026")).toBeVisible();
    await expect(canvas.getByLabelText("Previous month")).toBeVisible();
    await expect(canvas.getByLabelText("Next month")).toBeVisible();
  },
};

export const WithPreselectedDate: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(new Date(2026, 2, 15));

    return (
      <CalendarBase
        value={selected}
        onSelect={(d) => setSelected(d)}
        classNames={calendarClassNames}
        today={new Date(2026, 2, 18)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("March 15, 2026")).toHaveAttribute("aria-selected", "true");
  },
};

export const WithMinMax: Story = {
  name: "Min/Max Constraints",
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);
    const min = new Date(2026, 2, 10);
    const max = new Date(2026, 2, 25);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Only March 10–25 selectable
        </div>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          min={min}
          max={max}
          classNames={calendarClassNames}
          today={new Date(2026, 2, 18)}
        />
        <div
          style={{
            fontSize: "0.75rem",
            fontFamily: "monospace",
            color: "var(--color-neutral-500)",
          }}>
          Selected: {selected ? selected.toISOString().split("T")[0] : "none"}
        </div>
      </div>
    );
  },
};

export const DisabledWeekends: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
          Weekends are disabled (business days only)
        </div>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          disabledDates={(d) => d.getDay() === 0 || d.getDay() === 6}
          classNames={calendarClassNames}
          today={new Date(2026, 2, 18)}
        />
      </div>
    );
  },
};

export const SundayStart: Story = {
  name: "Week Starts on Sunday",
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <CalendarBase
        value={selected}
        onSelect={(d) => setSelected(d)}
        weekStartsOn={0}
        classNames={calendarClassNames}
        today={new Date(2026, 2, 18)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const abbrs = canvas.getAllByText(/^(Su|Mo|Tu|We|Th|Fr|Sa)$/);
    await expect(abbrs[0]).toHaveTextContent("Su");
  },
};

export const ControlledMonth: Story = {
  name: "Controlled Month Navigation",
  render: () => {
    const [month, setMonth] = useState(new Date(2026, 0, 1));
    const [selected, setSelected] = useState<Date | null>(null);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["Jan", "Mar", "Jun", "Sep", "Dec"].map((label, i) => {
            const monthIndex = [0, 2, 5, 8, 11][i];
            return (
              <button
                key={label}
                type="button"
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  background:
                    month.getMonth() === monthIndex
                      ? "var(--color-primary-500)"
                      : "var(--color-background)",
                  color:
                    month.getMonth() === monthIndex
                      ? "var(--color-neutral-0)"
                      : "var(--color-foreground)",
                  cursor: "pointer",
                }}
                onClick={() => setMonth(new Date(2026, monthIndex, 1))}>
                {label}
              </button>
            );
          })}
        </div>
        <CalendarBase
          value={selected}
          onSelect={(d) => setSelected(d)}
          month={month}
          onMonthChange={setMonth}
          classNames={calendarClassNames}
          today={new Date(2026, 2, 18)}
        />
      </div>
    );
  },
};

//  Styled Calendar (via DateInput)

export const StyledViaDateInput: Story = {
  name: "Calendar in DateInput",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--color-neutral-500)" }}>
        Click the calendar icon to see the full styled calendar popup within DateInput.
      </div>
      <div style={{ minInlineSize: 300 }}>
        <DateInput aria-label="Date with calendar" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByLabelText("Toggle calendar");
    await userEvent.click(toggle);
    const monthLabel = canvas.getByText(/\w+ \d{4}/);
    await expect(monthLabel).toBeVisible();
  },
};
