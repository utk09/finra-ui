import { isSameDay } from "../logic/calendar";

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

export type StandardTenor = (typeof STANDARD_TENORS)[number];

export type TenorUnit = "D" | "W" | "M" | "Y";

export interface TenorParseResult {
  valid: boolean;
  tenor: string | null;
  value?: number;
  unit?: TenorUnit;
  error?: "invalid-format" | "invalid-value";
}

export type TenorResolver = (tenor: string, referenceDate: Date) => Date | null;

const SPECIAL_TENORS: Record<string, { value: number; unit: TenorUnit }> = {
  ON: { value: 1, unit: "D" },
  TN: { value: 2, unit: "D" },
  SN: { value: 2, unit: "D" },
  SW: { value: 1, unit: "W" },
};

const TENOR_REGEX = /^(\d+)([DWMY])$/i;

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
    default:
      return null;
  }
}

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
  value: number;
  unit: TenorUnit;
}

export interface FlexibleTenorParseResult {
  valid: boolean;
  /** Canonical tenor string (e.g. `"18M"`, `"1Y6M"`, `"ON"`), or `null` when invalid. */
  tenor: string | null;
  /** Decomposed terms, in descending unit magnitude. Empty for special tenors. */
  terms?: TenorTerm[];
  /** Special tenor code when the input resolved to one (`ON`/`TN`/`SN`/`SW`). */
  special?: string;
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
  let match: RegExpExecArray | null;
  TERM_SCAN.lastIndex = 0;
  while ((match = TERM_SCAN.exec(raw)) !== null) {
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
