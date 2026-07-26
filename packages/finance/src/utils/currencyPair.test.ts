import { describe, expect, it } from "vitest";

import {
  collectCurrencyCodes,
  currencyDisplayName,
  DEFAULT_PAIR_SEPARATORS,
  formatCurrencyPair,
  isCurrencyCode,
  OPTIONAL_PAIR_SEPARATORS,
  pairId,
  parseCurrencyPair,
} from "./currencyPair";

/** A crypto-flavoured registry: codes here are not ISO-4217 alpha-3. */
const CRYPTO_CODES = ["BTC", "ETH", "USD", "USDT", "MATIC", "1INCH"];

describe("parseCurrencyPair — accepted spellings", () => {
  it.each([
    ["GBPUSD", "no separator"],
    ["GBP/USD", "slash"],
    ["GBP\\USD", "backslash"],
    ["GBP,USD", "comma"],
    ["GBP USD", "space"],
  ])("parses %s (%s) to the same canonical pair", (input) => {
    expect(parseCurrencyPair(input)).toEqual({
      valid: true,
      baseCurrency: "GBP",
      quoteCurrency: "USD",
      id: "GBPUSD",
    });
  });

  it("is case-insensitive and trims surrounding whitespace", () => {
    expect(parseCurrencyPair("  gbp/usd  ")).toMatchObject({ valid: true, id: "GBPUSD" });
  });

  it("collapses runs of whitespace", () => {
    expect(parseCurrencyPair("GBP   USD")).toMatchObject({ valid: true, id: "GBPUSD" });
  });

  it("rejects the opt-in separators until they are configured", () => {
    for (const sep of OPTIONAL_PAIR_SEPARATORS) {
      expect(parseCurrencyPair(`GBP${sep}USD`)).toMatchObject({ error: "unknown-separator" });
    }
  });

  it("accepts the opt-in separators once configured", () => {
    const separators = [...DEFAULT_PAIR_SEPARATORS, ...OPTIONAL_PAIR_SEPARATORS];
    for (const sep of OPTIONAL_PAIR_SEPARATORS) {
      expect(parseCurrencyPair(`GBP${sep}USD`, { separators })).toMatchObject({
        valid: true,
        id: "GBPUSD",
      });
    }
  });

  it("separators are extensible, not a fixed union", () => {
    expect(parseCurrencyPair("GBP|USD", { separators: ["|"] })).toMatchObject({
      valid: true,
      id: "GBPUSD",
    });
  });
});

describe("parseCurrencyPair — rejections", () => {
  it("rejects blank input", () => {
    expect(parseCurrencyPair("   ")).toMatchObject({ error: "empty" });
  });

  it("rejects an unseparated run that is not the ISO 6-character shape", () => {
    expect(parseCurrencyPair("GBPUS")).toMatchObject({ error: "invalid-length" });
    expect(parseCurrencyPair("GBPUSDX")).toMatchObject({ error: "invalid-length" });
  });

  it("rejects more than one separator kind", () => {
    expect(parseCurrencyPair("GBP/USD,EUR")).toMatchObject({ error: "invalid-format" });
  });

  it("rejects a separator that does not yield exactly two sides", () => {
    expect(parseCurrencyPair("GBP/USD/EUR")).toMatchObject({ error: "invalid-format" });
    expect(parseCurrencyPair("/USD")).toMatchObject({ error: "invalid-format" });
  });

  it("rejects sides that cannot be currency codes", () => {
    expect(parseCurrencyPair("G/USD")).toMatchObject({ error: "unknown-code" });
    expect(parseCurrencyPair("123/456")).toMatchObject({ error: "unknown-code" });
  });

  it("rejects a pair of the same currency by default", () => {
    expect(parseCurrencyPair("GBP/GBP")).toMatchObject({ error: "same-currency" });
    expect(parseCurrencyPair("GBPGBP")).toMatchObject({ error: "same-currency" });
  });

  it("allows a same-currency pair when opted in", () => {
    expect(parseCurrencyPair("GBP/GBP", { allowSameCurrency: true })).toMatchObject({
      valid: true,
      id: "GBPGBP",
    });
  });

  it("never returns a partial pair on failure", () => {
    expect(parseCurrencyPair("nope")).toEqual({
      valid: false,
      baseCurrency: null,
      quoteCurrency: null,
      id: null,
      error: "invalid-length",
    });
  });
});

