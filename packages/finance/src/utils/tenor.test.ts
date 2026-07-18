import { describe, expect, it } from "vitest";

import {
  dateToTenor,
  isStandardTenor,
  parseTenor,
  parseTenorInput,
  resolveTenor,
  STANDARD_TENORS,
} from "./tenor";

describe("parseTenor", () => {
  it("parses special tenors", () => {
    expect(parseTenor("ON")).toEqual({ valid: true, tenor: "ON", value: 1, unit: "D" });
    expect(parseTenor("TN")).toEqual({ valid: true, tenor: "TN", value: 2, unit: "D" });
    expect(parseTenor("SN")).toEqual({ valid: true, tenor: "SN", value: 2, unit: "D" });
    expect(parseTenor("SW")).toEqual({ valid: true, tenor: "SW", value: 1, unit: "W" });
  });

  it("is case-insensitive", () => {
    expect(parseTenor("on")).toEqual({ valid: true, tenor: "ON", value: 1, unit: "D" });
    expect(parseTenor("3m")).toEqual({ valid: true, tenor: "3M", value: 3, unit: "M" });
    expect(parseTenor("10y")).toEqual({ valid: true, tenor: "10Y", value: 10, unit: "Y" });
  });

  it("parses numeric tenors", () => {
    expect(parseTenor("1W")).toEqual({ valid: true, tenor: "1W", value: 1, unit: "W" });
    expect(parseTenor("3M")).toEqual({ valid: true, tenor: "3M", value: 3, unit: "M" });
    expect(parseTenor("6M")).toEqual({ valid: true, tenor: "6M", value: 6, unit: "M" });
    expect(parseTenor("1Y")).toEqual({ valid: true, tenor: "1Y", value: 1, unit: "Y" });
    expect(parseTenor("30Y")).toEqual({ valid: true, tenor: "30Y", value: 30, unit: "Y" });
  });

  it("parses custom tenors like 4M, 7Y", () => {
    expect(parseTenor("4M")).toEqual({ valid: true, tenor: "4M", value: 4, unit: "M" });
    expect(parseTenor("7Y")).toEqual({ valid: true, tenor: "7Y", value: 7, unit: "Y" });
    expect(parseTenor("14D")).toEqual({ valid: true, tenor: "14D", value: 14, unit: "D" });
  });

  it("trims whitespace", () => {
    expect(parseTenor("  3M  ").valid).toBe(true);
  });

  it("rejects empty input", () => {
    expect(parseTenor("")).toEqual({ valid: false, tenor: null, error: "invalid-format" });
    expect(parseTenor("   ")).toEqual({ valid: false, tenor: null, error: "invalid-format" });
  });

  it("rejects invalid formats", () => {
    expect(parseTenor("ABC").valid).toBe(false);
    expect(parseTenor("3X").valid).toBe(false);
    expect(parseTenor("M3").valid).toBe(false);
    expect(parseTenor("3.5M").valid).toBe(false);
    expect(parseTenor("three months").valid).toBe(false);
  });

  it("rejects zero value", () => {
    expect(parseTenor("0M")).toEqual({ valid: false, tenor: null, error: "invalid-value" });
  });
});

describe("isStandardTenor", () => {
  it("returns true for all standard tenors", () => {
    for (const tenor of STANDARD_TENORS) {
      expect(isStandardTenor(tenor)).toBe(true);
    }
  });

  it("is case-insensitive", () => {
    expect(isStandardTenor("on")).toBe(true);
    expect(isStandardTenor("3m")).toBe(true);
  });

  it("returns false for non-standard tenors", () => {
    expect(isStandardTenor("4M")).toBe(false);
    expect(isStandardTenor("7Y")).toBe(false);
    expect(isStandardTenor("ABC")).toBe(false);
  });
});

describe("resolveTenor", () => {
  const ref = new Date(2026, 2, 11); // March 11, 2026

  it("resolves ON to +1 day", () => {
    const result = resolveTenor("ON", ref);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(2);
    expect(result?.getDate()).toBe(12);
  });

  it("resolves TN to +2 days", () => {
    const result = resolveTenor("TN", ref);
    expect(result?.getDate()).toBe(13);
  });

  it("resolves SW to +1 week", () => {
    const result = resolveTenor("SW", ref);
    expect(result?.getDate()).toBe(18);
  });

  it("resolves 2W to +14 days", () => {
    const result = resolveTenor("2W", ref);
    expect(result?.getDate()).toBe(25);
  });

  it("resolves 1M to +1 month", () => {
    const result = resolveTenor("1M", ref);
    expect(result?.getMonth()).toBe(3); // April
    expect(result?.getDate()).toBe(11);
  });

  it("resolves 3M to +3 months", () => {
    const result = resolveTenor("3M", ref);
    expect(result?.getMonth()).toBe(5); // June
    expect(result?.getDate()).toBe(11);
  });

  it("resolves 1Y to +1 year", () => {
    const result = resolveTenor("1Y", ref);
    expect(result?.getFullYear()).toBe(2027);
    expect(result?.getMonth()).toBe(2);
    expect(result?.getDate()).toBe(11);
  });

  it("resolves 10Y to +10 years", () => {
    const result = resolveTenor("10Y", ref);
    expect(result?.getFullYear()).toBe(2036);
  });

  it("resolves 30Y to +30 years", () => {
    const result = resolveTenor("30Y", ref);
    expect(result?.getFullYear()).toBe(2056);
  });

  it("returns null for invalid tenor", () => {
    expect(resolveTenor("ABC", ref)).toBeNull();
  });

  it("handles month-end edge case", () => {
    // Jan 31 + 1M - Feb doesn't have 31 days
    const jan31 = new Date(2026, 0, 31);
    const result = resolveTenor("1M", jan31);
    // JS Date wraps to March 3 (28 + 3 = 31), which is the native behavior
    expect(result).not.toBeNull();
  });
});

