/**
 * Pure calendar computation logic - zero framework imports.
 * Used by React CalendarBase and future Lit finra-calendar.
 */

/**
 * One cell in a month grid, with everything a renderer needs already resolved.
 *
 * @remarks
 * A grid always contains whole weeks, so the leading and trailing cells belong
 * to the neighbouring months - check `isCurrentMonth` before styling a cell as
 * part of the month on display.
 */
export interface CalendarDay {
  /** The day this cell represents, at local midnight. */
  date: Date;
  /** False for the padding days that complete the first and last weeks. */
  isCurrentMonth: boolean;
  /** Matches the `today` the grid was built with, not necessarily the real today. */
  isToday: boolean;
  /** Matches the current selection (or a range endpoint). */
  isSelected: boolean;
  /** Fails min/max, an explicit disabled list, or a business-day predicate. */
  isDisabled: boolean;
}

/**
 * Whether two dates fall on the same calendar day.
 *
 * @remarks
 * Compares local year, month and day, ignoring the time entirely - so two
 * instants hours apart on the same day are equal. Use this rather than
 * comparing timestamps, which almost never does what a calendar wants.
 *
 * @param a - First date.
 * @param b - Second date.
 * @returns True if both name the same day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * A copy of the date at local midnight.
 *
 * @remarks
 * Normalising to midnight is what makes date comparison and range ordering
 * total - without it, "is this day in range" depends on the time of day the
 * value happened to be constructed with.
 *
 * @param date - The date to normalise. Not mutated.
 * @returns A new Date at 00:00 local time.
 */
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

//  Locale-aware names (Intl) - display only; parsing stays English by design

/** Display width for weekday column headers. */
/**
 * How much of a weekday name to render in the header row.
 *
 * @remarks
 * `"narrow"` can be ambiguous in English (T for both Tuesday and Thursday), so
 * the header carries the full name as an `aria-label` regardless of what is
 * shown - a screen reader always hears the unambiguous form.
 */
export type WeekdayWidth = "narrow" | "short" | "long";

/**
 * Month/weekday names come from `Intl.DateTimeFormat`, not a hardcoded English
 * table. `Intl.DateTimeFormat` construction is comparatively expensive and these
 * are read on every render, so resolved name arrays are memoised by locale.
 *
 * Note this is *display* only. Month-name **parsing** (`utils/dateTenorParse`)
 * deliberately stays English - a trader typing `15 Jan 2027` means January
 * regardless of their UI locale.
 */
const monthNameCache = new Map<string, string[]>();
const weekdayNameCache = new Map<string, string[]>();

/**
 * A month whose day-1 is unambiguous in UTC, used purely as a formatting probe.
 * The year is arbitrary; only the month component is read.
 */
function monthProbe(monthIndex: number): Date {
  return new Date(Date.UTC(2021, monthIndex, 1));
}

/**
 * 2023-01-01 was a Sunday, so `2023-01-01 + i` walks Sunday → Saturday. Used as
 * a formatting probe for weekday names.
 */
function weekdayProbe(dayOfWeek: number): Date {
  return new Date(Date.UTC(2023, 0, 1 + dayOfWeek));
}

/** Localised month names, January-first. */
export function getMonthNames(locale?: string, width: "long" | "short" = "long"): string[] {
  const key = `${locale ?? ""}|${width}`;
  const cached = monthNameCache.get(key);
  if (cached) return cached;

  const fmt = new Intl.DateTimeFormat(locale, { month: width, timeZone: "UTC" });
  const names = Array.from({ length: 12 }, (_, m) => fmt.format(monthProbe(m)));
  monthNameCache.set(key, names);
  return names;
}

/**
 * Localised weekday names, rotated so index 0 is `weekStartsOn`.
 *
 * `width: "short"` yields e.g. "Mon" (en-US) rather than the old hand-written
 * two-letter "Mo" - there is no Intl width for exactly two letters, and slicing
 * localised text breaks non-Latin scripts.
 */
export function getWeekdayNames(
  locale: string | undefined,
  weekStartsOn: 0 | 1,
  width: WeekdayWidth,
): string[] {
  const key = `${locale ?? ""}|${weekStartsOn}|${width}`;
  const cached = weekdayNameCache.get(key);
  if (cached) return cached;

  const fmt = new Intl.DateTimeFormat(locale, { weekday: width, timeZone: "UTC" });
  const names = Array.from({ length: 7 }, (_, i) =>
    fmt.format(weekdayProbe((i + weekStartsOn) % 7)),
  );
  weekdayNameCache.set(key, names);
  return names;
}

/**
 * A day's column index within a week that starts on `weekStartsOn`.
 *
 * @remarks
 * `Date.getDay()` is always Sunday-based; a Monday-first grid needs the
 * rotation, and getting it wrong shifts an entire month by one column.
 *
 * @param date - The date to place.
 * @param weekStartsOn - First column's day: `0` Sunday, `1` Monday.
 * @returns Zero-based column index, `0`-`6`.
 */
export function dayOfWeekIndex(date: Date, weekStartsOn: 0 | 1): number {
  return (date.getDay() - weekStartsOn + 7) % 7;
}

/** Header title, e.g. "January 2026". */
export function formatMonthYear(year: number, month: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );
}

/** Accessible name for a day cell, e.g. "January 15, 2026". */
export function formatDayLabel(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}

//  Date arithmetic used by the keyboard machine

/** `date` shifted by `n` days, normalised to midnight local time. */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

/**
 * `date` shifted by `n` months, clamping the day-of-month to the target month's
 * length so Jan 31 + 1 month is Feb 28, not Mar 3.
 */