describe("parseCurrencyPair — registry-driven splitting (crypto)", () => {
  it("splits an unseparated pair whose codes are not alpha-3", () => {
    // "BTCUSDT" is 7 characters: no 3/3 split exists.
    expect(parseCurrencyPair("BTCUSDT", { codes: CRYPTO_CODES })).toMatchObject({
      valid: true,
      baseCurrency: "BTC",
      quoteCurrency: "USDT",
      id: "BTCUSDT",
    });
  });

  it("splits codes containing digits and of unequal length", () => {
    expect(parseCurrencyPair("1INCHUSDT", { codes: CRYPTO_CODES })).toMatchObject({
      valid: true,
      baseCurrency: "1INCH",
      quoteCurrency: "USDT",
    });
    expect(parseCurrencyPair("MATICETH", { codes: CRYPTO_CODES })).toMatchObject({
      valid: true,
      baseCurrency: "MATIC",
      quoteCurrency: "ETH",
    });
  });

  it("refuses to guess when several splits are valid", () => {
    // "USD" + "TRY" and "USDT" + "RY" are both registry-valid here.
    expect(parseCurrencyPair("USDTRY", { codes: ["USD", "USDT", "TRY", "RY"] })).toMatchObject({
      error: "ambiguous",
    });
  });

  it("falls back to the ISO 3/3 split when the registry has no match", () => {
    // Registries are often incomplete (async providers), so a known-good ISO
    // shape must still parse rather than hard-failing.
    expect(parseCurrencyPair("GBPUSD", { codes: ["BTC", "ETH"] })).toMatchObject({
      valid: true,
      baseCurrency: "GBP",
      quoteCurrency: "USD",
    });
  });

  it("reports unknown-code when the registry misses and the length is not ISO", () => {
    expect(parseCurrencyPair("BTCUSDT", { codes: ["GBP", "USD"] })).toMatchObject({
      error: "unknown-code",
    });
  });

  it("validates separated input against the registry when one is supplied", () => {
    expect(parseCurrencyPair("BTC/ZZZ", { codes: CRYPTO_CODES })).toMatchObject({
      error: "unknown-code",
    });
    expect(parseCurrencyPair("BTC/USDT", { codes: CRYPTO_CODES })).toMatchObject({
      valid: true,
      id: "BTCUSDT",
    });
  });
});

describe("parseCurrencyPair - strictCodes", () => {
  it("accepts separated input outside the registry when strictness is waived", () => {
    // The separator already did the splitting, so membership is a separate
    // question - and against an async provider the local registry is only
    // whatever the last search returned.
    expect(parseCurrencyPair("GBP/JPY", { codes: ["GBP", "USD"] })).toMatchObject({
      error: "unknown-code",
    });
    expect(
      parseCurrencyPair("GBP/JPY", { codes: ["GBP", "USD"], strictCodes: false }),
    ).toMatchObject({ valid: true, id: "GBPJPY" });
  });

  it("still rejects input that is not code-shaped", () => {
    expect(parseCurrencyPair("1/2", { codes: ["GBP"], strictCodes: false })).toMatchObject({
      error: "unknown-code",
    });
  });

  it("still needs the registry to split unseparated input", () => {
    // Waiving strictness cannot invent a split; the ISO fallback is all that is
    // left, and BTCUSDT is seven characters.
    expect(
      parseCurrencyPair("BTCUSDT", { codes: ["GBP", "USD"], strictCodes: false }),
    ).toMatchObject({ error: "unknown-code" });
    // Six characters still falls back to the ISO 3/3 assumption.
    expect(
      parseCurrencyPair("GBPJPY", { codes: ["GBP", "USD"], strictCodes: false }),
    ).toMatchObject({ valid: true, id: "GBPJPY" });
  });

  it("still refuses a same-currency pair", () => {
    expect(parseCurrencyPair("JPY/JPY", { codes: ["GBP"], strictCodes: false })).toMatchObject({
      error: "same-currency",
    });
  });
});

