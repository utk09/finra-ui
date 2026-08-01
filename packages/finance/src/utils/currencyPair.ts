/**
 * Currency-pair parsing and formatting - pure, zero framework imports.
 * Used by React CurrencyPairPickerBase and a future Lit equivalent.
 *
 * The governing rule: **how a pair is typed never affects how it is
 * stored**. Every accepted spelling of GBP/USD collapses to the same canonical
 * `{ baseCurrency: "GBP", quoteCurrency: "USD" }`, and display formatting is a
 * separate, render-time concern.
 */

/** A parsed pair, independent of how it was typed or how it will be shown. */
/**
 * A parsed pair's two legs, without any instrument identity.
 *
 * @remarks
 * Deliberately not a `CurrencyPair`: this is what typing `GBP/JPY` yields when
 * the registry has never seen it. It is reported through `onCommitUnknown`
 * rather than `onChange`, so a consumer is never handed a metadata-less pair
 * they would have to defend against.
 */
export interface CurrencyPairValue {
  /** ISO code of the base (left) leg. */
  baseCurrency: string;
  /** ISO code of the quote (right) leg. */
  quoteCurrency: string;
}

/** Separators accepted with no configuration. */
export const DEFAULT_PAIR_SEPARATORS = ["/", "\\", ",", " "] as const;

/**
 * Separators a consumer can opt into. Not on by default because `-` and `_`
 * appear inside some venue-specific symbols, so accepting them silently would
 * make otherwise-invalid input parse.
 */
export const OPTIONAL_PAIR_SEPARATORS = ["-", "_", ":"] as const;

/**
 * Why pair text could not be interpreted.
 *
 * @remarks
 * Worth surfacing distinctly: `"ambiguous"` in particular means the input was
 * *well-formed* and matched more than one valid split, so the right response is
 * to show the candidates rather than report an error.
 */
export type CurrencyPairParseError =
  /** Blank input. */
  | "empty"
  /** Contains a character that is neither code-legal nor a configured separator. */
  | "unknown-separator"
  /** More than one separator kind, or not exactly two sides. */
  | "invalid-format"
  /** No separator, no code registry, and not the 6-character ISO shape. */
  | "invalid-length"
  /** A side is not a plausible currency code, or is absent from the registry. */
  | "unknown-code"
  /** Several registry splits are valid; refusing to guess between them. */
  | "ambiguous"
  /** Base and quote are the same currency. */
  | "same-currency";

/** The result of parsing pair text. */
export interface CurrencyPairParseResult {
  /** Whether the input parsed. */
  valid: boolean;
  /** The base (left) leg, or `null` when invalid. */
  baseCurrency: string | null;
  /** The quote (right) leg, or `null` when invalid. */
  quoteCurrency: string | null;
  /** Canonical identity, e.g. `"GBPUSD"`. Null when invalid. */
  id: string | null;
  /** Why it failed. Absent when `valid` is true. */
  error?: CurrencyPairParseError;
}

/**
 * Options for {@link parseCurrencyPair}.
 *
 * @remarks
 * Note `strictCodes`: with a registry supplied, an unseparated six-character
 * input can often be split more than one way, and the parser refuses to guess -
 * it returns `"ambiguous"` rather than picking one.
 */
export interface CurrencyPairParseOptions {
  /**
   * Accepted separators. Extend rather than replace to keep the defaults:
   * `[...DEFAULT_PAIR_SEPARATORS, ...OPTIONAL_PAIR_SEPARATORS]`.
   */
  separators?: readonly string[];
  /**
   * Known currency codes, used to split unseparated input.
   *
   * Without this, `"GBPUSD"` can only be split by assuming ISO-4217 alpha-3 -
   * which is wrong the moment crypto is involved (`USDT` is 4, `MATIC` and
   * `1INCH` are 5, so `"BTCUSDT"` has no 3/3 split). The component derives this
   * from the pairs it already holds via {@link collectCurrencyCodes}; pass it
   * explicitly only when the local set is incomplete (e.g. async providers).
   */
  codes?: Iterable<string>;
  /** Permit `GBP/GBP`. Default false. */
  allowSameCurrency?: boolean;
  /**
   * Whether `codes` also *validates* separated input, not just splits
   * unseparated input. Default true.
   *
   * The registry has two jobs, and they are not equally forced. Splitting
   * `"BTCUSDT"` genuinely needs it. Validating `"GBP/JPY"` does not - the
   * separator already did the splitting - so requiring membership there is a
   * data-availability question wearing a parser's clothes.
   *
   * That distinction matters against an async provider, where the local
   * registry is only whatever the last search happened to return. Callers that
   * can resolve membership themselves (and report an unknown-but-well-formed
   * pair rather than rejecting it) pass `false`.
   */
  strictCodes?: boolean;
}

