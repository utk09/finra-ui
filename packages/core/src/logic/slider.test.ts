import { describe, expect, it } from "vitest";

import { sliderMidpoint } from "./slider";

describe("sliderMidpoint", () => {
  it("falls back to the DOM's own 0-100 bounds", () => {
    expect(sliderMidpoint(undefined, undefined)).toBe("50");
  });

  it("halves an explicit range", () => {
    expect(sliderMidpoint(20, 80)).toBe("50");
  });

  it("accepts bounds as strings, which is how the DOM supplies them", () => {
    expect(sliderMidpoint("0", "10")).toBe("5");
  });

  it("uses only the bound that is given", () => {
    expect(sliderMidpoint(50, undefined)).toBe("75");
    expect(sliderMidpoint(undefined, 50)).toBe("25");
  });

  it("collapses inverted bounds to the minimum, as the DOM does", () => {
    expect(sliderMidpoint(80, 20)).toBe("80");
  });

  it("keeps a fractional midpoint rather than rounding it", () => {
    expect(sliderMidpoint(0, 5)).toBe("2.5");
  });

  it("reports nothing when a bound is not a number", () => {
    // Guessing a midpoint here would put a figure on screen that the input
    // does not hold.
    expect(sliderMidpoint("abc", 100)).toBe("");
    expect(sliderMidpoint(0, "wide")).toBe("");
  });

  it("treats an equal pair as that value", () => {
    expect(sliderMidpoint(7, 7)).toBe("7");
  });
});
