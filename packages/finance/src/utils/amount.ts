/**
 * Human-notation amount parsing and display formatting.
 *
 * Traders type `10m`, not `10000000`. This module turns the former into the
 * latter and back, without ever letting the shorthand become the source of
 * truth: the canonical value is always a plain number, and the suffix is only
 * ever a rendering of it.
 *
 * ## Why the default table is fixed rather than locale-derived
 *
 * `Intl.NumberFormat(locale, { notation: "compact" })` already knows compact
 * suffixes for every locale - including lakh/crore for `en-IN` and the
 * four-digit groupings for `ja-JP` - and {@link compactSuffixesForLocale}
 * extracts them. It is deliberately *not* the default.
 *
 * Parsing that varies with ambient locale means identical code yields different
 * numbers on different machines, which no test baseline can pin down. Choosing
 * locale policy is the application's job. Desk convention agrees: interbank
 * flow types `10m` worldwide, and crore belongs to domestic retail. So the
 * default is `K`/`M`/`B`/`T`, and anything else is opt-in and explicit.
 *
 * Formatting is the other direction and could safely follow locale - but
 * compact *display* deliberately reuses the parse table anyway, so that
 * everything this module renders is something it can also read back. See
 * {@link formatAmount}.
 */

import { decimalPlaces, roundToDecimals, scaleByPowerOfTen } from "./decimal";

/**
 * Suffix to power-of-ten exponent, e.g. `{ M: 6 }` expands `4.1M` to `4100000`.
 *
 * Keys are matched longest-first, so entries may safely prefix one another
 * (`K` and `KCr`).
 */
export type AmountSuffixTable = Readonly<Record<string, number>>;

/**
 * The four magnitudes: `K`, `M`, `B`, `T`.
 *
 * `BN` is also accepted, as a pure alias for `B` - `1bn` is at least as common
 * as `1b` in rates and FX, and it is an alternate spelling of an existing
 * magnitude rather than a new one. It is only ever *read*: display always
 * resolves 10^9 to `B`, because equal magnitudes tie-break to the shorter
 * spelling (see {@link preferredSuffix}). Anything beyond these - `MM` for US
 * credit millions, lakh/crore - is opt-in via `suffixes`.
 */
export const DEFAULT_AMOUNT_SUFFIXES: AmountSuffixTable = {
  K: 3,
  M: 6,
  B: 9,
  BN: 9,
  T: 12,
};

/** Separators stripped from digit groups before parsing. */
export const DEFAULT_GROUP_SEPARATORS = [
  ",",
  " ",
  " ", // no-break space
  " ", // narrow no-break space - what fr-FR actually emits
  " ", // thin space
  "_",
] as const;

/**
 * The group separators that go with a decimal mark.
 *
 * A locale that uses `,` for decimals uses `.` for grouping, so defaulting to
 * the `.`-less list would make `1.234,5` unparseable for anyone who set only
 * `decimalSeparator` - the mark would survive normalisation and read as a
 * second decimal point.
 */
function defaultGroupSeparators(decimalSeparator: string): readonly string[] {
  if (decimalSeparator === ".") return DEFAULT_GROUP_SEPARATORS;
  return [".", ...DEFAULT_GROUP_SEPARATORS.filter((s) => s !== decimalSeparator)];
}

export type AmountParseError =
  /** Blank input. */
  | "empty"
  /** No digits, or digits the number grammar cannot accept. */
  | "invalid-number"
  /** Trailing text that is not a known suffix. */
  | "unknown-suffix"
  /** Negative input where negatives are not permitted. */
  | "negative-not-allowed"
  /** Parsed cleanly but overflowed float64, or fell outside `min`/`max`. */
  | "out-of-range";

export interface AmountParseResult {
  valid: boolean;
  /** Canonical expanded value. Null when invalid. */
  value: number | null;
  /** Currency code found in the input, when one was looked for. */
  currency: string | null;
  /** Suffix as spelled in the table (not as the user cased it). Null when none. */
  suffix: string | null;
  /**
   * Total power of ten applied to the typed digits - the suffix's magnitude plus
   * any `e` notation. `0` for a plain number, `6` for `4.1m`, `11` for `1e5m`.
   */
  exponent: number;
  error?: AmountParseError;
}