/** Options for {@link formatCurrencyPair}. */
export interface CurrencyPairFormatOptions {
  /** Separator to render between the codes. `""` yields `"GBPUSD"`. Default `"/"`. */
  separator?: string;
}

/**
 * Shape a currency code must have to be plausible: 2-10 alphanumerics with at
 * least one letter. Deliberately looser than ISO-4217 alpha-3 - `USDT`, `MATIC`
 * and `1INCH` are all real codes. A registry is what tightens this.
 */
const CODE_PATTERN = /^(?=.*[A-Z])[A-Z0-9]{2,10}$/;

/** Shortest plausible code, and therefore the smallest split offset. */
const MIN_CODE_LENGTH = 2;

/** Length of an unseparated pair of ISO-4217 alpha-3 codes. */
const ISO_PAIR_LENGTH = 6;

function fail(error: CurrencyPairParseError): CurrencyPairParseResult {
  return { valid: false, baseCurrency: null, quoteCurrency: null, id: null, error };
}

function succeed(baseCurrency: string, quoteCurrency: string): CurrencyPairParseResult {
  return { valid: true, baseCurrency, quoteCurrency, id: `${baseCurrency}${quoteCurrency}` };
}

/** Whether `code` could be a currency code at all (shape only, no registry). */
export function isCurrencyCode(code: string): boolean {
  return CODE_PATTERN.test(code.trim().toUpperCase());
}

/**
 * Canonical identity for a pair: the two codes concatenated, uppercase, with no
 * separator. Never derived from the user's input formatting.
 */
export function pairId(pair: CurrencyPairValue): string {
  return `${pair.baseCurrency.toUpperCase()}${pair.quoteCurrency.toUpperCase()}`;
}

/** Display text for a pair. Purely presentational - see {@link pairId} for identity. */
export function formatCurrencyPair(
  pair: CurrencyPairValue,
  options: CurrencyPairFormatOptions = {},
): string {
  const { separator = "/" } = options;
  return `${pair.baseCurrency.toUpperCase()}${separator}${pair.quoteCurrency.toUpperCase()}`;
}

/**
 * Build a currency-code registry from pairs already in hand. This is how the
 * picker feeds `codes` to {@link parseCurrencyPair} without asking consumers to
 * maintain a second list.
 */
export function collectCurrencyCodes(
  pairs: Iterable<Pick<CurrencyPairValue, "baseCurrency" | "quoteCurrency">>,
): Set<string> {
  const codes = new Set<string>();
  for (const pair of pairs) {
    if (pair.baseCurrency) codes.add(pair.baseCurrency.toUpperCase());
    if (pair.quoteCurrency) codes.add(pair.quoteCurrency.toUpperCase());
  }
  return codes;
}

function toCodeSet(codes: Iterable<string>): Set<string> {
  const set = new Set<string>();
  for (const code of codes) {
    const normalized = code.trim().toUpperCase();
    if (normalized) set.add(normalized);
  }
  return set;
}

/**
 * Every way the registry can split `input` into two known codes. More than one
 * result means the input is genuinely ambiguous and the caller must not guess.
 */
function registrySplits(input: string, codes: Set<string>): CurrencyPairValue[] {
  const splits: CurrencyPairValue[] = [];
  for (let i = MIN_CODE_LENGTH; i <= input.length - MIN_CODE_LENGTH; i++) {
    const base = input.slice(0, i);
    const quote = input.slice(i);
    if (codes.has(base) && codes.has(quote)) {
      splits.push({ baseCurrency: base, quoteCurrency: quote });
    }
  }
  return splits;
}

