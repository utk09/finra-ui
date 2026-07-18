import { describe, expect, it } from "vitest";

import { formatPrice, parsePrice, segmentPrice, stepPrice } from "./priceFormat";

describe("parsePrice", () => {
  it("flags empty input", () => {
    expect(parsePrice("")).toMatchObject({ valid: false, error: "empty" });
    expect(parsePrice("   ")).toMatchObject({ valid: false, error: "empty" });
  });

  describe("decimal", () => {
    it("parses a plain decimal", () => {
      expect(parsePrice("1.23456")).toMatchObject({ valid: true, value: 1.23456 });
      expect(parsePrice("-1.5")).toMatchObject({ valid: true, value: -1.5 });
    });

    it("is paste-tolerant (thousands separators, labels, currency)", () => {
      expect(parsePrice("1,234.50").value).toBe(1234.5);
      expect(parsePrice("EURUSD 1.2345").value).toBe(1.2345);
      expect(parsePrice("$1,000").value).toBe(1000);
    });

    it("rejects garbage", () => {
      expect(parsePrice("abc")).toMatchObject({ valid: false, error: "invalid" });
      expect(parsePrice("1.2.3")).toMatchObject({ valid: false, error: "invalid" });
    });
  });

  describe("bond32", () => {
    const opts = { format: "bond32" as const };

    it("parses 32nds with either separator", () => {
      expect(parsePrice("101-16", opts).value).toBe(101.5);
      expect(parsePrice("99'27", opts).value).toBeCloseTo(99.84375, 10);
    });

    it("parses eighth-of-a-32nd (+ and digit)", () => {
      expect(parsePrice("101-16+", opts).value).toBeCloseTo(101 + 16.5 / 32, 10);
      expect(parsePrice("101-162", opts).value).toBeCloseTo(101 + 16.25 / 32, 10);
    });

    it("rejects out-of-range 32nds and non-bond text", () => {
      expect(parsePrice("101-32", opts)).toMatchObject({ valid: false, error: "invalid" });
      expect(parsePrice("nope", opts)).toMatchObject({ valid: false, error: "invalid" });
    });
  });

  describe("percent / basis-points", () => {
    it("parses percent, stripping the sign", () => {
      expect(parsePrice("4.125%", { format: "percent" }).value).toBe(4.125);
    });

    it("parses basis points, stripping bp/bps", () => {
      expect(parsePrice("15 bp", { format: "basis-points" }).value).toBe(15);
      expect(parsePrice("2.5bps", { format: "basis-points" }).value).toBe(2.5);
    });
  });
});

describe("formatPrice", () => {
  it("formats decimals to precision", () => {
    expect(formatPrice(1.5, { precision: 4 })).toBe("1.5000");
    expect(formatPrice(1.23456)).toBe("1.23456"); // default precision 5
  });

  describe("bond32", () => {
    it("formats round 32nds", () => {
      expect(formatPrice(101.5, { format: "bond32" })).toBe("101-16");
      expect(formatPrice(99.84375, { format: "bond32" })).toBe("99-27");
    });

    it("formats eighths (+ / digit)", () => {
      expect(formatPrice(101 + 16.5 / 32, { format: "bond32" })).toBe("101-16+");
      expect(formatPrice(101 + 16.25 / 32, { format: "bond32" })).toBe("101-162");
    });

    it("honours a custom separator", () => {
      expect(formatPrice(101.5, { format: "bond32", bondSeparator: "'" })).toBe("101'16");
    });

    it("rolls eighths and 32nds over cleanly", () => {
      expect(formatPrice(101.529375, { format: "bond32" })).toBe("101-17"); // eighths → 8
      expect(formatPrice(101.998125, { format: "bond32" })).toBe("102-00"); // 32nds → 32
    });

    it("formats negatives", () => {
      expect(formatPrice(-101.5, { format: "bond32" })).toBe("-101-16");
    });
  });

  it("formats percent and basis points", () => {
    expect(formatPrice(4.125, { format: "percent", precision: 3 })).toBe("4.125%");
    expect(formatPrice(15, { format: "basis-points", precision: 0 })).toBe("15 bp");
  });
});

describe("stepPrice (tick engine)", () => {
  it("snaps an off-tick value to the grid, then steps", () => {
    // 1.23452 snaps to 1.23450, +1 tick (0.00005) → 1.23455
    expect(stepPrice(1.23452, 1, { tickSize: 0.00005, precision: 5 })).toBeCloseTo(1.23455, 10);
    // steps === 0 just snaps to the nearest tick (1.234567 → 1.23455)
    expect(stepPrice(1.234567, 0, { tickSize: 0.00005, precision: 5 })).toBeCloseTo(1.23455, 10);
  });

  it("uses 1/32 as the default bond tick", () => {
    expect(stepPrice(101.5, 1, { format: "bond32" })).toBeCloseTo(101.53125, 10);
    expect(formatPrice(stepPrice(101.5, 1, { format: "bond32" }), { format: "bond32" })).toBe(
      "101-17",
    );
    expect(formatPrice(stepPrice(101.5, -1, { format: "bond32" }), { format: "bond32" })).toBe(
      "101-15",
    );
  });

  it("steps by N ticks (Shift+arrow = ±10)", () => {
    expect(formatPrice(stepPrice(101.5, 10, { format: "bond32" }), { format: "bond32" })).toBe(
      "101-26",
    );
  });

  it("derives the tick from precision when tickSize is omitted", () => {
    // precision 2 → tick 0.01
    expect(stepPrice(1.0, 1, { precision: 2 })).toBeCloseTo(1.01, 10);
  });
});

describe("segmentPrice", () => {
  it("splits primary from precision digits", () => {
    expect(segmentPrice("1.08345", 4)).toEqual([
      { kind: "integer", text: "1" },
      { kind: "separator", text: "." },
      { kind: "primary", text: "0834" },
      { kind: "precision", text: "5" },
    ]);
  });

  it("captures a leading sign and omits an empty precision tail", () => {
    expect(segmentPrice("-1.5", 4)).toEqual([
      { kind: "sign", text: "-" },
      { kind: "integer", text: "1" },
      { kind: "separator", text: "." },
      { kind: "primary", text: "5" },
    ]);
  });

  it("captures a trailing unit (% / bp)", () => {
    expect(segmentPrice("4.125%", 3)).toEqual([
      { kind: "integer", text: "4" },
      { kind: "separator", text: "." },
      { kind: "primary", text: "125" },
      { kind: "unit", text: "%" },
    ]);
    expect(segmentPrice("15 bp", 0)).toEqual([
      { kind: "integer", text: "15" },
      { kind: "unit", text: " bp" },
    ]);
  });

  it("returns a single integer segment for non-decimal displays (bonds)", () => {
    expect(segmentPrice("101-16", 4)).toEqual([{ kind: "integer", text: "101-16" }]);
  });

  it("splits into the FX big-figure / pips / fractional-pip zones", () => {
    expect(segmentPrice("1.23456", { bigFigureDigits: 2, pipDigits: 2 })).toEqual([
      { kind: "big-figure", text: "1.23" },
      { kind: "pips", text: "45" },
      { kind: "fractional-pip", text: "6" },
    ]);
  });

  it("FX mode with no fractional pip omits the last zone", () => {
    expect(segmentPrice("1.2345", { bigFigureDigits: 2, pipDigits: 2 })).toEqual([
      { kind: "big-figure", text: "1.23" },
      { kind: "pips", text: "45" },
    ]);
  });
});
