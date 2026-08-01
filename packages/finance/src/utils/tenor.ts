import { isSameDay } from "../logic/calendar";

/**
 * The market-standard tenor set, in conventional order.
 *
 * @remarks
 * Short end first (`ON`, `TN`, `SN`, `SW`), then weeks, months and years. The
 * order is the order a picker offers them in, so it is convention rather than
 * arbitrary. {@link StandardTenor} is derived from this.
 */
export const STANDARD_TENORS = [
  "ON",
  "TN",
  "SN",
  "SW",
  "1W",
  "2W",
  "1M",
  "2M",
  "3M",
  "6M",
  "9M",
  "1Y",
  "2Y",
  "3Y",
  "5Y",
  "10Y",
  "15Y",
  "20Y",
  "30Y",
] as const;

/**
 * The market-standard tenor set, as a literal union.
 *
 * @remarks
 * Derived from {@link STANDARD_TENORS} rather than declared separately, so the
 * two can never drift. A tenor outside this set is a *broken* date - still
 * valid, just not standard.
 */
export type StandardTenor = (typeof STANDARD_TENORS)[number];

/**
 * The four time units a tenor can be expressed in.
 *
 * @remarks
 * The special codes are not units: `ON`, `TN` and `SN` resolve to days, `SW` to
 * one week. Business-day and holiday rules are deliberately absent - resolution
 * here is pure calendar arithmetic, and rolling is the consumer's job.
 */
export type TenorUnit = "D" | "W" | "M" | "Y";

/**
 * The result of parsing a simple tenor (`3M`, `ON`, `10Y`).
 *
 * @remarks
 * Strict: one number and one unit, or a special code. For long-form and
 * compound input (`3 months`, `1Y6M`) use {@link parseTenorInput}, which
 * returns {@link FlexibleTenorParseResult}.
 */
export interface TenorParseResult {
  /** Whether the input parsed. */
  valid: boolean;
  /** Canonical form (`"3M"`), or `null` when invalid. */
  tenor: string | null;
  /** The numeric part. Absent when invalid. */
  value?: number;
  /** The unit. Absent when invalid. */
  unit?: TenorUnit;
  /**
   * Why it failed. `"invalid-format"` means it is not a tenor at all;
   * `"invalid-value"` means it parsed but the number is out of range (`0M`).
   */
  error?: "invalid-format" | "invalid-value";
}

/**
 * Resolves a tenor to a date. Injectable so a desk can substitute its own
 * conventions.
 *
 * @remarks
 * The default ({@link resolveTenor}) is pure calendar arithmetic with no
 * holiday or business-day awareness. Replace it when spot lag or a roll
 * convention has to be applied during resolution rather than afterwards.
 *
 * @returns The resolved date, or `null` when the tenor is unrecognised.
 */
export type TenorResolver = (tenor: string, referenceDate: Date) => Date | null;

const SPECIAL_TENORS: Record<string, { value: number; unit: TenorUnit }> = {
  ON: { value: 1, unit: "D" },
  TN: { value: 2, unit: "D" },
  SN: { value: 2, unit: "D" },
  SW: { value: 1, unit: "W" },
};

const TENOR_REGEX = /^(\d+)([DWMY])$/i;

/**
 * Parse a simple tenor: one number and one unit, or a special code.
 *
 * @remarks
 * Case-insensitive and whitespace-trimmed, but otherwise strict - it will not
 * accept `3 months` or `1Y6M`. Use {@link parseTenorInput} for those.
 *
 * @param input - Text such as `"3M"`, `"10y"` or `"ON"`.
 * @returns The canonical tenor and its parts, or the reason it failed.
 */
export function parseTenor(input: string): TenorParseResult {
  const normalized = input.trim().toUpperCase();

  if (!normalized) {
    return { valid: false, tenor: null, error: "invalid-format" };
  }

  // Check special tenors first
  if (normalized in SPECIAL_TENORS) {
    const { value, unit } = SPECIAL_TENORS[normalized];
    return { valid: true, tenor: normalized, value, unit };
  }

  // Check numeric tenor pattern (e.g. 3M, 10Y, 2W)
  const match = normalized.match(TENOR_REGEX);
  if (!match) {
    return { valid: false, tenor: null, error: "invalid-format" };
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] as TenorUnit;

  if (value <= 0) {
    return { valid: false, tenor: null, error: "invalid-value" };
  }

  return { valid: true, tenor: `${value}${unit}`, value, unit };
}

