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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
