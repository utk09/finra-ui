import { describe, expect, it } from "vitest";

import {
  compactSuffixesForLocale,
  currencyDecimals,
  DEFAULT_AMOUNT_SUFFIXES,
  DEFAULT_GROUP_SEPARATORS,
  formatAmount,
  parseAmount,
} from "./amount";

/** Lakh/crore, the canonical consumer-supplied table. */
const INDIAN_SUFFIXES = { L: 5, Cr: 7, KCr: 10, LCr: 12 };

const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "JPY"];

describe("parseAmount - magnitudes", () => {
  it.each([
    ["1k", 1_000],
    ["1K", 1_000],
    ["10m", 10_000_000],
    ["4.1m", 4_100_000],
    ["2b", 2_000_000_000],
    ["2bn", 2_000_000_000],
    ["1t", 1_000_000_000_000],
    ["0.5m", 500_000],
    ["10", 10],
  ])("expands %s to %d", (input, expected) => {
    expect(parseAmount(input).value).toBe(expected);
  });

  it("reports the suffix as the table spells it, not as the user typed it", () => {
    expect(parseAmount("4.1m")).toMatchObject({ valid: true, suffix: "M", exponent: 6 });
    expect(parseAmount("2bn")).toMatchObject({ suffix: "BN", exponent: 9 });
  });

  it("reports no suffix and a zero exponent for a bare number", () => {
    expect(parseAmount("1234")).toMatchObject({ suffix: null, exponent: 0 });
  });

  it("ships the four magnitudes plus the BN alias", () => {
    expect(Object.keys(DEFAULT_AMOUNT_SUFFIXES).sort()).toEqual(["B", "BN", "K", "M", "T"]);
    expect(DEFAULT_AMOUNT_SUFFIXES.BN).toBe(DEFAULT_AMOUNT_SUFFIXES.B);
  });

  it("keeps the currency symbol on an abbreviated value", () => {
    const compact = { format: "compact" as const, locale: "en-US" };
    expect(formatAmount(1_230_000, { ...compact, currency: "USD" })).toBe("$1.23M");
    // The sign sits outside the symbol, as Intl places it for currencies.
    expect(formatAmount(-2.5e9, { ...compact, currency: "USD" })).toBe("-$2.5B");
    // A trailing-symbol locale must not get a leading one. Asserted loosely
    // because Intl separates the two with a non-breaking space.
    const german = formatAmount(1.5e6, { format: "compact", locale: "de-DE", currency: "EUR" });
    expect(german.startsWith("1,5M")).toBe(true);
    expect(german).toContain("€");
  });

  it("reads BN but never writes it - B is the canonical spelling of 10^9", () => {
    expect(parseAmount("2bn").value).toBe(2_000_000_000);
    expect(formatAmount(2e9, { format: "compact", locale: "en-US" })).toBe("2B");
  });

  it("prefers the shortest spelling of a magnitude regardless of table key order", () => {
    // Insertion order puts the long alias first; it must still lose.
    const aliasFirst = { MILLION: 6, M: 6 };
    expect(formatAmount(3e6, { format: "compact", locale: "en-US", suffixes: aliasFirst })).toBe(
      "3M",
    );
  });
});

describe("parseAmount - e notation", () => {
  it.each([
    ["1e5", 100_000],
    ["1E5", 100_000],
    ["1.5e3", 1_500],
    ["2e+6", 2_000_000],
    ["1e-3", 0.001],
    ["-3e6", -3_000_000],
    ["1,234e3", 1_234_000],
  ])("expands %s to %d", (input, expected) => {
    expect(parseAmount(input).value).toBe(expected);
  });

  it("expands e notation exactly", () => {
    // Number("4.1e6") is exact, but 4.1 * 10 ** 6 is not - the engine must not
    // reach for the latter.
    expect(parseAmount("4.1e6").value).toBe(4_100_000);
    expect(parseAmount("0.07e2").value).toBe(7);
  });

  it("adds the exponent to a suffix rather than choosing between them", () => {
    expect(parseAmount("1e5m")).toMatchObject({ value: 1e11, suffix: "M", exponent: 11 });
  });

  it("reports the total power of ten as the exponent", () => {
    expect(parseAmount("1e5")).toMatchObject({ suffix: null, exponent: 5 });
  });

  it("rejects a value too large for float64 rather than yielding Infinity", () => {
    expect(parseAmount("1e999")).toMatchObject({
      valid: false,
      value: null,
      error: "out-of-range",
    });
  });

  it("treats a trailing e with no digits as a suffix, so a table may define E", () => {
    expect(parseAmount("1e").error).toBe("unknown-suffix");
    expect(parseAmount("5E", { suffixes: { E: 18 } }).value).toBe(5e18);
    // Digits after the `e` still make it an exponent, even with `E` in the table.
    expect(parseAmount("5e3", { suffixes: { E: 18 } }).value).toBe(5_000);
  });

  it("still rejects a malformed exponent", () => {
    expect(parseAmount("1e5.5").error).toBe("invalid-number");
    expect(parseAmount("e5").error).toBe("invalid-number");
  });
});