/**
 * Whether a string is one of the market-standard tenors.
 *
 * @remarks
 * A type guard, so a `true` result narrows the value to {@link StandardTenor}.
 * Case-insensitive.
 *
 * @param input - Text to test.
 * @returns True if it names a standard tenor.
 */
export function isStandardTenor(input: string): input is StandardTenor {
  return (STANDARD_TENORS as readonly string[]).includes(input.toUpperCase());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Resolve a tenor to a date by pure calendar arithmetic.
 *
 * @remarks
 * No holiday or business-day awareness, and no spot lag: `3M` from 31 January
 * lands on 30 April because `Date` clamps the day, not because a roll
 * convention was applied. Rolling is the consumer's job - inject a
 * {@link TenorResolver} or apply a `BusinessCalendar` afterwards.
 *
 * @param tenor - Canonical or special tenor, e.g. `"3M"` or `"SN"`.
 * @param referenceDate - The date to count from.
 * @returns The resolved date, or `null` if the tenor is unrecognised.
 */
export function resolveTenor(tenor: string, referenceDate: Date): Date | null {
  const parsed = parseTenor(tenor);
  if (!parsed.valid || parsed.value == null || parsed.unit == null) return null;

  switch (parsed.unit) {
    case "D":
      return addDays(referenceDate, parsed.value);
    case "W":
      return addDays(referenceDate, parsed.value * 7);
    case "M":
      return addMonths(referenceDate, parsed.value);
    case "Y":
      return addYears(referenceDate, parsed.value);
    /* istanbul ignore next -- TENOR_REGEX only admits [DWMY], so no input reaches this */
    default:
      return null;
  }
}

/**
 * The standard tenor a date lands on, if any.
 *
 * @remarks
 * The inverse of {@link resolveTenor}, and what distinguishes a standard date
 * from a *broken* one. A `null` result is not a failure - it means the date is
 * simply not a round tenor from the reference, which is exactly what the
 * broken-date indicator reports.
 *
 * @param date - The date to identify.
 * @param referenceDate - The date to measure from.
 * @returns The matching standard tenor, or `null` for a broken date.
 */
export function dateToTenor(date: Date, referenceDate: Date): StandardTenor | null {
  for (const tenor of STANDARD_TENORS) {
    const resolved = resolveTenor(tenor, referenceDate);
    if (resolved && isSameDay(resolved, date)) {
      return tenor;
    }
  }
  return null;
}

//  Flexible tenor input parsing (TenorPicker's replaceable parser)

/** One decomposed leg of a (possibly compound) tenor, e.g. `{ value: 6, unit: "M" }`. */
export interface TenorTerm {
  /** The count. Always positive. */
  value: number;
  /** The unit this count is in. */
  unit: TenorUnit;
}

/**
 * The result of parsing free-form tenor input.
 *
 * @remarks
 * Accepts what a trader actually types - `3 months`, `1y6m`, `90d`, `ON` - and
 * normalises it to canonical form. A compound tenor decomposes into `terms` in
 * descending unit magnitude; a special code sets `special` and leaves `terms`
 * empty.
 */
export interface FlexibleTenorParseResult {
  /** Whether the input parsed. */
  valid: boolean;
  /** Canonical tenor string (e.g. `"18M"`, `"1Y6M"`, `"ON"`), or `null` when invalid. */
  tenor: string | null;
  /** Decomposed terms, in descending unit magnitude. Empty for special tenors. */
  terms?: TenorTerm[];
  /** Special tenor code when the input resolved to one (`ON`/`TN`/`SN`/`SW`). */
  special?: string;
  /**
   * Why it failed. `"invalid-format"` means it is not a tenor at all;
   * `"invalid-value"` means it parsed but a number is out of range.
   */
  error?: "invalid-format" | "invalid-value";
}

/** Replaceable parser used by `TenorPicker` (same signature as {@link parseTenorInput}). */
export type TenorInputParser = (input: string) => FlexibleTenorParseResult;

/** Long/short unit words → canonical unit letter. Case-insensitive at the call site. */
const UNIT_WORDS: Record<string, TenorUnit> = {
  D: "D",
  DAY: "D",
  DAYS: "D",
  W: "W",
  WK: "W",
  WKS: "W",
  WEEK: "W",
  WEEKS: "W",
  M: "M",
  MO: "M",
  MON: "M",
  MTH: "M",
  MTHS: "M",
  MONTH: "M",
  MONTHS: "M",
  Y: "Y",
  YR: "Y",
  YRS: "Y",
  YEAR: "Y",
  YEARS: "Y",
};

/** Named/coded special tenors (letters only, no digits) → canonical code. */
const SPECIAL_NAME_TO_CODE: Record<string, string> = {
  ON: "ON",
  OVERNIGHT: "ON",
  TN: "TN",
  TOMNEXT: "TN",
  TOMORROWNEXT: "TN",
  SN: "SN",
  SPOTNEXT: "SN",
  SW: "SW",
  SPOTWEEK: "SW",
};

/** Ordering weight so compound canonicals read `1Y6M`, never `6M1Y`. */
const UNIT_RANK: Record<TenorUnit, number> = { Y: 4, M: 3, W: 2, D: 1 };

const TERM_SCAN = /(\d+)\s*([a-z]+)/gi;

/**
 * Parse free-form tenor input into a canonical string.
 *
 * Accepts case-insensitive short/long units (`3m`, `3M`, `3 months`, `90d`),
 * compound tenors (`1y6m`, `2w3d`), and named specials (`overnight`, `tom-next`,
 * `SN`, `spot week`). Whitespace and a single `-`/`/` separator are ignored.
 * Compound canonicals are emitted in descending unit magnitude (`1Y6M`).
 */
export function parseTenorInput(input: string): FlexibleTenorParseResult {
  const raw = input.trim();
  if (!raw) return { valid: false, tenor: null, error: "invalid-format" };

  // Named/coded specials contain no digits (e.g. "overnight", "SN", "tom-next").
  const compact = raw.replace(/[\s\-/]+/g, "").toUpperCase();
  if (!/\d/.test(compact) && compact in SPECIAL_NAME_TO_CODE) {
    const code = SPECIAL_NAME_TO_CODE[compact];
    return { valid: true, tenor: code, terms: [], special: code };
  }

  // Numeric term scan (supports compound like "1y6m", "1y 6m", "2w3d").
  const terms: TenorTerm[] = [];
  const seen = new Set<TenorUnit>();
  let consumed = 0;
  // matchAll rather than a lastIndex-driven exec loop: the regex is
  // module-level, so a manual `lastIndex = 0` reset was the only thing stopping
  // state leaking between calls. matchAll clones it instead.
  for (const match of raw.matchAll(TERM_SCAN)) {
    const value = parseInt(match[1], 10);
    const unit = UNIT_WORDS[match[2].toUpperCase()];
    if (!unit) return { valid: false, tenor: null, error: "invalid-format" };
    if (value <= 0) return { valid: false, tenor: null, error: "invalid-value" };
    if (seen.has(unit)) return { valid: false, tenor: null, error: "invalid-format" };
    seen.add(unit);
    terms.push({ value, unit });
    consumed += match[0].replace(/\s+/g, "").length;
  }

  if (terms.length === 0) return { valid: false, tenor: null, error: "invalid-format" };
  // Reject trailing/embedded junk not covered by the scan (e.g. "3m5", "3mx").
  if (consumed !== raw.replace(/\s+/g, "").length) {
    return { valid: false, tenor: null, error: "invalid-format" };
  }

  terms.sort((a, b) => UNIT_RANK[b.unit] - UNIT_RANK[a.unit]);
  const canonical = terms.map((t) => `${t.value}${t.unit}`).join("");
  return { valid: true, tenor: canonical, terms };
}