export interface AmountParseOptions {
  /**
   * Extra suffixes, **merged over** {@link DEFAULT_AMOUNT_SUFFIXES}. Pass
   * `{ ...compactSuffixesForLocale("en-IN") }` for lakh/crore, or
   * `{ MM: 6 }` for a house convention.
   *
   * To drop the defaults entirely rather than extend them, use
   * `replaceSuffixes`.
   */
  suffixes?: AmountSuffixTable;
  /** Use `suffixes` alone, ignoring the defaults. Default false. */
  replaceSuffixes?: boolean;
  /** Match suffix casing exactly. Default false, so `10m` and `10M` agree. */
  caseSensitive?: boolean;
  /** Decimal mark. Default `"."`. */
  decimalSeparator?: string;
  /**
   * Marks removed from digit groups. Defaults to {@link DEFAULT_GROUP_SEPARATORS},
   * or to that list with `.` swapped in when `decimalSeparator` is not `.`.
   */
  groupSeparators?: readonly string[];
  /** Default true. */
  allowNegative?: boolean;
  /** Read `(1,234)` as `-1234`, the accounting convention. Default true. */
  allowAccountingNegative?: boolean;
  /**
   * Currency codes to recognise as a prefix or suffix token (`USD 10m`,
   * `10m USD`). Without this, letters are only ever read as magnitude
   * suffixes.
   */
  currencyCodes?: Iterable<string>;
  /** Reject values below this. */
  min?: number;
  /** Reject values above this. */
  max?: number;
}

function fail(error: AmountParseError): AmountParseResult {
  return { valid: false, value: null, currency: null, suffix: null, exponent: 0, error };
}

/**
 * Suffix keys ordered longest-first.
 *
 * Mandatory, not an optimisation. Scanning shortest-first reads `1KCr` as `1K`
 * and discards the rest - 10^3 where 10^10 was meant. Any table with a key that
 * prefixes another (`K`/`KCr`, `B`/`BN`, `M`/`MM`) carries that hazard.
 */
function orderedSuffixKeys(table: AmountSuffixTable): string[] {
  return Object.keys(table).sort((a, b) => b.length - a.length || a.localeCompare(b));
}

function resolveTable(options: AmountParseOptions): AmountSuffixTable {
  const { suffixes, replaceSuffixes = false } = options;
  if (!suffixes) return DEFAULT_AMOUNT_SUFFIXES;
  return replaceSuffixes ? suffixes : { ...DEFAULT_AMOUNT_SUFFIXES, ...suffixes };
}

/**
 * Find the table entry `text` spells, or `null`.
 *
 * Returns the key as the *table* spells it, so a result can be re-rendered
 * consistently regardless of how the user cased their input.
 */
function matchSuffix(
  text: string,
  table: AmountSuffixTable,
  caseSensitive: boolean,
): string | null {
  if (text === "") return null;
  const needle = caseSensitive ? text : text.toUpperCase();

  for (const key of orderedSuffixKeys(table)) {
    const candidate = caseSensitive ? key : key.toUpperCase();
    if (candidate === needle) return key;
  }
  return null;
}

/**
 * Split a leading or trailing currency token off the input.
 *
 * Matched case-insensitively and returned upper-cased, since currency codes are
 * conventionally capitals regardless of how they are typed.
 */
function extractCurrency(
  text: string,
  codes: Iterable<string>,
): { rest: string; currency: string | null } {
  const known = new Set<string>();
  for (const code of codes) known.add(code.toUpperCase());
  if (known.size === 0) return { rest: text, currency: null };

  // A code is only a code when whitespace or a digit boundary separates it from
  // the number, so `M` in `10M` is never mistaken for a currency named M.
  const leading = /^([A-Za-z]{2,10})\s*(.*)$/.exec(text);
  if (leading && known.has(leading[1].toUpperCase())) {
    return { rest: leading[2], currency: leading[1].toUpperCase() };
  }

  const trailing = /^(.*?)\s+([A-Za-z]{2,10})$/.exec(text);
  if (trailing && known.has(trailing[2].toUpperCase())) {
    return { rest: trailing[1], currency: trailing[2].toUpperCase() };
  }

  return { rest: text, currency: null };
}