describe("parseAmount - expansion is exact", () => {
  // The whole reason scaleByPowerOfTen exists: 4.1 * 10 ** 6 is 4099999.9999999995.
  it.each([
    ["4.1m", 4_100_000],
    ["0.07m", 70_000],
    ["1.1k", 1_100],
    ["8.2b", 8_200_000_000],
    ["0.001m", 1_000],
  ])("expands %s without floating-point drift", (input, expected) => {
    const { value } = parseAmount(input);
    expect(value).toBe(expected);
    expect(Number.isInteger(value)).toBe(true);
  });
});

describe("parseAmount - signs", () => {
  it("accepts a leading minus", () => {
    expect(parseAmount("-3m").value).toBe(-3_000_000);
  });

  it("accepts a leading plus", () => {
    expect(parseAmount("+7k").value).toBe(7_000);
  });

  it("reads accounting parentheses as negative", () => {
    expect(parseAmount("(1,234)").value).toBe(-1234);
    expect(parseAmount("(2m)").value).toBe(-2_000_000);
  });

  it("cancels a minus inside parentheses back to positive", () => {
    expect(parseAmount("(-5k)").value).toBe(5_000);
  });

  it("rejects parentheses when the accounting convention is off", () => {
    expect(parseAmount("(1,234)", { allowAccountingNegative: false }).error).toBe("invalid-number");
  });

  it("rejects negatives when they are not allowed", () => {
    expect(parseAmount("-3m", { allowNegative: false }).error).toBe("negative-not-allowed");
    expect(parseAmount("(3m)", { allowNegative: false }).error).toBe("negative-not-allowed");
  });

  it("normalises negative zero to zero", () => {
    expect(Object.is(parseAmount("-0").value, -0)).toBe(false);
  });
});

describe("parseAmount - grouping and decimal marks", () => {
  it("strips comma grouping", () => {
    expect(parseAmount("1,234,567.5").value).toBe(1_234_567.5);
  });

  it.each(DEFAULT_GROUP_SEPARATORS.filter((s) => s !== ","))(
    "strips %j as a group separator",
    (separator) => {
      expect(parseAmount(`10${separator}000`).value).toBe(10_000);
    },
  );

  it("handles a locale that swaps the two marks", () => {
    const options = { decimalSeparator: ",", groupSeparators: ["."] };
    expect(parseAmount("1.234,5", options).value).toBe(1234.5);
  });

  it("treats . as grouping once , is the decimal mark, without being told", () => {
    // Setting only `decimalSeparator` must not leave `.` behind to be read as a
    // second decimal point.
    expect(parseAmount("1.234,5", { decimalSeparator: "," }).value).toBe(1234.5);
    expect(parseAmount("1.234.567,5", { decimalSeparator: "," }).value).toBe(1_234_567.5);
  });

  it("never strips the configured decimal mark as grouping", () => {
    // "," is in the defaults, but it is the decimal mark here, so it must survive.
    expect(parseAmount("1,5", { decimalSeparator: "," }).value).toBe(1.5);
  });
});

describe("parseAmount - rejections", () => {
  it.each([
    ["", "empty"],
    ["   ", "empty"],
    ["abc", "invalid-number"],
    ["m", "invalid-number"],
    [".", "invalid-number"],
    ["1.2.3", "invalid-number"],
    ["10MM", "unknown-suffix"],
    ["10 dollars", "unknown-suffix"],
    ["5x", "unknown-suffix"],
  ])("rejects %j as %s", (input, error) => {
    expect(parseAmount(input)).toMatchObject({ valid: false, value: null, error });
  });

  it("never silently drops trailing text", () => {
    // The failure this guards: committing 10M when 10MM was typed.
    expect(parseAmount("10MM").value).toBeNull();
  });

  it("enforces min and max", () => {
    expect(parseAmount("5m", { min: 10_000_000 }).error).toBe("out-of-range");
    expect(parseAmount("50m", { max: 10_000_000 }).error).toBe("out-of-range");
    expect(parseAmount("10m", { min: 1_000_000, max: 100_000_000 }).valid).toBe(true);
  });
});

