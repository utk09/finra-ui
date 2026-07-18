/**
 * Market-aware price parsing, formatting, and tick math for PriceInput.
 *
 * Supported formats:
 * - **decimal**       `1.23456` (FX, generic). Paste-tolerant: strips currency,
 *   thousands separators, and instrument labels (`1,234.50`, `EURUSD 1.2345`).
 * - **bond32**        US-Treasury 32nds: `101-16` = 101 + 16/32 = 101.5.
 *   Accepts `'` as the separator (`99'27`) and a trailing eighth-of-a-32nd:
 *   `101-16+` (+ = 4/8) or `101-162` (digit = that many 8ths).
 * - **percent**       `4.125%` → 4.125 (the number is the value; not divided by 100).
 * - **basis-points**  `15 bp` → 15.
 *
 * All parsing is locale-independent: `.` is the decimal point, `,` is a
 * thousands separator (stripped). Parser, formatter, and tick engine are each
 * swappable via a component prop; these are the defaults.
 */

export type PriceFormat = "decimal" | "bond32" | "percent" | "basis-points";

export interface PriceFormatOptions {
  /** Quotation format. Default "decimal". */
  format?: PriceFormat;
  /** Display decimals (decimal / percent / basis-points). Format-specific default. */
  precision?: number;
  /** Tick size for the tick engine. Defaults to 1/32 for bonds, else 10^-precision. */
  tickSize?: number;
  /** Separator emitted when formatting bonds (`-` or `'`). Default "-". */
  bondSeparator?: string;
}

export interface PriceParseResult {
  valid: boolean;
  value: number | null;
  error?: "empty" | "invalid";
}

/** Signature of a replacement parser (component `parser` prop). */
export type PriceParser = (input: string, opts?: PriceFormatOptions) => PriceParseResult;
/** Signature of a replacement formatter (component `formatter` prop). */
export type PriceFormatter = (value: number, opts?: PriceFormatOptions) => string;
/** Signature of a replacement tick engine (component `tickEngine` prop). */
export type TickEngine = (value: number, steps: number, opts?: PriceFormatOptions) => number;

const BOND_TICK = 1 / 32;

function defaultPrecision(format: PriceFormat): number {
  switch (format) {
    case "percent":
      return 3;
    case "basis-points":
      return 2;
    case "bond32":
      return 6;
    default:
      return 5;
  }
}

/** Round to `p` decimal places, killing binary-float noise. */
function roundTo(n: number, p: number): number {
  const f = 10 ** p;
  return Math.round(n * f) / f;
}

