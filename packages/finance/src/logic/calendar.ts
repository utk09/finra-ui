/**
 * Pure calendar computation logic - zero framework imports.
 * Used by React CalendarBase and future Lit finra-calendar.
 */

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAY_SHORT_MON = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export const WEEKDAY_SHORT_SUN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
export const WEEKDAY_LONG_MON = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export const WEEKDAY_LONG_SUN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function dayOfWeekIndex(date: Date, weekStartsOn: 0 | 1): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

export function formatDayLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Cells in a calendar grid: 6 rows x 7 columns. */
export const CALENDAR_CELL_COUNT = 42;

/** Columns per week - the ArrowUp/ArrowDown vertical step. */
export const CALENDAR_COLUMNS = 7;

/**
 * Compute the 42 day cells (6 rows x 7 cols) for a calendar grid.
 */
export function getCalendarDays(
  year: number,
  month: number,
  weekStartsOn: 0 | 1,
  value: Date | null | undefined,
  today: Date,
  min?: Date,
  max?: Date,
  disabledDates?: Date[] | ((date: Date) => boolean),
): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = dayOfWeekIndex(firstDayOfMonth, weekStartsOn);
  const startDate = new Date(year, month, 1 - startOffset);

  const days: CalendarDay[] = [];
  const minDay = min ? startOfDay(min) : null;
  const maxDay = max ? startOfDay(max) : null;
  const todayDay = startOfDay(today);

  for (let i = 0; i < CALENDAR_CELL_COUNT; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const dayStart = startOfDay(d);
    const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;

    let isDisabled = !isCurrentMonth;
    if (isCurrentMonth) {
      if (minDay && dayStart < minDay) isDisabled = true;
      if (maxDay && dayStart > maxDay) isDisabled = true;
      if (!isDisabled && disabledDates) {
        if (typeof disabledDates === "function") {
          isDisabled = disabledDates(d);
        } else {
          isDisabled = disabledDates.some((dd) => isSameDay(dd, d));
        }
      }
    }

    days.push({
      date: d,
      isCurrentMonth,
      isToday: isSameDay(d, todayDay),
      isSelected: value != null && isSameDay(d, value),
      isDisabled,
    });
  }

  return days;
}

/** Resolve which day index should be focused initially. */
export function getInitialFocusIndex(days: CalendarDay[]): number {
  const sel = days.findIndex((d) => d.isSelected && d.isCurrentMonth);
  if (sel >= 0) return sel;
  const tod = days.findIndex((d) => d.isToday && d.isCurrentMonth);
  if (tod >= 0) return tod;
  return days.findIndex((d) => d.isCurrentMonth);
}

//  Keyboard behaviour - framework-agnostic

/**
 * A single state change a keydown resolves to. The framework adapter (React
 * `CalendarBase`, future Lit `finra-calendar`) executes these against its own
 * setters - the pure layer never touches the DOM.
 */
export type CalendarKeyEffect =
  | { kind: "setFocus"; index: number }
  | { kind: "goToNextMonth" }
  | { kind: "goToPrevMonth" }
  /** Select the currently focused day (adapter re-checks the disabled guard). */
  | { kind: "selectFocused" };

/** Everything a keydown decision needs, with zero framework/DOM coupling. */
export interface CalendarKeyContext {
  focusedIndex: number;
  /** Number of day cells rendered - the Enter/Space selection bound. */
  dayCount: number;
}

export interface CalendarKeyResult {
  /** Whether the adapter should call `event.preventDefault()`. */
  preventDefault: boolean;
  effects: CalendarKeyEffect[];
}

const noneCal = (): CalendarKeyResult => ({ preventDefault: false, effects: [] });

/**
 * Step focus by `delta` cells. Crossing either grid edge (past the last cell or
 * before the first) rolls over to the adjacent month rather than clamping -
 * the month change re-seeds focus via `getInitialFocusIndex`.
 */
function stepFocus(focusedIndex: number, delta: number): CalendarKeyResult {
  const next = focusedIndex + delta;
  if (next >= CALENDAR_CELL_COUNT) {
    return { preventDefault: true, effects: [{ kind: "goToNextMonth" }] };
  }
  if (next < 0) {
    return { preventDefault: true, effects: [{ kind: "goToPrevMonth" }] };
  }
  return { preventDefault: true, effects: [{ kind: "setFocus", index: next }] };
}

type CalendarKeyHandler = (ctx: CalendarKeyContext) => CalendarKeyResult;

/**
 * Keyboard map as data. Arrow keys move focus (with month rollover), Enter and
 * Space select, PageUp/PageDown page months. RTL support (Phase 6) becomes a
 * swap of the ArrowLeft/ArrowRight entries.
 */
const calendarKeyMap: Record<string, CalendarKeyHandler> = {
  ArrowRight: (ctx) => stepFocus(ctx.focusedIndex, 1),
  ArrowLeft: (ctx) => stepFocus(ctx.focusedIndex, -1),
  ArrowDown: (ctx) => stepFocus(ctx.focusedIndex, CALENDAR_COLUMNS),
  ArrowUp: (ctx) => stepFocus(ctx.focusedIndex, -CALENDAR_COLUMNS),
  Enter: (ctx) => ({
    preventDefault: true,
    effects:
      ctx.focusedIndex >= 0 && ctx.focusedIndex < ctx.dayCount ? [{ kind: "selectFocused" }] : [],
  }),
  PageDown: () => ({ preventDefault: true, effects: [{ kind: "goToNextMonth" }] }),
  PageUp: () => ({ preventDefault: true, effects: [{ kind: "goToPrevMonth" }] }),
};
// Space shares Enter's behaviour.
calendarKeyMap[" "] = calendarKeyMap.Enter;

/**
 * Resolve a grid keydown to its effects without touching the DOM. Unmapped keys
 * are a no-op (no preventDefault), so normal browser handling is preserved.
 */
export function resolveCalendarKey(key: string, ctx: CalendarKeyContext): CalendarKeyResult {
  const handler = calendarKeyMap[key];
  return handler ? handler(ctx) : noneCal();
}