describe("parseAmount - suffix table configuration", () => {
  it("merges consumer suffixes over the defaults", () => {
    const options = { suffixes: { MM: 6 } };
    expect(parseAmount("10MM", options).value).toBe(10_000_000);
    expect(parseAmount("10K", options).value).toBe(10_000);
  });

  it("replaces the defaults entirely when asked", () => {
    const options = { suffixes: { MM: 6 }, replaceSuffixes: true };
    expect(parseAmount("10MM", options).value).toBe(10_000_000);
    expect(parseAmount("10K", options).error).toBe("unknown-suffix");
  });

  it("matches longest-first so a prefixing key cannot shadow a longer one", () => {
    // Shortest-match would read 1KCr as 1K: 10^3 where 10^10 was meant.
    const options = { suffixes: INDIAN_SUFFIXES };
    expect(parseAmount("1KCr", options).value).toBe(10_000_000_000);
    expect(parseAmount("1Cr", options).value).toBe(10_000_000);
    expect(parseAmount("1K", options).value).toBe(1_000);
    expect(parseAmount("1LCr", options).value).toBe(1_000_000_000_000);
  });

  it("expands lakh and crore when the consumer supplies them", () => {
    expect(parseAmount("1.5L", { suffixes: INDIAN_SUFFIXES }).value).toBe(150_000);
    expect(parseAmount("2.5 cr", { suffixes: INDIAN_SUFFIXES }).value).toBe(25_000_000);
  });

  it("does not recognise lakh or crore by default", () => {
    expect(parseAmount("1.5L").error).toBe("unknown-suffix");
    expect(parseAmount("2Cr").error).toBe("unknown-suffix");
  });
});

describe("parseAmount - case sensitivity", () => {
  it("ignores case by default", () => {
    expect(parseAmount("10m").value).toBe(10_000_000);
    expect(parseAmount("10M").value).toBe(10_000_000);
    expect(parseAmount("2Bn").value).toBe(2_000_000_000);
  });

  it("honours case when asked", () => {
    expect(parseAmount("10M", { caseSensitive: true }).value).toBe(10_000_000);
    expect(parseAmount("10m", { caseSensitive: true }).error).toBe("unknown-suffix");
  });
});

describe("parseAmount - currency extraction", () => {
  const options = { currencyCodes: MAJOR_CURRENCIES };

  it.each([
    ["USD 10m", "USD", 10_000_000],
    ["10m USD", "USD", 10_000_000],
    ["EUR5m", "EUR", 5_000_000],
    ["2bn GBP", "GBP", 2_000_000_000],
  ])("reads %s as %s %d", (input, currency, value) => {
    expect(parseAmount(input, options)).toMatchObject({ valid: true, currency, value });
  });

  it("returns a null currency when none is present", () => {
    expect(parseAmount("10m", options)).toMatchObject({ currency: null, value: 10_000_000 });
  });

  it("does not treat a magnitude suffix as a currency", () => {
    expect(parseAmount("10M", options)).toMatchObject({ currency: null, value: 10_000_000 });
  });

  it("ignores unknown codes rather than guessing", () => {
    expect(parseAmount("ZZZ 10m", options).error).toBe("invalid-number");
  });

  it("upper-cases a lower-cased code", () => {
    expect(parseAmount("usd 10m", options).currency).toBe("USD");
  });

  it("rejects a currency with no amount", () => {
    expect(parseAmount("USD", options).error).toBe("invalid-number");
  });

  it("leaves letters alone when no registry is supplied", () => {
    expect(parseAmount("USD 10m").error).toBe("invalid-number");
  });
});

