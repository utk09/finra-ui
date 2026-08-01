import { isSameDay } from "../logic/calendar";

/**
 * The date layouts this package can format and parse.
 *
 * @remarks
 * A closed set on purpose - each maps to a fixed segment order the masked input
 * relies on for auto-inserting separators. It is *not* locale-derived: a field
 * displaying `DD/MM/YYYY` must keep doing so regardless of the user's browser
 * locale, or the same digits would mean different dates on different machines.
 */
export type DateFormat =
  | "YYYY-MM-DD"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "DD-MM-YYYY"
  | "MM-DD-YYYY"
  | "YYYY/MM/DD";

/**
 * Bounds and exclusions a date must satisfy.
 *
 * @remarks
 * All three are combined with AND - a date passes only if it is in range *and*
 * not excluded. Comparison is by calendar day, so a time component on `min` or
 * `max` does not make the boundary day itself fail.
 */
export interface DateConstraints {
  /** Earliest allowed date, inclusive. */
  min?: Date;
  /** Latest allowed date, inclusive. */
  max?: Date;
  /**
   * Specific excluded dates, or a predicate.
   *
   * @remarks
   * A predicate is the right form for holiday calendars and weekends, where
   * enumerating every excluded day is impractical.
   */
  disabledDates?: Date[] | ((date: Date) => boolean);
}

/** The result of parsing and validating date text. */
export interface DateParseResult {
  /** Whether the input parsed *and* satisfied its constraints. */
  valid: boolean;
  /** The parsed date at local midnight, or `null` when invalid. */
  date: Date | null;
  /**
   * Why it failed.
   *
   * @remarks
   * Worth distinguishing when reporting to the user: `"invalid-format"` means
   * the shape is wrong, `"invalid-date"` that the shape is right but the date
   * does not exist (31 February), and the other two that a real date was
   * refused by the constraints.
   */
  error?: "invalid-format" | "invalid-date" | "out-of-range" | "disabled-date";
}

const FORMAT_PARTS: Record<DateFormat, readonly string[]> = {
  "YYYY-MM-DD": ["YYYY", "MM", "DD"],
  "MM/DD/YYYY": ["MM", "DD", "YYYY"],
  "DD/MM/YYYY": ["DD", "MM", "YYYY"],
  "DD-MM-YYYY": ["DD", "MM", "YYYY"],
  "MM-DD-YYYY": ["MM", "DD", "YYYY"],
  "YYYY/MM/DD": ["YYYY", "MM", "DD"],
};

/**
 * The separator character a format uses.
 *
 * @param format - The layout to inspect.
 * @returns `"/"` or `"-"`.
 */
export function getFormatSeparator(format: DateFormat): string {
  return format.includes("/") ? "/" : "-";
}

/**
 * Placeholder text for a masked field.
 *
 * @remarks
 * The format string is its own placeholder - `"DD/MM/YYYY"` shows the user
 * exactly the order the field expects, which is the whole point when the same
 * digits mean different dates under different layouts.
 *
 * @param format - The layout the field accepts.
 * @returns The placeholder to render.
 */
export function getFormatPlaceholder(format: DateFormat): string {
  return format;
}

/**
 * Digit counts per segment, in the format's own order.
 *
 * @remarks
 * Feeds the input mask - `autoInsertSeparators` and `getMaxLength` both take
 * this, which is what keeps the mask and the `maxlength` attribute agreeing.
 *
 * @param format - The layout to decompose.
 * @returns Lengths in render order, e.g. `[4, 2, 2]` for `YYYY-MM-DD`.
 */
export function getFormatSegmentLengths(format: DateFormat): readonly number[] {
  return FORMAT_PARTS[format].map((p) => p.length);
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  // Use Date constructor to check - it wraps invalid dates (e.g. Feb 30 → Mar 2)
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Render a date in the given layout, zero-padded.
 *
 * @remarks
 * Reads the *local* date components, so a date built at local midnight renders
 * as that day regardless of timezone. Not locale-aware by design - see
 * {@link DateFormat}.
 *
 * @param date - The date to render.
 * @param format - The layout to use.
 * @returns The formatted string, e.g. `"2026-04-15"`.
 */
export function formatDate(date: Date, format: DateFormat): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const sep = getFormatSeparator(format);
  const parts = FORMAT_PARTS[format];

  const segments = parts.map((part) => {
    if (part === "YYYY") return pad(y, 4);
    if (part === "MM") return pad(m, 2);
    return pad(d, 2);
  });

  return segments.join(sep);
}

/**
 * Parse date text in the given layout.
 *
 * @remarks
 * Rejects dates that are well-formed but do not exist (31 February) rather than
 * letting `Date` silently roll them into the next month - a wrapped date is far
 * worse than a refused one, because it commits a value the user never typed.
 *
 * Applies no bounds; use {@link validateDate} for those.
 *
 * @param input - Text to parse, with the format's own separator.
 * @param format - The layout to expect.
 * @returns The parsed date, or the reason it failed.
 */
export function parseDate(input: string, format: DateFormat): DateParseResult {
  const sep = getFormatSeparator(format);
  const segments = input.split(sep);
  const parts = FORMAT_PARTS[format];

  if (segments.length !== parts.length) {
    return { valid: false, date: null, error: "invalid-format" };
  }

  let year = 0;
  let month = 0;
  let day = 0;

  for (let i = 0; i < parts.length; i++) {
    const seg = segments[i];
    const expected = parts[i];

    if (seg.length !== expected.length || !/^\d+$/.test(seg)) {
      return { valid: false, date: null, error: "invalid-format" };
    }

    const num = parseInt(seg, 10);
    if (expected === "YYYY") year = num;
    else if (expected === "MM") month = num;
    else day = num;
  }

  if (!isValidCalendarDate(year, month, day)) {
    return { valid: false, date: null, error: "invalid-date" };
  }

  return { valid: true, date: new Date(year, month - 1, day) };
}

/**
 * Check a date against min/max bounds and an exclusion list.
 *
 * @remarks
 * Compares by calendar day, so a time component on `min` or `max` does not make
 * the boundary day itself fail.
 *
 * @param date - The date to test.
 * @param constraints - Bounds and exclusions. An empty object accepts anything.
 * @returns `valid: true` with the date, or the rule that refused it.
 */
export function validateDate(date: Date, constraints: DateConstraints): DateParseResult {
  const { min, max, disabledDates } = constraints;

  if (min && date < new Date(min.getFullYear(), min.getMonth(), min.getDate())) {
    return { valid: false, date, error: "out-of-range" };
  }

  if (max && date > new Date(max.getFullYear(), max.getMonth(), max.getDate())) {
    return { valid: false, date, error: "out-of-range" };
  }

  if (disabledDates) {
    if (typeof disabledDates === "function") {
      if (disabledDates(date)) {
        return { valid: false, date, error: "disabled-date" };
      }
    } else if (disabledDates.some((d) => isSameDay(d, date))) {
      return { valid: false, date, error: "disabled-date" };
    }
  }

  return { valid: true, date };
}
