export type DateFormat =
  | "YYYY-MM-DD"
  | "MM/DD/YYYY"
  | "DD/MM/YYYY"
  | "DD-MM-YYYY"
  | "MM-DD-YYYY"
  | "YYYY/MM/DD";

export interface DateConstraints {
  min?: Date;
  max?: Date;
  disabledDates?: Date[] | ((date: Date) => boolean);
}

export interface DateParseResult {
  valid: boolean;
  date: Date | null;
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

export function getFormatSeparator(format: DateFormat): string {
  return format.includes("/") ? "/" : "-";
}

export function getFormatPlaceholder(format: DateFormat): string {
  return format;
}

export function getFormatSegmentLengths(format: DateFormat): readonly number[] {
  return FORMAT_PARTS[format].map((p) => p.length);
}

function pad(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  // Use Date constructor to check — it wraps invalid dates (e.g. Feb 30 → Mar 2)
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

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