describe("formatAmount", () => {
  it("returns an empty string for absent or non-finite values", () => {
    expect(formatAmount(null)).toBe("");
    expect(formatAmount(undefined)).toBe("");
    expect(formatAmount(NaN)).toBe("");
    expect(formatAmount(Infinity)).toBe("");
  });

  it("groups digits in full mode", () => {
    expect(formatAmount(10_000_000, { locale: "en-US" })).toBe("10,000,000");
  });

  it("renders compact suffixes", () => {
    const base = { format: "compact", locale: "en-US" } as const;
    expect(formatAmount(10_000_000, base)).toBe("10M");
    expect(formatAmount(4_100_000, base)).toBe("4.1M");
    expect(formatAmount(-2_500_000_000, base)).toBe("-2.5B");
    expect(formatAmount(1_000_000_000_000, base)).toBe("1T");
  });

  it("does not abbreviate below the compactFrom floor", () => {
    const base = { format: "compact", locale: "en-US" } as const;
    // A suffix buys nothing here: "1.23K" and "1,234" are both five characters.
    expect(formatAmount(1234, base)).toBe("1,234");
    expect(formatAmount(999_999, base)).toBe("999,999");
    expect(formatAmount(1_000_000, base)).toBe("1M");
  });

  it("honours a lowered compactFrom", () => {
    const formatted = formatAmount(1234, {
      format: "compact",
      locale: "en-US",
      compactFrom: 1000,
    });
    expect(formatted).toBe("1.234K");
  });

  it("abbreviates only when no digit is lost", () => {
    const base = { format: "compact", locale: "en-US" } as const;
    expect(formatAmount(1_500_000, base)).toBe("1.5M");
    expect(formatAmount(1_234_000, base)).toBe("1.234M");
    // The value that must never become "1.5M".
    expect(formatAmount(1_500_123, base)).toBe("1,500,123");
    expect(formatAmount(10_000_001, base)).toBe("10,000,001");
  });

  it("never falls back to a suffix that leaves a mantissa of 1000 or more", () => {
    // Without the bound, 1500123 renders "1,500.123K" - longer than the digits
    // it replaced, and still not what anyone meant.
    expect(formatAmount(1_500_123, { format: "compact", locale: "en-US" })).not.toContain("K");
  });

  it("widens what can compact when compactMaxDecimals allows it", () => {
    const base = { format: "compact", locale: "en-US" } as const;
    expect(formatAmount(1_234_500, base)).toBe("1,234,500");
    expect(formatAmount(1_234_500, { ...base, compactMaxDecimals: 4 })).toBe("1.2345M");
  });

  it("treats an explicit decimals as opting into a rounded summary", () => {
    const base = { format: "compact", locale: "en-US" } as const;
    expect(formatAmount(1_500_123, { ...base, decimals: 1 })).toBe("1.5M");
    expect(formatAmount(1_234_567, { ...base, decimals: 1 })).toBe("1.2M");
  });

  it("compacts with a consumer table", () => {
    const formatted = formatAmount(15_000_000, {
      format: "compact",
      locale: "en-US",
      suffixes: INDIAN_SUFFIXES,
    });
    expect(formatted).toBe("1.5Cr");
  });

  it("puts negatives in parentheses in accounting mode", () => {
    const formatted = formatAmount(-1234.5, {
      format: "accounting",
      currency: "USD",
      locale: "en-US",
    });
    expect(formatted).toBe("($1,234.50)");
  });

  it("emits ungrouped digits in plain mode", () => {
    expect(formatAmount(10_000_000, { format: "plain" })).toBe("10000000");
    expect(formatAmount(1.5, { format: "plain", currency: "USD" })).toBe("1.50");
  });

  it("takes decimal places from the currency", () => {
    expect(formatAmount(1500, { currency: "JPY", locale: "en-US" })).toBe("¥1,500");
    expect(formatAmount(1234.5, { currency: "USD", locale: "en-US" })).toBe("$1,234.50");
  });

  it("lets an explicit decimals override the currency default", () => {
    expect(formatAmount(1234.5, { currency: "JPY", locale: "en-US", decimals: 2 })).toBe(
      "¥1,234.50",
    );
  });

  it("falls back to plain decimals rather than throwing on an unusable currency", () => {
    expect(formatAmount(1234.5, { currency: "XXXX", locale: "en-US" })).toBe("1,234.5");
  });

  it.each([
    [-0, "full"],
    [-1e-9, "full"],
    [-0, "compact"],
    [-1e-9, "compact"],
    [-0.001, "plain"],
  ] as const)("never renders %d as negative zero in %s mode", (value, format) => {
    const formatted = formatAmount(value, { format, locale: "en-US", decimals: 2 });
    expect(formatted.startsWith("-")).toBe(false);
  });
});