describe("canonical identity is independent of formatting", () => {
  it("every accepted spelling yields one id", () => {
    const ids = ["GBPUSD", "GBP/USD", "GBP\\USD", "GBP,USD", "GBP USD", "gbp/usd"].map(
      (input) => parseCurrencyPair(input).id,
    );
    expect(new Set(ids)).toEqual(new Set(["GBPUSD"]));
  });

  it("pairId ignores case and never includes a separator", () => {
    expect(pairId({ baseCurrency: "gbp", quoteCurrency: "usd" })).toBe("GBPUSD");
  });

  it("formatCurrencyPair controls display only", () => {
    const pair = { baseCurrency: "GBP", quoteCurrency: "USD" };
    expect(formatCurrencyPair(pair)).toBe("GBP/USD");
    expect(formatCurrencyPair(pair, { separator: "" })).toBe("GBPUSD");
    expect(formatCurrencyPair(pair, { separator: "-" })).toBe("GBP-USD");
    expect(formatCurrencyPair(pair, { separator: " " })).toBe("GBP USD");
    // ...and none of it changes identity.
    expect(pairId(pair)).toBe("GBPUSD");
  });

  it("round-trips a display string back to the same canonical pair", () => {
    const pair = { baseCurrency: "GBP", quoteCurrency: "USD" };
    for (const separator of ["", "/", " ", ","]) {
      expect(parseCurrencyPair(formatCurrencyPair(pair, { separator })).id).toBe("GBPUSD");
    }
  });
});

describe("collectCurrencyCodes", () => {
  it("derives the registry from pairs already held", () => {
    const codes = collectCurrencyCodes([
      { baseCurrency: "GBP", quoteCurrency: "USD" },
      { baseCurrency: "BTC", quoteCurrency: "USDT" },
    ]);
    expect(codes).toEqual(new Set(["GBP", "USD", "BTC", "USDT"]));
  });

  it("normalises case and skips blanks", () => {
    expect(collectCurrencyCodes([{ baseCurrency: "gbp", quoteCurrency: "" }])).toEqual(
      new Set(["GBP"]),
    );
  });

  it("feeds parseCurrencyPair without a consumer-maintained list", () => {
    const pairs = [{ baseCurrency: "BTC", quoteCurrency: "USDT" }];
    const codes = collectCurrencyCodes(pairs);
    expect(parseCurrencyPair("btcusdt", { codes })).toMatchObject({ valid: true, id: "BTCUSDT" });
  });
});

describe("isCurrencyCode", () => {
  it("accepts ISO and non-ISO shapes", () => {
    expect(isCurrencyCode("GBP")).toBe(true);
    expect(isCurrencyCode("usdt")).toBe(true);
    expect(isCurrencyCode("1INCH")).toBe(true);
  });

  it("rejects implausible shapes", () => {
    expect(isCurrencyCode("G")).toBe(false);
    expect(isCurrencyCode("123")).toBe(false);
    expect(isCurrencyCode("GBP/USD")).toBe(false);
  });
});

describe("currencyDisplayName", () => {
  it("names ISO currencies and metals", () => {
    expect(currencyDisplayName("GBP", "en-US")).toBe("British Pound");
    expect(currencyDisplayName("XAU", "en-US")).toBe("Gold");
  });

  it("localises", () => {
    expect(currencyDisplayName("USD", "fr-FR")).toBe("dollar des États-Unis");
  });

  it("returns null for a well-formed code Intl cannot name", () => {
    // Intl echoes "BTC" straight back; that is not a name.
    expect(currencyDisplayName("BTC", "en-US")).toBeNull();
  });

  it("returns null instead of throwing on non-alpha-3 codes", () => {
    // Intl.DisplayNames throws invalid_argument for these.
    expect(currencyDisplayName("USDT", "en-US")).toBeNull();
    expect(currencyDisplayName("MATIC", "en-US")).toBeNull();
    expect(currencyDisplayName("1INCH", "en-US")).toBeNull();
  });

  it("returns null for blank input", () => {
    expect(currencyDisplayName("  ", "en-US")).toBeNull();
  });
});
