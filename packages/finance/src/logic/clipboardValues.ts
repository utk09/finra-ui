import { parseAmount } from "../utils/amount";

/** Which digit-separator convention to read a cell with. */
export type NumberLocaleHint = "US" | "EU" | "auto";

/** The result of reading one clipboard cell as a number. */
export interface CellNumberResult {
  /** Whether the cell held a number this convention could read. */
  valid: boolean;
  /** The value. Null whenever `valid` is false. */
  value: number | null;
  /** `"empty"` is separated from `"invalid"`, matching `parsePrice`. */
  error?: "empty" | "invalid" | "ambiguous";
  /** Which convention was used. Set even when `numberFormat` was explicit. */
  resolvedLocale: "US" | "EU";
}

/** Options for {@link parseCellNumber}. */
export interface CellNumberOptions {
  /**
   * `"auto"` decides from separator positions. When both readings are valid
   * (`"1.234"` is 1234 in EU and 1.234 in US) the result is `error: "ambiguous"`
   * and the caller decides, rather than the parser guessing silently.
   *
   * @defaultValue `"auto"`
   */
  numberFormat?: NumberLocaleHint;
  /**
   * Strip currency symbols and non-breaking spaces before parsing.
   *
   * @defaultValue `true`
   */
  stripCurrencySymbols?: boolean;
}

/**
 * Symbols stripped ahead of the number grammar.
 *
 * @remarks
 * Symbols only. Letter codes are left alone, so `"10 USD"` is reported invalid
 * rather than silently read as 10, because a cell whose currency disagrees with
 * its column is worth surfacing.
 */
const CURRENCY_SYMBOLS = /[$€£¥₹¢₽₩₪₺₴₦₫฿]/g;

/** What the caller sees when there was nothing to read. */
function fail(error: "empty" | "invalid" | "ambiguous", locale: "US" | "EU"): CellNumberResult {
  return { valid: false, value: null, error, resolvedLocale: locale };
}

interface Convention {
  locale: "US" | "EU";
  ambiguous: boolean;
}

/**
 * Where each convention allows its separators to fall.
 *
 * @remarks
 * Checked because stripping grouping separators without first confirming they
 * were grouping turns any dotted string into a number: `"1.2.3.4"` would come
 * back as `1234` rather than as the version string or address it almost
 * certainly is. A wrong number is worse than a reported failure.
 *
 * Groups are exactly three digits, so Indian lakh grouping (`12,34,567`) is
 * reported invalid rather than silently regrouped.
 */
const WELL_FORMED: Record<"US" | "EU", RegExp> = {
  US: /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,
  EU: /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/,
};

/**
 * Decide which convention a cell is written in, from where its separators fall.
 *
 * @remarks
 * With both separators present the last one is the decimal mark, which settles
 * every grouped number. With one separator the count of digits after it decides,
 * and one case cannot be decided at all: a single dot followed by exactly three
 * digits is 1.234 in US and 1234 in EU, and both are ordinary numbers in rates
 * and FX.
 *
 * A single comma followed by three digits is **not** treated as ambiguous, and
 * that asymmetry is deliberate. Reporting it would flag almost every grouped
 * number a US spreadsheet produces, which would make `"auto"` useless. `"auto"`
 * therefore leans US, and anyone pasting EU-formatted data sets `numberFormat`
 * rather than relying on the guess.
 */
function detectConvention(body: string): Convention {
  const lastDot = body.lastIndexOf(".");
  const lastComma = body.lastIndexOf(",");
  const dots = body.split(".").length - 1;
  const commas = body.split(",").length - 1;

  if (dots > 0 && commas > 0) {
    return { locale: lastDot > lastComma ? "US" : "EU", ambiguous: false };
  }

  if (dots > 1) return { locale: "EU", ambiguous: false };
  if (commas > 1) return { locale: "US", ambiguous: false };

  if (dots === 1) {
    const trailing = body.length - lastDot - 1;
    return trailing === 3 ? { locale: "US", ambiguous: true } : { locale: "US", ambiguous: false };
  }

  if (commas === 1) {
    const trailing = body.length - lastComma - 1;
    return { locale: trailing === 3 ? "US" : "EU", ambiguous: false };
  }

  return { locale: "US", ambiguous: false };
}

/**
 * Read one clipboard cell as a number.
 *
 * @remarks
 * The separator handling is {@link parseAmount}'s, not a second implementation
 * of it, so a cell and a typed amount always agree. This function adds only
 * what a pasted cell brings with it: currency symbols, a trailing percent sign,
 * and the question of which convention wrote it.
 *
 * A trailing `%` is removed and the digits are returned as written, so `"-10%"`
 * is `-10`. A percent column holds percents; rescaling it here would make the
 * number disagree with the cell it came from.
 *
 * Never throws. Every failure comes back through `error`, so one bad cell in a
 * pasted block does not cost the rows around it.
 *
 * @example
 * ```ts
 * parseCellNumber("$1,500,000.50");            // 1500000.5, US
 * parseCellNumber("1.500.000,50 €");           // 1500000.5, EU
 * parseCellNumber("(50,000.00)");              // -50000, US
 * parseCellNumber("1.234");                    // null, "ambiguous"
 * parseCellNumber("1.234", { numberFormat: "EU" }); // 1234
 * ```
 */
export function parseCellNumber(cell: string, options: CellNumberOptions = {}): CellNumberResult {
  const { numberFormat = "auto", stripCurrencySymbols = true } = options;

  let text = cell.trim();
  if (text === "") return fail("empty", "US");

  if (stripCurrencySymbols) text = text.replace(CURRENCY_SYMBOLS, "").trim();

  // The percent sign sits outside accounting parentheses (`(1,000)%`), so it
  // comes off before parseAmount looks for the wrapping pair.
  const percent = text.endsWith("%");
  if (percent) text = text.slice(0, -1).trim();

  if (text === "") return fail("invalid", "US");

  // Decided on digits and separators alone, so parentheses, signs and any
  // leftover symbol cannot be mistaken for trailing digits.
  const body = text.replace(/[^0-9.,]/g, "");
  const detected = detectConvention(body);

  if (numberFormat === "auto" && detected.ambiguous) return fail("ambiguous", detected.locale);

  const resolvedLocale = numberFormat === "auto" ? detected.locale : numberFormat;

  // Separators have to sit where this convention puts them before parseAmount
  // is allowed to strip them as grouping.
  if (!WELL_FORMED[resolvedLocale].test(body)) return fail("invalid", resolvedLocale);

  const parsed = parseAmount(text, {
    ...(resolvedLocale === "EU" ? { decimalSeparator: "," } : {}),
  });

  if (!parsed.valid || parsed.value === null) return fail("invalid", resolvedLocale);

  return { valid: true, value: parsed.value, resolvedLocale };
}