describe("round trip", () => {
  it.each([10_000_000, 4_100_000, 2_500_000_000, 999, 1_000_000_000_000, -3_000_000])(
    "reads back %d from its own compact rendering",
    (value) => {
      const compact = formatAmount(value, { format: "compact", locale: "en-US" });
      expect(parseAmount(compact).value).toBe(value);
    },
  );

  it("survives values that cannot be abbreviated", () => {
    const compact = formatAmount(1_500_123, { format: "compact", locale: "en-US" });
    expect(parseAmount(compact.replace(/,/g, "")).value).toBe(1_500_123);
  });

  it("round-trips a wide sweep of magnitudes exactly", () => {
    for (let value = 1; value < 5e12; value = Math.round(value * 1.7) + 7) {
      const compact = formatAmount(value, { format: "compact", locale: "en-US" });
      expect(parseAmount(compact.replace(/,/g, "")).value).toBe(value);
    }
  });

  it("is lossy only when a rounded summary was explicitly requested", () => {
    const rounded = formatAmount(1_500_123, { format: "compact", locale: "en-US", decimals: 1 });
    expect(rounded).toBe("1.5M");
    expect(parseAmount(rounded).value).toBe(1_500_000);
  });
});

describe("currencyDecimals", () => {
  it.each([
    ["USD", 2],
    ["EUR", 2],
    ["JPY", 0],
    ["KWD", 3],
  ])("reports %s as %d places", (currency, expected) => {
    expect(currencyDecimals(currency)).toBe(expected);
  });

  it("returns null for a code Intl does not accept", () => {
    expect(currencyDecimals("XXXX")).toBeNull();
    expect(currencyDecimals("")).toBeNull();
  });
});

describe("compactSuffixesForLocale", () => {
  it("returns the Anglo table for en-US", () => {
    expect(compactSuffixesForLocale("en-US")).toEqual({ K: 3, M: 6, B: 9, T: 12 });
  });

  it("returns lakh and crore for en-IN", () => {
    expect(compactSuffixesForLocale("en-IN")).toMatchObject({ L: 5, Cr: 7 });
  });

  it("produces a table parseAmount can consume", () => {
    const suffixes = compactSuffixesForLocale("en-IN");
    expect(parseAmount("1Cr", { suffixes }).value).toBe(10_000_000);
  });

  it("may be sparse where a locale has no compact form for a magnitude", () => {
    // de-DE has no short compact thousand, so the table simply omits it.
    expect(compactSuffixesForLocale("de-DE")).not.toHaveProperty("K");
  });
});

describe("parseAmount - degenerate configuration", () => {
  it("treats an empty currencyCodes list as no currency extraction", () => {
    const result = parseAmount("100", { currencyCodes: [] });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(100);
    expect(result.currency).toBeNull();
  });

  it("leaves a leading word alone when no codes are configured", () => {
    // With an empty table nothing is a currency, so `USD 100` is not silently
    // stripped down to 100 - it stays an invalid number.
    expect(parseAmount("USD 100", { currencyCodes: [] }).valid).toBe(false);
  });

  it("never strips the decimal mark as a group separator", () => {
    // A caller passing overlapping lists must not lose the decimal point.
    const result = parseAmount("1.234,5", {
      decimalSeparator: ",",
      groupSeparators: [".", ","],
    });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(1234.5);
  });
});

describe("formatAmount - compact suffix selection", () => {
  it("tie-breaks equal magnitudes to the shorter spelling", () => {
    // B and BN both stand for 10^9; B must win regardless of key order.
    expect(formatAmount(2.5e9, { format: "compact", decimals: 1 })).toBe("2.5B");
    expect(formatAmount(2.5e9, { format: "compact", decimals: 1, suffixes: { BN: 9 } })).toBe(
      "2.5B",
    );
  });

  it("ignores suffix entries at or below 10^0", () => {
    // A zero-exponent entry would otherwise match every value and win by
    // insertion order for small numbers.
    expect(formatAmount(2.5e9, { format: "compact", decimals: 1, suffixes: { U: 0, D: -3 } })).toBe(
      "2.5B",
    );
  });

  it("picks the largest suffix that leaves the mantissa at or above 1", () => {
    expect(formatAmount(2.5e6, { format: "compact", decimals: 1 })).toBe("2.5M");
    expect(formatAmount(2.5e12, { format: "compact", decimals: 1 })).toBe("2.5T");
  });
});

describe("parseAmount - numeric overflow", () => {
  it("rejects a mantissa too large to represent", () => {
    // The digit pattern happily matches 400 nines; Number() turns that into
    // Infinity, which must be refused rather than propagated as a value.
    const result = parseAmount("9".repeat(400));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid-number");
    expect(result.value).toBeNull();
  });

  it("rejects an overflowing decimal too", () => {
    expect(parseAmount(`${"9".repeat(400)}.5`).valid).toBe(false);
  });
});