/**
 * Parse human amount notation into a canonical number.
 *
 * ```ts
 * parseAmount("4.1m").value;                              // 4100000
 * parseAmount("1,234.5").value;                           // 1234.5
 * parseAmount("1e5").value;                               // 100000
 * parseAmount("(1,234)").value;                           // -1234
 * parseAmount("10MM").error;                              // "unknown-suffix"
 * parseAmount("10MM", { suffixes: { MM: 6 } }).value;     // 10000000
 * parseAmount("USD 2bn", { currencyCodes: ["USD"] });     // 2e9, currency "USD"
 * ```
 *
 * Trailing text that is not a known suffix is an **error, never ignored**. An
 * unconfigured house convention must fail loudly, because the alternative is
 * committing `10M` when `10MM` was typed - a silent factor of a million.
 */
export function parseAmount(input: string, options: AmountParseOptions = {}): AmountParseResult {
  const {
    caseSensitive = false,
    decimalSeparator = ".",
    groupSeparators = defaultGroupSeparators(decimalSeparator),
    allowNegative = true,
    allowAccountingNegative = true,
    currencyCodes,
    min,
    max,
  } = options;

  const table = resolveTable(options);
  let text = input.trim();
  if (text === "") return fail("empty");

  let currency: string | null = null;
  if (currencyCodes) {
    const extracted = extractCurrency(text, currencyCodes);
    text = extracted.rest.trim();
    currency = extracted.currency;
    if (text === "") return fail("invalid-number");
  }

  // Accounting parentheses wrap the whole amount, so unwrap before anything
  // else reads a sign.
  let negative = false;
  if (allowAccountingNegative && text.startsWith("(") && text.endsWith(")")) {
    negative = true;
    text = text.slice(1, -1).trim();
  }

  if (text.startsWith("-")) {
    negative = !negative;
    text = text.slice(1).trim();
  } else if (text.startsWith("+")) {
    text = text.slice(1).trim();
  }

  // Group separators go before the decimal mark is normalised, so a locale
  // using "." for grouping and "," for decimals still works.
  for (const separator of groupSeparators) {
    if (separator === decimalSeparator) continue;
    text = text.split(separator).join("");
  }
  if (decimalSeparator !== ".") text = text.split(decimalSeparator).join(".");

  const shape = /^([0-9]*\.?[0-9]*)(.*)$/.exec(text);
  /* istanbul ignore next -- the pattern's groups are both optional, so it cannot fail */
  if (!shape) return fail("invalid-number");

  const [, digits, remainder] = shape;
  if (digits === "" || digits === ".") return fail("invalid-number");

  const mantissa = Number(digits);
  if (!Number.isFinite(mantissa)) return fail("invalid-number");

  let suffixText = remainder.trim();

  // `e` notation is a magnitude like any other, so it is read here and added to
  // whatever a suffix contributes: `1e5` is 100000 and `1e5m` is 1e11. A table
  // that defines `E` as a suffix stays usable because the two never collide -
  // digits after the `e` make it an exponent, and `5E` (no digits) is a suffix.
  let scientific = 0;
  const exponentNotation = /^[eE]([+-]?[0-9]+)/.exec(suffixText);
  if (exponentNotation) {
    scientific = Number(exponentNotation[1]);
    suffixText = suffixText.slice(exponentNotation[0].length).trim();
  }

  // A second decimal mark leaves digits in the remainder (`1.2.3` -> `.3`, and
  // `1e5.5` -> `.5`). That is a malformed number, not an unrecognised suffix,
  // and reporting it as the latter would send a consumer hunting for a table
  // entry to add.
  if (/^[0-9.]/.test(suffixText)) return fail("invalid-number");

  const suffix = matchSuffix(suffixText, table, caseSensitive);
  if (suffixText !== "" && suffix === null) return fail("unknown-suffix");

  const exponent = (suffix === null ? 0 : table[suffix]) + scientific;
  const magnitude = exponent === 0 ? mantissa : scaleByPowerOfTen(mantissa, exponent);
  // `1e999` is well-formed notation for a number float64 cannot hold. Reject it
  // rather than let `Infinity` reach a field as though it were an amount.
  if (!Number.isFinite(magnitude)) return fail("out-of-range");
  // `-0` would survive `"-0"` and `"(0)"`, and React's `Object.is` state
  // comparison treats it as a change from `0`, so it never leaves the parser.
  const value = withoutNegativeZero(negative ? -magnitude : magnitude);

  if (!allowNegative && value < 0) return fail("negative-not-allowed");
  if (min !== undefined && value < min) return fail("out-of-range");
  if (max !== undefined && value > max) return fail("out-of-range");

  return { valid: true, value, currency, suffix, exponent };
}

