import { describe, expect, it } from "vitest";

import { type NumberLocaleHint, parseCellNumber } from "./clipboardValues";

describe("parseCellNumber", () => {
  //  The behaviour table from the specification, verbatim.

  it.each([
    ["$1,500,000.50", "auto", 1500000.5, undefined, "US"],
    ["1.500.000,50 €", "auto", 1500000.5, undefined, "EU"],
    ["(50,000.00)", "auto", -50000, undefined, "US"],
    ["-10%", "auto", -10, undefined, "US"],
    ["25,5%", "auto", 25.5, undefined, "EU"],
    ["1.234", "auto", null, "ambiguous", "US"],
    ["1.234", "US", 1.234, undefined, "US"],
    ["1.234", "EU", 1234, undefined, "EU"],
    ["", "auto", null, "empty", "US"],
    ["   ", "auto", null, "empty", "US"],
    ["n/a", "auto", null, "invalid", "US"],
    ["(1,000)%", "auto", -1000, undefined, "US"],
  ] as [string, NumberLocaleHint, number | null, string | undefined, "US" | "EU"][])(
    "reads %j as %s -> %p",
    (cell, numberFormat, value, error, resolvedLocale) => {
      const result = parseCellNumber(cell, { numberFormat });
      expect(result.value).toBe(value);
      expect(result.error).toBe(error);
      expect(result.resolvedLocale).toBe(resolvedLocale);
      expect(result.valid).toBe(error === undefined);
    },
  );

  //  Convention detection

  // An object table rather than tuples: the reason each case resolves the way
  // it does belongs beside the case, and naming the columns keeps the callback
  // from having to take an argument it does not use.
  it.each([
    { cell: "1,000,000", value: 1000000, locale: "US", why: "several commas can only be grouping" },
    { cell: "1.000.000", value: 1000000, locale: "EU", why: "several dots can only be grouping" },
    { cell: "1.5", value: 1.5, locale: "US", why: "one dot, one trailing digit, a decimal" },
    { cell: "1.50", value: 1.5, locale: "US", why: "one dot, two trailing digits, a decimal" },
    { cell: "1.2345", value: 1.2345, locale: "US", why: "four trailing digits cannot be grouping" },
    { cell: "1,5", value: 1.5, locale: "EU", why: "one comma, one trailing digit, a decimal" },
    { cell: "1,2345", value: 1.2345, locale: "EU", why: "four trailing digits cannot be grouping" },
    { cell: "1,000", value: 1000, locale: "US", why: "three trailing digits read as grouping" },
    { cell: "42", value: 42, locale: "US", why: "no separator at all" },
  ])("reads $cell as $value in $locale ($why)", ({ cell, value, locale }) => {
    const result = parseCellNumber(cell);
    expect(result.value).toBe(value);
    expect(result.resolvedLocale).toBe(locale);
  });

  it("reports the one pattern that genuinely cannot be decided", () => {
    // 1.234 is a rate in US and a thousand-something in EU, and both are
    // ordinary numbers here. Say so rather than pick one.
    const result = parseCellNumber("1.234");
    expect(result.error).toBe("ambiguous");
    expect(result.value).toBeNull();
    expect(result.valid).toBe(false);
  });

  it("resolves the ambiguous pattern once told which convention to use", () => {
    expect(parseCellNumber("1.234", { numberFormat: "US" }).value).toBe(1.234);
    expect(parseCellNumber("1.234", { numberFormat: "EU" }).value).toBe(1234);
  });

  it("leans US for a single comma with three digits, deliberately", () => {
    // The asymmetry with the dot case: flagging this would flag almost every
    // grouped number a US spreadsheet produces.
    const result = parseCellNumber("1,000");
    expect(result.error).toBeUndefined();
    expect(result.value).toBe(1000);
  });

  //  Accounting parentheses and percent

  it.each([
    ["(1,234.5)", -1234.5],
    ["(0.5)", -0.5],
    ["-1,234.5", -1234.5],
  ] as const)("reads %j as a negative", (cell, value) => {
    expect(parseCellNumber(cell).value).toBe(value);
  });

  it("combines accounting parentheses with a trailing percent", () => {
    expect(parseCellNumber("(1,000)%").value).toBe(-1000);
  });

  it("returns a percent as written rather than rescaling it", () => {
    // A percent column holds percents. Dividing by 100 here would make the
    // value disagree with the cell it was copied from.
    expect(parseCellNumber("12.5%").value).toBe(12.5);
    expect(parseCellNumber("25,5%").value).toBe(25.5);
  });

  it("never returns negative zero", () => {
    // React's Object.is state comparison treats -0 as a change from 0.
    expect(Object.is(parseCellNumber("(0)").value, -0)).toBe(false);
    expect(Object.is(parseCellNumber("-0").value, -0)).toBe(false);
  });

  //  Currency symbols

  it.each(["$1,234.50", "€1,234.50", "£1,234.50", "¥1,234.50", "₹1,234.50"])(
    "strips the symbol in %j",
    (cell) => {
      expect(parseCellNumber(cell).value).toBe(1234.5);
    },
  );

  // Two spellings of the same number. The first uses ordinary spaces; the
  // second holds two literal U+00A0 characters, which is what fr-FR actually
  // emits as its group separator. Both are grouping, so both must parse, and
  // keeping the pair means an editor that normalises invisible characters
  // cannot silently reduce this to one case.
  it("reads both an ordinary and a non-breaking space as grouping", () => {
    expect(parseCellNumber("1 234,50 €", { numberFormat: "EU" }).value).toBe(1234.5);
    expect(parseCellNumber("1 234,50 €", { numberFormat: "EU" }).value).toBe(1234.5);
  });

  it("keeps the symbol when asked not to strip it", () => {
    const result = parseCellNumber("$1,234.50", { stripCurrencySymbols: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalid");
  });

  it("reports a letter currency code as invalid rather than guessing", () => {
    // A cell whose currency disagrees with its column is worth surfacing.
    expect(parseCellNumber("10 USD").error).toBe("invalid");
  });

  //  Nothing throws, and a bad cell stays local

  it.each([
    ["n/a", "invalid"],
    ["-", "invalid"],
    ["#REF!", "invalid"],
    ["1.2.3.4", "invalid"],
    ["--5", "invalid"],
    ["", "empty"],
    [" ", "empty"],
  ] as const)("reports %j as %s without throwing", (cell, error) => {
    expect(() => parseCellNumber(cell)).not.toThrow();
    expect(parseCellNumber(cell).error).toBe(error);
  });

  it("leaves the rows around a bad cell untouched", () => {
    const cells = ["1,000.00", "n/a", "2,000.00"];
    expect(cells.map((cell) => parseCellNumber(cell).value)).toEqual([1000, null, 2000]);
  });

  it("always reports a locale, even when there was nothing to read", () => {
    for (const cell of ["", "   ", "n/a", "1.234"]) {
      expect(parseCellNumber(cell).resolvedLocale).toBe("US");
    }
  });

  it("reports the explicit locale even when the cell fails to parse", () => {
    expect(parseCellNumber("n/a", { numberFormat: "EU" }).resolvedLocale).toBe("EU");
  });
});