export function addMonths(date: Date, n: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const daysInTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), daysInTarget));
}

/** First day of the display week containing `date`. */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1): Date {
  return addDays(date, -dayOfWeekIndex(date, weekStartsOn));
}

/** Last day of the display week containing `date`. */
export function endOfWeek(date: Date, weekStartsOn: 0 | 1): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
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

/**
 * Which day should hold the grid's single tab stop: the selection, else today,
 * else the first day of the month. Returns a date (not a grid index) so focus
 * survives month navigation - see {@link resolveCalendarKey}.
 */
export function getInitialFocusDate(days: CalendarDay[]): Date | null {
  const sel = days.find((d) => d.isSelected && d.isCurrentMonth);
  if (sel) return sel.date;
  const tod = days.find((d) => d.isToday && d.isCurrentMonth);
  if (tod) return tod.date;
  return days.find((d) => d.isCurrentMonth)?.date ?? null;
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
/**
 * A selected range, either endpoint of which may be missing.
 *
 * @remarks
 * `start` set with `end` null is the *half-open* state - the user has clicked
 * once and is choosing the other end. That is a normal working state, not an
 * error, and it is what drives the hover preview.
 *
 * Endpoints are always ordered: clicking backwards swaps them rather than
 * producing a reversed range.
 */
export interface DateRange {
  /** First endpoint, or `null` when nothing is selected. */
  start: Date | null;
  /** Second endpoint, or `null` while the range is still half-open. */
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

/**
 * Where one day sits relative to the selected range.
 *
 * @remarks
 * The three flags are mutually exclusive, which is what lets a renderer round
 * the ends and square the middle. A single-day range sets both `isRangeStart`
 * and `isRangeEnd`.
 */
export interface DayRangeState {
  /** This day is the first endpoint. */
  isRangeStart: boolean;
  /** This day is the second endpoint. */
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
 *
 * Focus is expressed as a **date**, not a grid index. That is what makes APG
 * focus preservation fall out for free: ArrowRight on the last day of a month
 * simply resolves to the 1st of the next month, and the adapter follows the
 * displayed month to wherever focus landed. The previous index-based model had
 * to roll the month over and then re-seed focus from scratch, which lost the
 * day-of-week on ArrowDown and always landed on day 1 on ArrowRight.
 */
export type CalendarKeyEffect =
  | { kind: "focusDate"; date: Date }
  /** Select the currently focused day (adapter re-checks the disabled guard). */
  | { kind: "selectFocused" };

/** Everything a keydown decision needs, with zero framework/DOM coupling. */
export interface CalendarKeyContext {
  /** The day currently holding the grid's tab stop. */
  focusedDate: Date;
  /** 0 = Sunday, 1 = Monday. Determines where Home/End land. */
  weekStartsOn: 0 | 1;
  /** Under `dir="rtl"` the horizontal arrows swap. Default false. */
  rtl?: boolean;
  /** Shift pages by a year instead of a month on PageUp/PageDown. */
  shiftKey?: boolean;
}

/** The decision for one keypress in the day grid. */
export interface CalendarKeyResult {
  /** Whether the adapter should call `event.preventDefault()`. */
  preventDefault: boolean;
  /** Effects to apply in order. Empty means the key was not handled here. */
  effects: CalendarKeyEffect[];
}

const noneCal = (): CalendarKeyResult => ({ preventDefault: false, effects: [] });

const focusTo = (date: Date): CalendarKeyResult => ({
  preventDefault: true,
  effects: [{ kind: "focusDate", date }],
});

type CalendarKeyHandler = (ctx: CalendarKeyContext) => CalendarKeyResult;

/**
 * Keyboard map as data (APG "date picker grid"). Horizontal arrows read the
 * `rtl` flag rather than being swapped at the call site, so RTL is one boolean
 * rather than a second key table.
 */
const calendarKeyMap: Record<string, CalendarKeyHandler> = {
  ArrowRight: (ctx) => focusTo(addDays(ctx.focusedDate, ctx.rtl ? -1 : 1)),
  ArrowLeft: (ctx) => focusTo(addDays(ctx.focusedDate, ctx.rtl ? 1 : -1)),
  ArrowDown: (ctx) => focusTo(addDays(ctx.focusedDate, CALENDAR_COLUMNS)),
  ArrowUp: (ctx) => focusTo(addDays(ctx.focusedDate, -CALENDAR_COLUMNS)),
  Home: (ctx) => focusTo(startOfWeek(ctx.focusedDate, ctx.weekStartsOn)),
  End: (ctx) => focusTo(endOfWeek(ctx.focusedDate, ctx.weekStartsOn)),
  PageDown: (ctx) => focusTo(addMonths(ctx.focusedDate, ctx.shiftKey ? 12 : 1)),
  PageUp: (ctx) => focusTo(addMonths(ctx.focusedDate, ctx.shiftKey ? -12 : -1)),
  Enter: () => ({ preventDefault: true, effects: [{ kind: "selectFocused" }] }),
};
// Space shares Enter's behaviour.
calendarKeyMap[" "] = calendarKeyMap.Enter;

/**
 * Resolve a grid keydown to its effects without touching the DOM. Unmapped keys
 * are a no-op (no preventDefault), so normal browser handling is preserved -
 * notably Tab, which must leave the grid rather than move within it.
 */
export function resolveCalendarKey(key: string, ctx: CalendarKeyContext): CalendarKeyResult {
  const handler = calendarKeyMap[key];
  return handler ? handler(ctx) : noneCal();
}
