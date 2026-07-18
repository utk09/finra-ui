import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Calendar,
  CalendarShortcuts,
  CalendarTodayButton,
  DateInput,
} from "@utk09/finra-ui-finance";
import type { CalendarFooterApi, DateRange } from "@utk09/finra-ui-finance/unstyled";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

// Footer variants. Storybook Controls can't hold a function, so the select maps
// a label to a render function via `argTypes.footer.mapping`.
const footers: Record<string, ((api: CalendarFooterApi) => ReactNode) | undefined> = {
  none: undefined,
  today: (api) => <CalendarTodayButton api={api} />,
  "today (navigate only)": (api) => (
    <CalendarTodayButton api={api} navigateOnly>
      Today
    </CalendarTodayButton>
  ),
  shortcuts: (api) => (
    <CalendarShortcuts
      api={api}
      shortcuts={[
        { label: "1W", tenor: "1w" },
        { label: "1M", tenor: "1m" },
        { label: "3M", tenor: "3m" },
        { label: "6M", tenor: "6m" },
        { label: "1Y", tenor: "1y" },
      ]}
    />
  ),
};

/** Storybook `date` controls store a timestamp; coerce back to a Date. */
function toDate(value: Date | number | null | undefined): Date | undefined {
  return value == null ? undefined : new Date(value);
}

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
  // a11y-test intentionally omitted: Calendar's grid semantics (button role
  // override, focus preservation) are tracked for Phase 6; add the gate then.
  tags: ["autodocs"],
  argTypes: {
    weekStartsOn: {
      control: "inline-radio",
      options: [1, 0],
      labels: { 1: "Monday", 0: "Sunday" },
    },
    value: { control: "date" },
    min: { control: "date" },
    max: { control: "date" },
    monthYearDropdowns: { control: "boolean" },
    showWeekNumbers: { control: "boolean" },
    footer: { control: "select", options: Object.keys(footers), mapping: footers },
    // Not useful as interactive controls.
    month: { table: { disable: true } },
    onSelect: { table: { disable: true } },
    onMonthChange: { table: { disable: true } },
    disabledDates: { table: { disable: true } },
    highlightedDates: { table: { disable: true } },
    today: { table: { disable: true } },
    classNames: { table: { disable: true } },
    className: { table: { disable: true } },
    dataAttributes: { table: { disable: true } },
    renderNavPrev: { table: { disable: true } },
    renderNavNext: { table: { disable: true } },
  },
  args: {
    weekStartsOn: 1,
    monthYearDropdowns: false,
    showWeekNumbers: false,
    footer: "today",
  },
  render: ({ value, min, max, ...args }) => {
    // Hold selection in state so day clicks work; re-sync when the `value`
    // control changes so the control still drives the selected date.
    const [selected, setSelected] = useState<Date | null>(() => toDate(value) ?? null);
    useEffect(() => {
      setSelected(toDate(value) ?? null);
    }, [value]);

    return (
      <div style={{ inlineSize: 280 }}>
        <Calendar
          {...args}
          value={selected}
          onSelect={setSelected}
          min={toDate(min)}
          max={toDate(max)}
        />
      </div>
    );
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Controls-driven: flip weekStartsOn, set value/min/max, swap the footer. */
export const Playground: Story = {};

/** Tenor shortcut footer (1W / 1M / 3M / 6M / 1Y), resolved against today. */
export const TenorShortcuts: Story = {
  args: {
    footer: "shortcuts",
  },
};

/** Header month + year dropdown quick-nav (core Select). */
export const MonthYearDropdowns: Story = {
  args: {
    monthYearDropdowns: true,
    footer: "today",
  },
};

/** ISO week numbers plus a couple of highlighted (non-selectable-affecting) dates. */
export const WeekNumbersAndHighlights: Story = {
  args: {
    showWeekNumbers: true,
    highlightedDates: [
      new Date(new Date().getFullYear(), new Date().getMonth(), 10),
      new Date(new Date().getFullYear(), new Date().getMonth(), 20),
    ],
  },
};

/** Range selection (start/end) with hover preview. */
export const Range: Story = {
  render: (args) => {
    const [range, setRange] = useState<DateRange | null>(null);
    return (
      <div style={{ inlineSize: 280 }}>
        <Calendar
          mode="range"
          weekStartsOn={args.weekStartsOn}
          rangeValue={range}
          onRangeSelect={setRange}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("grid");
    // Re-query cells after each click (state change re-renders the grid).
    const cells = () => within(grid).getAllByRole("gridcell");
    const firstEnabled = cells().findIndex((d) => !d.hasAttribute("disabled"));

    await userEvent.click(cells()[firstEnabled]);
    await expect(cells()[firstEnabled]).toHaveAttribute("data-range-start");

    await userEvent.click(cells()[firstEnabled + 4]);
    await expect(cells()[firstEnabled + 4]).toHaveAttribute("data-range-end");
  },
};

/** Stateful selection with a "go to today" footer button. */
export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(null);
    return (
      <div style={{ inlineSize: 280 }}>
        <Calendar
          weekStartsOn={args.weekStartsOn}
          value={value}
          onSelect={setValue}
          footer={(api) => <CalendarTodayButton api={api} />}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Go to today" }));

    const grid = canvas.getByRole("grid");
    const selected = within(grid).getByRole("gridcell", { selected: true });
    await expect(selected).toBeInTheDocument();
  },
};

/** The same calendar as it appears inside the styled DateInput popup. */
export const InDateInput: Story = {
  name: "Calendar in DateInput",
  render: () => (
    <div style={{ minInlineSize: 300 }}>
      <DateInput aria-label="Date with calendar" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("Toggle calendar"));
    await expect(canvas.getByText(/\w+ \d{4}/)).toBeVisible();
  },
};