export type AmountFormat =
  /** Grouped digits, e.g. `10,000,000`. */
  | "full"
  /** Shortest suffix form, e.g. `10M`. */
  | "compact"
  /** Currency with negatives in parentheses, e.g. `($1,234.50)`. */
  | "accounting"
  /** Ungrouped canonical digits - what an input shows while being edited. */
  | "plain";

export interface AmountFormatOptions {
  /** Default `"full"`. */
  format?: AmountFormat;
  /** ISO code. Drives symbol and default precision. */
  currency?: string;
  /** BCP-47 tag for digit grouping and decimal mark. Default: runtime locale. */
  locale?: string;
  /** Fixed decimal places. Defaults to the currency's, else natural precision. */
  decimals?: number;
  /** Table used by `"compact"`. Same merge semantics as {@link AmountParseOptions}. */
  suffixes?: AmountSuffixTable;
  /** Use `suffixes` alone for `"compact"`. Default false. */
  replaceSuffixes?: boolean;
  /**
   * Smallest magnitude `"compact"` will abbreviate. Default `1e6`.
   *
   * Below a million a suffix buys nothing: `1.23K` and `1,234` are both five
   * characters, so the abbreviation costs precision and saves no space.
   */
  compactFrom?: number;
  /**
   * Most fractional digits a compact mantissa may carry. Default 3.
   *
   * Only relevant while compacting losslessly - a value needing more places
   * than this is rendered in full instead.
   */
  compactMaxDecimals?: number;
}

/**
 * Decimal places a currency conventionally shows: JPY 0, USD 2, KWD 3.
 *
 * Read from `Intl` rather than a hardcoded table, so the list stays correct
 * without maintenance. Returns `null` for an unrecognised code.
 */
export function currencyDecimals(currency: string, locale?: string): number | null {
  try {
    const resolved = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).resolvedOptions();
    // Optional in the Intl typings, and genuinely absent for some runtimes.
    return resolved.maximumFractionDigits ?? null;
  } catch {
    // RangeError for anything Intl does not accept as a currency code.
    return null;
  }
}

/**
 * The compact suffixes CLDR uses for a locale, as a table this module can parse
 * with.
 *
 * ```ts
 * compactSuffixesForLocale("en-IN"); // { K: 3, L: 5, Cr: 7, KCr: 10, LCr: 12 }
 * compactSuffixesForLocale("ja-JP"); // { 万: 4, 億: 8, 兆: 12 }
 * ```
 *
 * Provided so consumers who *want* locale conventions do not hand-maintain
 * them - not used by default, because parsing must not depend on ambient
 * locale. Note that some locales (`de-DE`) have no compact form for thousands,
 * so the returned table can be sparse.
 */
