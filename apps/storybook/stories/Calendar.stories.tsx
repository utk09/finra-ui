import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Calendar,
  CalendarShortcuts,
  CalendarTodayButton,
  DateInput,
} from "@utk09/finra-ui-finance";
import {
  CalendarBase,
  type CalendarFooterApi,
  type DateRange,
} from "@utk09/finra-ui-finance/unstyled";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { inDark, TokenScope } from "./_shared";

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
    // `CalendarProps extends CalendarBaseProps`, and docgen does not follow
    // `extends` across modules. Without this the base's own props are absent.
    docs: { inheritsFrom: CalendarBase },
  },
  // Day cells follow the APG grid pattern, so the a11y gate applies.
  tags: ["autodocs", "a11y-test"],
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
    // No interactive control, but they stay in the table: a consumer needs to
    // know they exist.
    month: { control: { disable: true } },
    onSelect: { control: { disable: true } },
    onMonthChange: { control: { disable: true } },
    disabledDates: { control: { disable: true } },
    highlightedDates: { control: { disable: true } },
    today: { control: { disable: true } },
    classNames: { control: { disable: true } },
    className: { control: { disable: true } },
    dataAttributes: { control: { disable: true } },
    renderNavPrev: { control: { disable: true } },
    renderNavNext: { control: { disable: true } },
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
    // The day <button>s inside the grid (the gridcell is a wrapper). Re-query
    // after each click, since the state change re-renders the grid.
    const days = () => within(grid).getAllByRole("button");
    const firstEnabled = days().findIndex((d) => !d.hasAttribute("disabled"));

    await userEvent.click(days()[firstEnabled]);
    await expect(days()[firstEnabled]).toHaveAttribute("data-range-start");

    await userEvent.click(days()[firstEnabled + 4]);
    await expect(days()[firstEnabled + 4]).toHaveAttribute("data-range-end");
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

/**
 * The selected day and the focus ring read the actionable tokens, so a calendar
 * can be brought into a host application's palette without touching its CSS.
 *
 * ```css
 * .brand-region {
 *   --finra-actionable-accent: #0f766e;
 *   --finra-actionable-accent-subtle: #ccfbf1;
 * }
 * ```
 */
export const Overrides: Story = {
  render: () => (
    <TokenScope
      align="flex-start"
      tokens={{
        "--finra-actionable-accent": "#0f766e",
        "--finra-actionable-accent-subtle": "#ccfbf1",
      }}>
      <Calendar mode="single" value={new Date(2026, 7, 12)} onSelect={() => {}} />
    </TokenScope>
  ),
};

/** Dark-mode counterpart of `Playground`, so the accessibility check covers dark contrast. */
export const DarkMode: Story = inDark(Playground);
