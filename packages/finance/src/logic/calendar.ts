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

/** First day (midnight) of the month that `date` falls in. */
export function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Whether `date` is unselectable per the `min`/`max` range and `disabledDates`
 * rule. Pure (no "outside current month" notion - that is a grid-display concern
 * handled in `getCalendarDays`). Shared by the grid and the footer API so
 * shortcut buttons can disable themselves when their target falls out of range.
 */
export function isDateDisabled(
  date: Date,
  min?: Date,
  max?: Date,
  disabledDates?: Date[] | ((date: Date) => boolean),
): boolean {
  const dayStart = startOfDay(date);
  if (min && dayStart < startOfDay(min)) return true;
  if (max && dayStart > startOfDay(max)) return true;
  if (disabledDates) {
    return typeof disabledDates === "function"
      ? disabledDates(date)
      : disabledDates.some((dd) => isSameDay(dd, date));
  }
  return false;
}

/** Whether `date` should be visually highlighted (does not affect selectability). */
export function isDateHighlighted(
  date: Date,
  highlightedDates?: Date[] | ((date: Date) => boolean),
): boolean {
  if (!highlightedDates) return false;
  return typeof highlightedDates === "function"
    ? highlightedDates(date)
    : highlightedDates.some((d) => isSameDay(d, date));
}

/**
 * ISO 8601 week number (weeks start Monday; week 1 contains the first Thursday
 * of the year). Independent of the calendar's `weekStartsOn` display setting.
 */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Sunday (0) -> 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the week's Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
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
  const todayDay = startOfDay(today);

  for (let i = 0; i < CALENDAR_CELL_COUNT; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const isCurrentMonth = d.getMonth() === month && d.getFullYear() === year;

    // Outside days are non-selectable by display convention; current-month days
    // defer to the shared min/max/disabledDates predicate.
    const isDisabled = isCurrentMonth ? isDateDisabled(d, min, max, disabledDates) : true;

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

/**
 * Inclusive list of selectable years for a year dropdown. Bounded by `min`/`max`
 * years when present, otherwise `currentYear ± span`. Always includes
 * `currentYear` so the displayed year is a valid option.
 */
export function getYearRange(currentYear: number, min?: Date, max?: Date, span = 10): number[] {
  let start = min ? min.getFullYear() : currentYear - span;
  let end = max ? max.getFullYear() : currentYear + span;
  start = Math.min(start, currentYear);
  end = Math.max(end, currentYear);

  const years: number[] = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

/**
 * Whether a whole month is out of range - true only when no day in
 * `(year, monthIndex)` falls within `[min, max]`. Used to disable months in the
 * month dropdown.
 */
export function isMonthDisabled(year: number, monthIndex: number, min?: Date, max?: Date): boolean {
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0); // day 0 of next month = last of this
  if (min && lastDay < startOfDay(min)) return true;
  if (max && firstDay > startOfDay(max)) return true;
  return false;
}

//  Range selection - framework-agnostic

/** A date range selection. Either end may be null while selecting. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

function orderedPair(a: Date, b: Date): { start: Date; end: Date } {
  return startOfDay(a) <= startOfDay(b) ? { start: a, end: b } : { start: b, end: a };
}

/**
 * Range-selection reducer: given the current range and a clicked date, return
 * the next range. Rules (react-datepicker `selectsRange` model):
 *  - no start yet, or a complete range → start over (start = clicked, end = null)
 *  - start set, no end → complete the range, ordering the two endpoints
 */
export function nextRange(current: DateRange | null, clicked: Date): DateRange {
  if (!current || current.start == null || current.end != null) {
    return { start: clicked, end: null };
  }
  return orderedPair(current.start, clicked);
}

/**
 * The concrete `[start, end]` used for styling, folding in the hovered day as a
 * preview end while the range is half-open. Returns null when nothing is set.
 */
export function getEffectiveRange(
  range: DateRange | null,
  hovered: Date | null,
): { start: Date; end: Date } | null {
  if (!range || range.start == null) return null;
  if (range.end != null) return orderedPair(range.start, range.end);
  if (hovered != null) return orderedPair(range.start, hovered);
  return { start: range.start, end: range.start };
}

export interface DayRangeState {
  isRangeStart: boolean;
  isRangeEnd: boolean;
  /** Strictly between the endpoints. */
  isInRange: boolean;
}

/** Per-day range membership for styling, against an effective `[start, end]`. */
export function getDayRangeState(
  date: Date,
  effective: { start: Date; end: Date } | null,
): DayRangeState {
  if (!effective) return { isRangeStart: false, isRangeEnd: false, isInRange: false };
  const day = startOfDay(date);
  const start = startOfDay(effective.start);
  const end = startOfDay(effective.end);
  return {
    isRangeStart: isSameDay(day, start),
    isRangeEnd: isSameDay(day, end),
    isInRange: day > start && day < end,
  };
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
