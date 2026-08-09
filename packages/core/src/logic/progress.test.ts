import { describe, expect, it } from "vitest";

import { progressState } from "./progress";

describe("progressState", () => {
  it.each([
    { value: 50, max: 100, percent: 50, valueNow: 50, note: "half way" },
    { value: 1, max: 4, percent: 25, valueNow: 1, note: "aria-valuenow is the raw value" },
    { value: 0, max: 100, percent: 0, valueNow: 0, note: "zero is determinate" },
    { value: 150, max: 100, percent: 100, valueNow: 100, note: "clamped above" },
    { value: -10, max: 100, percent: 0, valueNow: 0, note: "clamped below" },
    { value: 50, max: 0, percent: 0, valueNow: 50, note: "no range to divide by" },
  ])("value $value of $max: $note", ({ value, max, percent, valueNow }) => {
    expect(progressState(value, max)).toEqual({ percent, valueNow, indeterminate: false });
  });

  it("is indeterminate with no value", () => {
    expect(progressState(undefined, 100)).toEqual({
      percent: null,
      valueNow: null,
      indeterminate: true,
    });
  });

  it("treats null as indeterminate too", () => {
    expect(progressState(null, 100)).toEqual({
      percent: null,
      valueNow: null,
      indeterminate: true,
    });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "is indeterminate rather than broken for %p",
    (value) => {
      // A bar cannot be positioned from a value that is not a number. Reporting
      // it as unknown beats rendering NaN% or a fill of infinite width.
      expect(progressState(value, 100).indeterminate).toBe(true);
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    "reports an empty fill when max is %p",
    (max) => {
      expect(progressState(50, max)).toEqual({ percent: 0, valueNow: 50, indeterminate: false });
    },
  );

  it("never yields a percentage outside 0 to 100", () => {
    for (const value of [-1000, -1, 0, 33.3, 99.9, 100, 101, 1e6]) {
      const { percent } = progressState(value, 100);
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    }
  });

  it("keeps a fractional ratio rather than rounding it away", () => {
    // Rounding belongs to the label formatter, not to the geometry: a bar of
    // 300 steps would otherwise move in visible jumps.
    expect(progressState(1, 3).percent).toBeCloseTo(33.3333, 3);
  });
});
