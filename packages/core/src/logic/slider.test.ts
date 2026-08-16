import { describe, expect, it } from "vitest";

import { sliderBoundNumber, sliderMidpoint, sliderValueNumber } from "./slider";

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

describe("sliderBoundNumber", () => {
  it.each([
    { bound: 20, fallback: 0, expected: 20, note: "a number passes through" },
    { bound: "20", fallback: 0, expected: 20, note: "a string, which is how the DOM supplies it" },
    { bound: undefined, fallback: 0, expected: 0, note: "absent falls back" },
    { bound: undefined, fallback: 100, expected: 100, note: "the fallback is the caller's" },
    { bound: "abc", fallback: 100, expected: 100, note: "unparseable falls back, never NaN" },
    { bound: Number.NaN, fallback: 5, expected: 5, note: "NaN falls back" },
    { bound: Number.POSITIVE_INFINITY, fallback: 5, expected: 5, note: "not a usable bound" },
    { bound: 0, fallback: 100, expected: 0, note: "zero is a real bound, not an absent one" },
    { bound: -10, fallback: 0, expected: -10, note: "negatives are bounds like any other" },
  ])("bound $bound with fallback $fallback: $note", ({ bound, fallback, expected }) => {
    expect(sliderBoundNumber(bound, fallback)).toBe(expected);
  });
});

describe("sliderValueNumber", () => {
  it.each([
    { value: "45", expected: 45, note: "the string a range input actually holds" },
    { value: 45, expected: 45, note: "a number passes through" },
    { value: "0", expected: 0, note: "zero is a value, not an absence" },
    { value: "2.5", expected: 2.5, note: "fractions survive" },
    { value: "-3", expected: -3, note: "negatives survive" },
    { value: undefined, expected: null, note: "no value at all" },
    { value: "", expected: null, note: "an empty string is no value, not zero" },
    { value: "abc", expected: null, note: "null rather than NaN, so no formatter sees NaN" },
    { value: Number.NaN, expected: null, note: "NaN in, null out" },
    { value: Number.POSITIVE_INFINITY, expected: null, note: "no place on a bounded range" },
  ])("value $value: $note", ({ value, expected }) => {
    expect(sliderValueNumber(value)).toBe(expected);
  });

  it("reads the first entry of the array form the DOM's value type permits", () => {
    // A range input never produces this; the type allows it, so it is handled
    // rather than left to coerce into something surprising.
    expect(sliderValueNumber(["45"])).toBe(45);
    expect(sliderValueNumber([])).toBeNull();
  });
});