/**
 * Parse any accepted spelling of a currency pair into its canonical form.
 *
 * All of these produce the same result:
 * `GBPUSD` · `GBP/USD` · `GBP\USD` · `GBP,USD` · `GBP USD`
 * (and `GBP-USD` / `GBP_USD` / `GBP:USD` once those separators are configured).
 *
 * Unseparated input is split by the `codes` registry when one is supplied, and
 * otherwise falls back to an even 3/3 split for the 6-character ISO shape. The
 * fallback also applies when a registry is present but yields no match, since a
 * provider-backed registry can legitimately be incomplete. Ambiguity is always
 * an error - never a guess.
 */
export function parseCurrencyPair(
  input: string,
  options: CurrencyPairParseOptions = {},
): CurrencyPairParseResult {
  const {
    separators = DEFAULT_PAIR_SEPARATORS,
    codes,
    allowSameCurrency = false,
    strictCodes = true,
  } = options;

  // Collapse runs of whitespace so "GBP   USD" behaves like "GBP USD".
  const normalized = input.trim().toUpperCase().replace(/\s+/g, " ");
  if (!normalized) return fail("empty");

  const separatorSet = new Set(separators);
  const codeSet = codes ? toCodeSet(codes) : null;

  // Reject unconfigured punctuation up front, so "GBP-USD" reports the actual
  // problem instead of failing later as a bad length.
  for (const char of normalized) {
    if (/[A-Z0-9]/.test(char)) continue;
    if (separatorSet.has(char)) continue;
    return fail("unknown-separator");
  }

  const present = [...separatorSet].filter((sep) => sep !== "" && normalized.includes(sep));

  let candidate: CurrencyPairValue;

  if (present.length > 1) {
    // e.g. "GBP/USD,EUR" - no single sensible reading.
    return fail("invalid-format");
  }

  if (present.length === 1) {
    const parts = normalized.split(present[0]).filter((part) => part !== "");
    if (parts.length !== 2) return fail("invalid-format");
    const [base, quote] = parts;
    if (!CODE_PATTERN.test(base) || !CODE_PATTERN.test(quote)) return fail("unknown-code");
    // The separator already split this; membership is only enforced on request.
    if (strictCodes && codeSet && (!codeSet.has(base) || !codeSet.has(quote))) {
      return fail("unknown-code");
    }
    candidate = { baseCurrency: base, quoteCurrency: quote };
  } else {
    const splits = codeSet ? registrySplits(normalized, codeSet) : [];

    if (splits.length > 1) return fail("ambiguous");

    if (splits.length === 1) {
      candidate = splits[0];
    } else if (normalized.length === ISO_PAIR_LENGTH) {
      candidate = {
        baseCurrency: normalized.slice(0, 3),
        quoteCurrency: normalized.slice(3),
      };
    } else {
      return fail(codeSet ? "unknown-code" : "invalid-length");
    }
  }

  if (!allowSameCurrency && candidate.baseCurrency === candidate.quoteCurrency) {
    return fail("same-currency");
  }

  return succeed(candidate.baseCurrency, candidate.quoteCurrency);
}

/**
 * Localised currency name for a code, e.g. `"GBP"` -> `"British Pound"`.
 *
 * `Intl.DisplayNames` only knows ISO-4217, and it is hostile about it: unknown
 * alpha-3 codes silently return the code itself (`"BTC"` -> `"BTC"`), while
 * non-alpha-3 codes **throw** (`"USDT"`, `"MATIC"`). Callers get `null` for both
 * so a crypto list neither crashes nor renders a fake "name".
 */
export function currencyDisplayName(code: string, locale?: string): string | null {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  let name: string | undefined;
  try {
    name = getCurrencyDisplayNames(locale).of(normalized);
  } catch {
    // Non-ISO shape (e.g. "USDT"): Intl rejects it outright.
    return null;
  }

  // Intl echoes the input back when it has no name for a well-formed code.
  return name && name !== normalized ? name : null;
}

const displayNamesCache = new Map<string, Intl.DisplayNames>();

/** `Intl.DisplayNames` construction is expensive and this is read per render. */
function getCurrencyDisplayNames(locale?: string): Intl.DisplayNames {
  const key = locale ?? "";
  const cached = displayNamesCache.get(key);
  if (cached) return cached;

  const formatter = new Intl.DisplayNames(locale, { type: "currency" });
  displayNamesCache.set(key, formatter);
  return formatter;
}
