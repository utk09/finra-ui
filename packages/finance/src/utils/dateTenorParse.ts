import type { DateFormat } from "./dateFormat";
import { formatDate, parseDate } from "./dateFormat";
import type { TenorUnit } from "./tenor";
import { parseTenor } from "./tenor";

/**
 * Unified single-field parser for DateTenorPicker. Recognises the four ways a
 * market user expresses a value/settlement date in one text field:
 *
 * - **date**    `2028-04-15`, `15/04/2028`
 * - **tenor**   `3M`, `18M`, `1Y6M`, `3 months`, `ON`, `TN`, `SN`, `SW`
 * - **spot-relative** `Spot`, `Spot + 3M`, `Spot - 1W`
 * - **keyword** `Today`, `Tomorrow`
 *
 * The parser is *pure recognition* plus a **raw-calendar preview date** (no
 * holiday/business-day adjustment). Settlement adjustment is a component-level
 * concern (`settlementEngine`), so the parser stays deterministic and fully
 * unit-testable, and the whole function is swappable via a `parser` prop.
 *
 * Resolution bases (documented, market-conventional):
 * - plain **tenor** and **keyword** resolve from `referenceDate` ("today"),
 * - **spot-relative** resolves from `spotDate` (defaults to `referenceDate`).
 */

export type DateTenorMode = "date" | "tenor" | "spot-relative" | "keyword";

export type DateTenorParseError = "empty" | "unrecognized" | "invalid-tenor" | "invalid-date";

export interface DateTenorParseResult {
  /** True when the input was recognised and a preview date resolved. */
  valid: boolean;
  /** Which input mode matched, or `null` when invalid. */
  mode: DateTenorMode | null;
  /** Raw-calendar preview date (no business-day adjustment), or `null`. */
  date: Date | null;
  /** Canonical tenor string for tenor / spot-relative inputs (e.g. `"1Y6M"`). */
  tenor: string | null;
  /** Canonical display text (`"Spot + 3M"`, `"3M"`, `"Today"`, `"2028-04-15"`). */
  display: string | null;
  /** Reason the input was rejected (only when `valid` is false). */
  error?: DateTenorParseError;
}

export interface DateTenorParseContext {
  /** "Today" reference for keywords and plain tenors. Defaults to now (midnight). */
  referenceDate?: Date;
  /** Base date for spot-relative expressions. Defaults to `referenceDate`. */
  spotDate?: Date;
  /** Date formats to try, in order (first match wins). */
  dateFormats?: readonly DateFormat[];
}

/** A single tenor step, e.g. `{ value: 6, unit: "M" }`. */
interface TenorComponent {
  value: number;
  unit: TenorUnit;
}

/** Signature of a replacement parser passed to the component's `parser` prop. */
export type DateTenorParser = (input: string, ctx?: DateTenorParseContext) => DateTenorParseResult;

const DEFAULT_DATE_FORMATS: readonly DateFormat[] = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"];

/** Verbose unit words → canonical single-letter unit. */
const VERBOSE_UNITS: readonly (readonly [RegExp, string])[] = [
  [/YEARS?/g, "Y"],
  [/MONTHS?/g, "M"],
  [/WEEKS?/g, "W"],
  [/DAYS?/g, "D"],
];

const COMPONENT_RE = /(\d+)([DWMY])/g;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, n: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(date: Date, n: number): Date {
  const r = new Date(date);
  r.setMonth(r.getMonth() + n);
  return r;
}

function addYears(date: Date, n: number): Date {
  const r = new Date(date);
  r.setFullYear(r.getFullYear() + n);
  return r;
}

/** Apply a chain of tenor steps to a base date with raw calendar math. */
function applyComponents(base: Date, components: readonly TenorComponent[], sign: 1 | -1): Date {
  let acc = base;
  for (const { value, unit } of components) {
    const v = value * sign;
    if (unit === "D") acc = addDays(acc, v);
    else if (unit === "W") acc = addDays(acc, v * 7);
    else if (unit === "M") acc = addMonths(acc, v);
    else acc = addYears(acc, v);
  }
  return acc;
}

/** Expand verbose unit words (`3 MONTHS` → `3M`) and strip whitespace. */
function normalizeTenorText(raw: string): string {
  let out = raw.toUpperCase();
  for (const [re, unit] of VERBOSE_UNITS) out = out.replace(re, unit);
  return out.replace(/\s+/g, "");
}

/**
 * Parse a tenor expression into ordered components + canonical string.
 * Handles specials (ON/TN/SN/SW) and single tenors via {@link parseTenor}, and
 * compound tenors (`1Y6M`) directly. Returns `null` when unrecognised.
 */