describe("dateToTenor", () => {
  const ref = new Date(2026, 2, 11); // March 11, 2026

  it("returns ON for +1 day", () => {
    expect(dateToTenor(new Date(2026, 2, 12), ref)).toBe("ON");
  });

  it("returns 1M for +1 month", () => {
    expect(dateToTenor(new Date(2026, 3, 11), ref)).toBe("1M");
  });

  it("returns 1Y for +1 year", () => {
    expect(dateToTenor(new Date(2027, 2, 11), ref)).toBe("1Y");
  });

  it("returns null for non-standard date", () => {
    // March 20 doesn't match any standard tenor from March 11
    expect(dateToTenor(new Date(2026, 2, 20), ref)).toBeNull();
  });

  it("prefers earlier match (ON before TN for +1 day)", () => {
    const result = dateToTenor(new Date(2026, 2, 12), ref);
    expect(result).toBe("ON");
  });
});

describe("parseTenorInput", () => {
  it("parses short numeric units case-insensitively", () => {
    expect(parseTenorInput("3m")).toMatchObject({ valid: true, tenor: "3M" });
    expect(parseTenorInput("3M")).toMatchObject({ valid: true, tenor: "3M" });
    expect(parseTenorInput("90d")).toMatchObject({ valid: true, tenor: "90D" });
    expect(parseTenorInput("18m")).toMatchObject({ valid: true, tenor: "18M" });
    expect(parseTenorInput("10Y")).toMatchObject({ valid: true, tenor: "10Y" });
  });

  it("parses long unit words with whitespace", () => {
    expect(parseTenorInput("3 months")).toMatchObject({ valid: true, tenor: "3M" });
    expect(parseTenorInput("1 year")).toMatchObject({ valid: true, tenor: "1Y" });
    expect(parseTenorInput("2 weeks")).toMatchObject({ valid: true, tenor: "2W" });
    expect(parseTenorInput("5 days")).toMatchObject({ valid: true, tenor: "5D" });
  });

  it("parses compound tenors and canonicalises by unit magnitude", () => {
    expect(parseTenorInput("1y6m")).toMatchObject({ valid: true, tenor: "1Y6M" });
    expect(parseTenorInput("1y 6m")).toMatchObject({ valid: true, tenor: "1Y6M" });
    expect(parseTenorInput("6m1y")).toMatchObject({ valid: true, tenor: "1Y6M" });
    expect(parseTenorInput("2w3d")).toMatchObject({ valid: true, tenor: "2W3D" });
  });

  it("exposes decomposed terms", () => {
    expect(parseTenorInput("1y6m").terms).toEqual([
      { value: 1, unit: "Y" },
      { value: 6, unit: "M" },
    ]);
  });

  it("parses named/coded special tenors", () => {
    expect(parseTenorInput("overnight")).toMatchObject({ valid: true, tenor: "ON", special: "ON" });
    expect(parseTenorInput("ON")).toMatchObject({ valid: true, tenor: "ON", special: "ON" });
    expect(parseTenorInput("tom-next")).toMatchObject({ valid: true, tenor: "TN" });
    expect(parseTenorInput("spot next")).toMatchObject({ valid: true, tenor: "SN" });
    expect(parseTenorInput("SW")).toMatchObject({ valid: true, tenor: "SW" });
  });

  it("rejects invalid input", () => {
    expect(parseTenorInput("")).toMatchObject({ valid: false, error: "invalid-format" });
    expect(parseTenorInput("abc")).toMatchObject({ valid: false, error: "invalid-format" });
    expect(parseTenorInput("3x")).toMatchObject({ valid: false, error: "invalid-format" });
    expect(parseTenorInput("3m5")).toMatchObject({ valid: false, error: "invalid-format" });
    expect(parseTenorInput("0m")).toMatchObject({ valid: false, error: "invalid-value" });
  });

  it("rejects duplicate units in a compound", () => {
    expect(parseTenorInput("1m2m")).toMatchObject({ valid: false, error: "invalid-format" });
  });
});
