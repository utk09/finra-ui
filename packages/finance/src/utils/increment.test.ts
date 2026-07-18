import { describe, expect, it } from "vitest";

import {
  displayDecimals,
  type IncrementContext,
  resolveIncrement,
  roundWith,
  validateTick,
} from "./increment";

// FX-style: 4 primary decimals + 1 fractional-precision digit → 5 shown.
const FX: IncrementContext = {
  precision: { primaryPrecision: 4, precisionDigits: 1 },
  tickSize: 0.00005,
};

describe("displayDecimals", () => {
  it("defaults to primary + precision digits", () => {
    expect(displayDecimals({ primaryPrecision: 4 })).toBe(4);
    expect(displayDecimals({ primaryPrecision: 4, precisionDigits: 1 })).toBe(5);
  });

  it("honours an explicit displayPrecision", () => {
    expect(displayDecimals({ primaryPrecision: 4, precisionDigits: 1, displayPrecision: 6 })).toBe(
      6,
    );
  });
});

describe("roundWith", () => {
  it("half-up (default) kills float noise", () => {
    expect(roundWith(0.1 + 0.2, 2)).toBe(0.3);
    expect(roundWith(1.005, 2)).toBe(1.01);
    expect(roundWith(0.125, 2)).toBe(0.13);
  });

  it("half-even rounds ties to the even neighbour", () => {
    expect(roundWith(0.125, 2, "half-even")).toBe(0.12);
    expect(roundWith(2.5, 0, "half-even")).toBe(2);
    expect(roundWith(3.5, 0, "half-even")).toBe(4);
  });

  it("floor / ceil", () => {
    expect(roundWith(1.239, 2, "floor")).toBe(1.23);
    expect(roundWith(1.231, 2, "ceil")).toBe(1.24);
  });
});

describe("resolveIncrement", () => {
  it("steps the primary digit", () => {
    expect(resolveIncrement(1.08345, 1, { type: "primary" }, FX)).toBeCloseTo(1.08355, 6);
    expect(resolveIncrement(1.08345, -1, { type: "primary" }, FX)).toBeCloseTo(1.08335, 6);
  });

  it("steps the precision digit", () => {
    expect(resolveIncrement(1.08345, 1, { type: "precision" }, FX)).toBeCloseTo(1.08346, 6);
  });

  it("steps a specific digit position", () => {
    expect(resolveIncrement(1.08345, 1, { type: "digit", position: 2 }, FX)).toBeCloseTo(
      1.09345,
      6,
    );
  });

  it("steps by a fixed amount", () => {
    expect(resolveIncrement(1.08345, 1, { type: "amount", amount: 0.5 }, FX)).toBeCloseTo(
      1.58345,
      6,
    );
  });

  it("steps by tick, snapping to the grid", () => {
    expect(resolveIncrement(1.08345, 1, { type: "tick" }, FX)).toBeCloseTo(1.0835, 6);
  });

  it("steps by multiple ticks", () => {
    expect(resolveIncrement(1.08345, 1, { type: "tick", ticks: 10 }, FX)).toBeCloseTo(1.08395, 6);
    expect(resolveIncrement(1.08345, -1, { type: "tick", ticks: 10 }, FX)).toBeCloseTo(1.08295, 6);
  });

  it("supports a custom delta", () => {
    const action = { type: "custom" as const, apply: (v: number, d: 1 | -1) => v + d * 10 };
    expect(resolveIncrement(1.08345, 1, action, FX)).toBeCloseTo(11.08345, 6);
  });
});

describe("validateTick", () => {
  const tick = 0.00005;

  it("accepts an on-tick value", () => {
    expect(validateTick(1.0835, tick, "reject", 5)).toMatchObject({ valid: true });
  });

  it("rejects an off-tick value", () => {
    const r = validateTick(1.08347, tick, "reject", 5);
    expect(r.valid).toBe(false);
    expect(r.value).toBeCloseTo(1.08347, 6);
  });

  it("warns but accepts", () => {
    const r = validateTick(1.08347, tick, "warn", 5);
    expect(r).toMatchObject({ valid: true, warning: true });
  });

  it("snaps to the nearest tick", () => {
    expect(validateTick(1.08347, tick, "snap", 5).value).toBeCloseTo(1.08345, 6);
    expect(validateTick(1.08347, tick, "round", 5).value).toBeCloseTo(1.08345, 6);
  });
});