/** Parse a plain decimal, tolerant of currency/thousands/label noise. */
function parseDecimal(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!/^-?(\d+(\.\d+)?|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Parse a bond 32nds string (`101-16`, `99'27`, `101-16+`, `101-162`). */
function parseBond(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9\-'+]/g, "");
  const m = cleaned.match(/^(\d+)[-'](\d{1,2})([+0-7])?$/);
  if (!m) return null;
  const whole = parseInt(m[1], 10);
  const thirtySeconds = parseInt(m[2], 10);
  if (thirtySeconds > 31) return null;
  const eighths = m[3] === "+" ? 4 : m[3] ? parseInt(m[3], 10) : 0;
  return roundTo(whole + (thirtySeconds + eighths / 8) / 32, 10);
}

/** Format a value as bond 32nds. */
function formatBond(value: number, separator: string): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  let whole = Math.trunc(abs);
  const rem = (abs - whole) * 32;
  let thirtySeconds = Math.floor(rem + 1e-9);
  let eighths = Math.round((rem - thirtySeconds) * 8);
  if (eighths === 8) {
    eighths = 0;
    thirtySeconds += 1;
  }
  if (thirtySeconds === 32) {
    thirtySeconds = 0;
    whole += 1;
  }
  let out = `${whole}${separator}${String(thirtySeconds).padStart(2, "0")}`;
  if (eighths === 4) out += "+";
  else if (eighths > 0) out += String(eighths);
  return negative ? `-${out}` : out;
}

/**
 * Parse a raw price string into a numeric value per `opts.format`.
 */
export function parsePrice(input: string, opts: PriceFormatOptions = {}): PriceParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, value: null, error: "empty" };

  const format = opts.format ?? "decimal";
  let value: number | null;
  if (format === "bond32") value = parseBond(trimmed);
  else if (format === "percent") value = parseDecimal(trimmed.replace(/%/g, ""));
  else if (format === "basis-points") value = parseDecimal(trimmed.replace(/bps?/gi, ""));
  else value = parseDecimal(trimmed);

  if (value === null) return { valid: false, value: null, error: "invalid" };
  return { valid: true, value };
}

/**
 * Format a numeric value as a display string per `opts.format`.
 */
export function formatPrice(value: number, opts: PriceFormatOptions = {}): string {
  const format = opts.format ?? "decimal";
  if (format === "bond32") return formatBond(value, opts.bondSeparator ?? "-");

  const precision = opts.precision ?? defaultPrecision(format);
  if (format === "percent") return `${value.toFixed(precision)}%`;
  if (format === "basis-points") return `${value.toFixed(precision)} bp`;
  return value.toFixed(precision);
}

//  Digit-level segmentation (visual hierarchy)

export type PriceSegmentKind =
  | "sign"
  | "integer"
  | "separator"
  // 2-tier (primary emphasized, precision de-emphasized)
  | "primary"
  | "precision"
  // FX 3-zone (big figure de-emphasized, pips emphasized, fractional pip medium)
  | "big-figure"
  | "pips"
  | "fractional-pip"
  | "unit";

/** A contiguous run of a formatted price, tagged by its semantic role. */
export interface PriceSegment {
  kind: PriceSegmentKind;
  text: string;
}

/**
 * Segmentation config. Passing a bare number is shorthand for `primaryPrecision`
 * (the 2-tier model). Set `pipDigits` to switch to the FX 3-zone model traders
 * expect (big figure / pips / fractional pip).
 */
export interface PriceSegmentConfig {
  /** 2-tier: fractional digits before the de-emphasized tail. */
  primaryPrecision?: number;
  /** FX 3-zone: fractional digits forming the big figure (de-emphasized). */
  bigFigureDigits?: number;
  /** FX 3-zone: fractional digits forming the pips (emphasized). Enables FX mode. */
  pipDigits?: number;
}

/**
 * Split a formatted decimal price into semantic segments for visual hierarchy
 * (FIN-001-01).
 *
 * 2-tier (`primaryPrecision` / a bare number): `1.08345` @ 4 →
 * `1` `.` `0834` `5` (primary vs precision).
 *
 * FX 3-zone (`pipDigits` set): `1.23456` @ `{ bigFigureDigits: 2, pipDigits: 2 }`
 * → `1.23` (big-figure) `45` (pips) `6` (fractional-pip) — the trader view where
 * the pips are the focal digits.
 *
 * Non-decimal displays (bonds) with no `.` return a single integer segment.
 */
export function segmentPrice(display: string, config: number | PriceSegmentConfig): PriceSegment[] {
  const cfg: PriceSegmentConfig =
    typeof config === "number" ? { primaryPrecision: config } : config;
  const segments: PriceSegment[] = [];
  let s = display;

  // Trailing unit.
  let unit = "";
  if (s.endsWith("%")) {
    unit = "%";
    s = s.slice(0, -1);
  } else if (s.endsWith(" bp")) {
    unit = " bp";
    s = s.slice(0, -3);
  }

  // Leading sign.
  if (s.startsWith("-")) {
    segments.push({ kind: "sign", text: "-" });
    s = s.slice(1);
  }

  const dot = s.indexOf(".");
  if (dot === -1) {
    if (s) segments.push({ kind: "integer", text: s });
  } else {
    const intPart = s.slice(0, dot);
    const frac = s.slice(dot + 1);

    if (cfg.pipDigits != null) {
      // FX 3-zone: the big figure (integer + leading frac digits) is one unit.
      const bf = cfg.bigFigureDigits ?? 0;
      const bigFigure = frac.slice(0, bf);
      const pips = frac.slice(bf, bf + cfg.pipDigits);
      const fractionalPip = frac.slice(bf + cfg.pipDigits);
      segments.push({ kind: "big-figure", text: `${intPart}.${bigFigure}` });
      if (pips) segments.push({ kind: "pips", text: pips });
      if (fractionalPip) segments.push({ kind: "fractional-pip", text: fractionalPip });
    } else {
      const primaryPrecision = cfg.primaryPrecision ?? 0;
      if (intPart) segments.push({ kind: "integer", text: intPart });
      segments.push({ kind: "separator", text: "." });
      const primary = frac.slice(0, primaryPrecision);
      const precision = frac.slice(primaryPrecision);
      if (primary) segments.push({ kind: "primary", text: primary });
      if (precision) segments.push({ kind: "precision", text: precision });
    }
  }

  if (unit) segments.push({ kind: "unit", text: unit });
  return segments;
}

/**
 * Move `value` by `steps` ticks, snapping to the nearest valid tick first
 * (so an off-tick value lands on grid). `steps === 0` snaps in place.
 */
export function stepPrice(value: number, steps: number, opts: PriceFormatOptions = {}): number {
  const format = opts.format ?? "decimal";
  const precision = opts.precision ?? defaultPrecision(format);
  const tickSize = opts.tickSize ?? (format === "bond32" ? BOND_TICK : 10 ** -precision);
  const ticks = Math.round(value / tickSize) + steps;
  return roundTo(ticks * tickSize, 10);
}