export function compactSuffixesForLocale(locale: string): AmountSuffixTable {
  const formatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  });
  const table: Record<string, number> = {};

  for (let exponent = 3; exponent <= 14; exponent++) {
    const parts = formatter.formatToParts(scaleByPowerOfTen(1, exponent));
    const compact = parts.find((part) => part.type === "compact");
    if (!compact) continue;

    // The suffix stands for the exponent minus whatever stayed in the mantissa:
    // en-IN renders 1e5 as "1L" (L = 5) but 1e6 as "10L" (still 5).
    const integerDigits = parts
      .filter((part) => part.type === "integer")
      .map((part) => part.value)
      .join("").length;
    const represented = exponent - (integerDigits - 1);

    if (!(compact.value in table)) table[compact.value] = represented;
  }

  return table;
}

/**
 * Collapse negative zero to zero.
 *
 * `-0 === 0` is true, so this is a no-op for every other value. Needed because
 * a small negative that rounds away keeps its sign, and `Intl` faithfully
 * renders the result as `-0` - which reads as a data error in an amount field.
 * `signDisplay: "negative"` would also fix it, but that option postdates this
 * package's `lib` target and augmenting the global `Intl` types would leak the
 * change to every consumer.
 */
function withoutNegativeZero(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * Upper bound on a compact mantissa. A suffix exists to keep the number short,
 * so `1.5M` is the point and `1500K` is not.
 */
const MAX_COMPACT_MANTISSA = 1000;

/**
 * Order two suffixes that stand for the *same* magnitude, best first.
 *
 * Shorter wins, so `B` is what 10^9 renders as and the `BN` alias is only ever
 * read; alphabetical breaks any remaining tie. Without an explicit rule the
 * winner would fall out of a table's key insertion order, which is not
 * something a consumer passing `suffixes` should have to think about.
 */
function preferredSuffix(a: string, b: string): number {
  return a.length - b.length || a.localeCompare(b);
}

/** Largest table entry that leaves `value` at or above 1, or `null` for none. */
function bestSuffix(
  value: number,
  table: AmountSuffixTable,
): { suffix: string; exponent: number } | null {
  const magnitude = Math.abs(value);
  let best: { suffix: string; exponent: number } | null = null;

  for (const [suffix, exponent] of Object.entries(table)) {
    if (exponent <= 0) continue;
    if (magnitude < scaleByPowerOfTen(1, exponent)) continue;
    if (
      best === null ||
      exponent > best.exponent ||
      (exponent === best.exponent && preferredSuffix(suffix, best.suffix) < 0)
    ) {
      best = { suffix, exponent };
    }
  }

  return best;
}

/**
 * The largest suffix that abbreviates `value` **without losing a digit**, or
 * `null` if none can.
 *
 * `1500000` compacts to `1.5M` because nothing is discarded. `1500123` does
 * not: every suffix leaves a mantissa needing more than `maxDecimals` places,
 * so it renders in full. Rounding an amount into its own display is how a
 * notional silently becomes a different notional.
 *
 * Smaller suffixes are tried in turn, which matters for irregular tables like
 * lakh/crore, but the mantissa must stay below `MAX_COMPACT_MANTISSA`. Without
 * that bound the fallback "rescues" values it should have left alone -
 * `1500123` would render `1,500.123K`, which is longer *and* uglier than the
 * plain digits it replaced.
 */
function losslessSuffix(
  value: number,
  table: AmountSuffixTable,
  maxDecimals: number,
): { suffix: string; exponent: number } | null {
  const magnitude = Math.abs(value);

  const candidates = Object.entries(table)
    .filter(([, exponent]) => exponent > 0 && magnitude >= scaleByPowerOfTen(1, exponent))
    .sort((a, b) => b[1] - a[1] || preferredSuffix(a[0], b[0]));

  for (const [suffix, exponent] of candidates) {
    const scaled = scaleByPowerOfTen(value, -exponent);
    if (Math.abs(scaled) >= MAX_COMPACT_MANTISSA) continue;
    if (decimalPlaces(scaled) <= maxDecimals) return { suffix, exponent };
  }

  return null;
}

/**
 * A currency's symbol and spacing, split into what precedes the digits and what
 * follows them: `$`/`""` for `en-US` USD, `""`/`" €"` for `de-DE` EUR.
 *
 * `Intl` cannot format a number carrying a custom magnitude suffix, so compact
 * display has to place the symbol itself. Reading the affixes off a formatted
 * zero keeps the placement locale-correct instead of assuming a leading symbol.
 */
function currencyAffixes(currency: string, locale?: string): { prefix: string; suffix: string } {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(0);

  const first = parts.findIndex((part) => part.type === "integer");
  const last = parts.map((part) => part.type).lastIndexOf("integer");
  const join = (list: Intl.NumberFormatPart[]): string => list.map((part) => part.value).join("");

  return { prefix: join(parts.slice(0, first)), suffix: join(parts.slice(last + 1)) };
}

/**
 * Render a canonical amount for display.
 *
 * `"compact"` deliberately uses this module's own suffix table rather than
 * `Intl`'s compact notation. Were it to use `Intl`, an `en-IN` runtime would
 * render `10000000` as `1Cr` - which {@link parseAmount} then rejects under the
 * default table. So the *digits* rendered here always stay readable by the
 * parser that produced them. A currency symbol is the exception: `$1.23M` is
 * for reading, and no format mode's output is meant to be re-parsed anyway.
 *
 * `"compact"` abbreviates **only when doing so costs nothing**: it needs a
 * magnitude of at least `compactFrom` (default 1e6) *and* a suffix that divides
 * the value within `compactMaxDecimals` places. So `1500000` becomes `1.5M`,
 * `1234000` becomes `1.234M`, and `1500123` stays `1,500,123` rather than
 * pretending to be `1.5M`. Anything it cannot abbreviate cleanly falls through
 * to full notation.
 *
 * Passing `decimals` explicitly opts out of that guarantee and asks for a
 * rounded summary instead - appropriate for a dashboard tile, not for a field
 * someone trades from.
 *
 * Regardless: an editable field must keep the canonical number and re-render
 * from it, never recover its value by re-parsing its own display.
 */
export function formatAmount(
  value: number | null | undefined,
  options: AmountFormatOptions = {},
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";

  const { format = "full", currency, locale, decimals } = options;
  const table = resolveTable(options);

  const places =
    decimals ?? (currency ? (currencyDecimals(currency, locale) ?? undefined) : undefined);
  const usableCurrency =
    currency && currencyDecimals(currency, locale) !== null ? currency : undefined;

  if (format === "plain") {
    const rounded = places === undefined ? value : roundToDecimals(value, places);
    const normalised = withoutNegativeZero(rounded);
    return places === undefined ? String(normalised) : normalised.toFixed(places);
  }

  if (format === "compact") {
    const { compactFrom = 1e6, compactMaxDecimals = 3 } = options;

    // An explicit `decimals` is the caller opting into a rounded summary; with
    // it absent, compacting must not cost a digit.
    const best =
      Math.abs(value) < compactFrom
        ? null
        : decimals === undefined
          ? losslessSuffix(value, table, compactMaxDecimals)
          : bestSuffix(value, table);

    if (best) {
      const scaled = scaleByPowerOfTen(value, -best.exponent);
      const mantissaPlaces = decimals ?? compactMaxDecimals;
      const rounded = withoutNegativeZero(roundToDecimals(scaled, mantissaPlaces));
      // The sign sits outside the symbol (`-$2.5B`), which is where every
      // locale Intl knows puts it for a negative currency amount.
      const text = new Intl.NumberFormat(locale, {
        maximumFractionDigits: mantissaPlaces,
      }).format(Math.abs(rounded));

      const { prefix, suffix } = usableCurrency
        ? currencyAffixes(usableCurrency, locale)
        : { prefix: "", suffix: "" };
      const sign = rounded < 0 ? "-" : "";

      return `${sign}${prefix}${text}${best.suffix}${suffix}`;
    }
    // Too small to abbreviate, or no suffix divides it cleanly - show it whole.
  }

  return new Intl.NumberFormat(locale, {
    style: usableCurrency ? "currency" : "decimal",
    currency: usableCurrency,
    currencySign: format === "accounting" ? "accounting" : "standard",
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(withoutNegativeZero(roundToDecimals(value, places ?? 3)));
}
