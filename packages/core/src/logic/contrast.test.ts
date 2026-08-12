import { describe, expect, it } from "vitest";

import {
  compositeOver,
  contrastRatio,
  parseHexColor,
  type Rgb,
  relativeLuminance,
} from "./contrast";

function rgb(value: string): Rgb {
  const parsed = parseHexColor(value);
  if (!parsed) throw new Error(`unparseable in test: ${value}`);
  return parsed;
}

describe("parseHexColor", () => {
  it("parses the six digit form", () => {
    expect(parseHexColor("#dc2626")).toEqual({ r: 220, g: 38, b: 38 });
  });

  it("expands the three digit form", () => {
    expect(parseHexColor("#fff")).toEqual(parseHexColor("#ffffff"));
    expect(parseHexColor("#1a2")).toEqual({ r: 17, g: 170, b: 34 });
  });

  it("ignores case and surrounding space", () => {
    expect(parseHexColor("  #DC2626 ")).toEqual({ r: 220, g: 38, b: 38 });
  });

  it.each([
    ["rgb(0 0 0 / 50%)", "a functional notation"],
    ["red", "a keyword"],
    ["#gggggg", "non-hex digits"],
    ["#ff", "too few digits"],
    ["#ffffff00", "the eight digit form, which carries alpha"],
    ["#ffff", "the four digit form, which carries alpha"],
    ["", "an empty string"],
  ])("returns null for %s (%s)", (value) => {
    expect(parseHexColor(value)).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("puts black at 0 and white at 1", () => {
    expect(relativeLuminance(rgb("#000000"))).toBe(0);
    expect(relativeLuminance(rgb("#ffffff"))).toBe(1);
  });

  it("weights green above red above blue", () => {
    // Same channel value, wildly different luminance. This weighting is why a
    // mid blue disappears on a dark page while a mid green survives.
    const red = relativeLuminance(rgb("#ff0000"));
    const green = relativeLuminance(rgb("#00ff00"));
    const blue = relativeLuminance(rgb("#0000ff"));
    expect(green).toBeGreaterThan(red);
    expect(red).toBeGreaterThan(blue);
  });

  it("applies the linear segment to very dark channels", () => {
    // The branch sits at a channel of 10.31, so 10 takes the linear path and 11
    // takes the gamma curve. Both sides are covered here because a single-sided
    // test passes just as well with the branch removed.
    expect(relativeLuminance(rgb("#0a0a0a"))).toBeCloseTo(0.00303527, 8);
    expect(relativeLuminance(rgb("#0b0b0b"))).toBeCloseTo(0.00334654, 8);
  });
});

describe("contrastRatio", () => {
  it("spans 1 to 21", () => {
    expect(contrastRatio(rgb("#000000"), rgb("#ffffff"))).toBeCloseTo(21, 5);
    expect(contrastRatio(rgb("#777777"), rgb("#777777"))).toBe(1);
  });

  it("is symmetric", () => {
    const ink = rgb("#dc2626");
    const surface = rgb("#fef2f2");
    expect(contrastRatio(ink, surface)).toBe(contrastRatio(surface, ink));
  });

  it("reproduces the values the token matrix relies on", () => {
    // Anchors the maths to numbers checked against the browser's own
    // computed styles, so a refactor here cannot quietly shift the matrix.
    expect(contrastRatio(rgb("#dc2626"), rgb("#fef2f2"))).toBeCloseTo(4.4148, 3);
    expect(contrastRatio(rgb("#1d4ed8"), rgb("#1e3a8a"))).toBeCloseTo(1.5456, 3);
    expect(contrastRatio(rgb("#f9fafb"), rgb("#111827"))).toBeCloseTo(16.9754, 3);
  });
});

describe("compositeOver", () => {
  it("returns the source at alpha 1 and the backdrop at alpha 0", () => {
    const ink = rgb("#111827");
    const page = rgb("#ffffff");
    expect(compositeOver(ink, page, 1)).toEqual(ink);
    expect(compositeOver(ink, page, 0)).toEqual(page);
  });

  it("takes the midpoint of every channel at alpha 0.5", () => {
    expect(compositeOver(rgb("#000000"), rgb("#ffffff"), 0.5)).toEqual({
      r: 127.5,
      g: 127.5,
      b: 127.5,
    });
  });

  it("keeps fractional channels rather than rounding", () => {
    // Rounding here would drift once a nested group composites twice, which is
    // exactly the case that produces the library's worst disabled pairing.
    expect(compositeOver(rgb("#010101"), rgb("#000000"), 0.5)).toEqual({ r: 0.5, g: 0.5, b: 0.5 });
  });

  it("multiplies through nested groups", () => {
    const ink = rgb("#111827");
    const page = rgb("#ffffff");
    const once = compositeOver(ink, page, 0.5);
    expect(compositeOver(once, page, 0.5)).toEqual(compositeOver(ink, page, 0.25));
  });

  it("reproduces the contrast the browser renders through an opacity", () => {
    // Measured in Chromium on the Switch and Slider disabled stories: the
    // declared pair reads 17.74:1 and the composited result 3.39:1. A model
    // that cannot reproduce the browser is not measuring what ships.
    const page = rgb("#ffffff");
    const body = rgb("#111827");
    expect(contrastRatio(body, page)).toBeCloseTo(17.74, 2);
    expect(contrastRatio(compositeOver(body, page, 0.5), page)).toBeCloseTo(3.39, 2);

    // Measured on the FormField disabled story, where a disabled field nested a
    // disabled input and the two groups multiplied to 0.25. Both the ink and the
    // surface it lands on composite, which is why measuring the ink alone
    // against the page gives 1.72 and misses the real 1.36.
    const muted = rgb("#6b7280");
    const recessed = rgb("#f9fafb");
    expect(
      contrastRatio(compositeOver(muted, page, 0.25), compositeOver(recessed, page, 0.25)),
    ).toBeCloseTo(1.36, 2);
  });
});