function parseTenorExpression(
  raw: string,
): { components: TenorComponent[]; canonical: string } | null {
  const s = normalizeTenorText(raw);

  // Compound (1Y6M, 2W3D) - parseTenor only does single/special. The `{2,}`
  // guard already pins the exact shape, so no second full-string test is needed.
  if (/^(\d+[DWMY]){2,}$/.test(s)) {
    const components: TenorComponent[] = [];
    COMPONENT_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = COMPONENT_RE.exec(s)) !== null) {
      const value = parseInt(m[1], 10);
      if (value <= 0) return null;
      components.push({ value, unit: m[2] as TenorUnit });
    }
    return { components, canonical: components.map((c) => `${c.value}${c.unit}`).join("") };
  }

  // Single tenor or special (ON/TN/SN/SW).
  const p = parseTenor(s);
  if (p.valid && p.value != null && p.unit != null && p.tenor != null) {
    return { components: [{ value: p.value, unit: p.unit }], canonical: p.tenor };
  }
  return null;
}

function fail(error: DateTenorParseError): DateTenorParseResult {
  return { valid: false, mode: null, date: null, tenor: null, display: null, error };
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Index (0-11) of a month name/abbreviation, or -1. */
function monthIndex(token: string): number {
  return MONTH_ABBR.findIndex((m) => m.toLowerCase() === token.slice(0, 3).toLowerCase());
}

/** Build a calendar date, validating it didn't roll over (e.g. 31 Feb). */
function safeDate(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month, day);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day ? d : null;
}

/**
 * Parse a month-name date in either order: `15 Jan 2027` / `Jan 15 2027`
 * (also full names and an optional comma). Returns `null` when unrecognised.
 */
function parseMonthNameDate(input: string): Date | null {
  const parts = input.replace(/,/g, "").trim().split(/\s+/);
  if (parts.length !== 3) return null;

  // day month year
  const d1 = parseInt(parts[0], 10);
  const m1 = monthIndex(parts[1]);
  const y1 = parseInt(parts[2], 10);
  if (!Number.isNaN(d1) && m1 >= 0 && !Number.isNaN(y1)) return safeDate(y1, m1, d1);

  // month day year
  const m2 = monthIndex(parts[0]);
  const d2 = parseInt(parts[1], 10);
  const y2 = parseInt(parts[2], 10);
  if (m2 >= 0 && !Number.isNaN(d2) && !Number.isNaN(y2)) return safeDate(y2, m2, d2);

  return null;
}

/** Format as `15 Jan 2027`. */
function formatMonthNameDate(date: Date): string {
  return `${date.getDate()} ${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Parse a raw input string into a structured date/tenor result. See the module
 * docstring for supported forms and resolution bases.
 */
export function parseDateTenor(
  input: string,
  ctx: DateTenorParseContext = {},
): DateTenorParseResult {
  const reference = startOfDay(ctx.referenceDate ?? new Date());
  const spot = ctx.spotDate ? startOfDay(ctx.spotDate) : reference;
  const dateFormats = ctx.dateFormats ?? DEFAULT_DATE_FORMATS;

  const trimmed = input.trim();
  if (!trimmed) return fail("empty");
  const upper = trimmed.toUpperCase();

  // 1. Keywords.
  if (upper === "TODAY") {
    return { valid: true, mode: "keyword", date: reference, tenor: null, display: "Today" };
  }
  if (upper === "TOMORROW") {
    return {
      valid: true,
      mode: "keyword",
      date: addDays(reference, 1),
      tenor: null,
      display: "Tomorrow",
    };
  }

  // 2. Spot-relative.
  if (upper === "SPOT") {
    return { valid: true, mode: "spot-relative", date: spot, tenor: null, display: "Spot" };
  }
  const spotMatch = upper.match(/^SPOT\s*([+-])\s*(.+)$/);
  if (spotMatch) {
    const sign = spotMatch[1] === "-" ? -1 : 1;
    const expr = parseTenorExpression(spotMatch[2]);
    if (!expr) return fail("invalid-tenor");
    return {
      valid: true,
      mode: "spot-relative",
      date: applyComponents(spot, expr.components, sign),
      tenor: expr.canonical,
      display: `Spot ${sign === -1 ? "-" : "+"} ${expr.canonical}`,
    };
  }

  // 3. Plain tenor.
  const tenorExpr = parseTenorExpression(upper);
  if (tenorExpr) {
    return {
      valid: true,
      mode: "tenor",
      date: applyComponents(reference, tenorExpr.components, 1),
      tenor: tenorExpr.canonical,
      display: tenorExpr.canonical,
    };
  }

  // 4a. Month-name date (`15 Jan 2027`).
  const monthNameDate = parseMonthNameDate(trimmed);
  if (monthNameDate) {
    return {
      valid: true,
      mode: "date",
      date: monthNameDate,
      tenor: null,
      display: formatMonthNameDate(monthNameDate),
    };
  }

  // 4b. Numeric calendar date (first matching format wins).
  for (const fmt of dateFormats) {
    const parsed = parseDate(trimmed, fmt);
    if (parsed.valid && parsed.date) {
      return {
        valid: true,
        mode: "date",
        date: parsed.date,
        tenor: null,
        display: formatDate(parsed.date, fmt),
      };
    }
  }

  return fail("unrecognized");
}
