import { describe, expect, it } from "vitest";

import {
  addDecimal,
  decimalPlaces,
  divideDecimal,
  multiplyDecimal,
  productDecimal,
  roundToDecimals,
  scaleByPowerOfTen,
  subtractDecimal,
  sumDecimal,
} from "./decimal";

describe("decimalPlaces", () => {
  it("reports what the author wrote, not what is stored", () => {
    // 0.1 is stored as 0.10000000000000000555; the answer is still 1.
    expect(decimalPlaces(0.1)).toBe(1);
    expect(decimalPlaces(1.025)).toBe(3);
    expect(decimalPlaces(5)).toBe(0);
    expect(decimalPlaces(-4.1)).toBe(1);
  });

  it("handles exponential notation, which String() produces below 1e-6", () => {
    expect(String(1e-7)).toBe("1e-7");
    expect(decimalPlaces(1e-7)).toBe(7);
    expect(decimalPlaces(1.5e-7)).toBe(8);
    expect(decimalPlaces(1e21)).toBe(0);
  });

  it("returns 0 for non-finite input", () => {
    expect(decimalPlaces(NaN)).toBe(0);
    expect(decimalPlaces(Infinity)).toBe(0);
  });
});

describe("scaleByPowerOfTen", () => {
  it("shifts the exponent without disturbing the mantissa", () => {
    expect(4.1 * 1_000_000).toBe(4099999.9999999995); // the bug being fixed
    expect(scaleByPowerOfTen(4.1, 6)).toBe(4_100_000);

    expect(0.07 * 100).toBe(7.000000000000001);
    expect(scaleByPowerOfTen(0.07, 2)).toBe(7);

    expect(scaleByPowerOfTen(1.025, 6)).toBe(1_025_000);
  });

  it("carries the sign in the mantissa, so negatives are handled", () => {
    // Deriving the exponent from a multiplier via Math.log10 returns NaN here,
    // which silently skips the safe path; taking the exponent directly cannot.
    expect(scaleByPowerOfTen(-4.1, 6)).toBe(-4_100_000);
    expect(scaleByPowerOfTen(-0.07, 2)).toBe(-7);
  });

  it("divides on a negative exponent", () => {
    expect(scaleByPowerOfTen(4.1, -3)).toBe(0.0041);
    expect(scaleByPowerOfTen(4_100_000, -6)).toBe(4.1);
  });

  it("round-trips", () => {
    for (const value of [4.1, 0.07, 1.025, -3.5, 12345.6789]) {
      expect(scaleByPowerOfTen(scaleByPowerOfTen(value, 6), -6)).toBe(value);
    }
  });

  it("is a no-op for zero value or zero exponent", () => {
    expect(scaleByPowerOfTen(0, 6)).toBe(0);
    expect(scaleByPowerOfTen(2.5, 0)).toBe(2.5);
  });

  it("returns NaN for non-finite values or fractional exponents", () => {
    expect(scaleByPowerOfTen(NaN, 2)).toBeNaN();
    expect(scaleByPowerOfTen(Infinity, 2)).toBeNaN();
    expect(scaleByPowerOfTen(4.1, 1.5)).toBeNaN();
  });
});

describe("roundToDecimals", () => {
  it("rounds without the scaling step drifting", () => {
    expect(roundToDecimals(1.005, 2)).toBe(1.01);
    expect(roundToDecimals(2.675, 2)).toBe(2.68);
    expect(roundToDecimals(1.23456789, 4)).toBe(1.2346);
    expect(roundToDecimals(-1.005, 2)).toBe(-1);
  });

  it("passes non-finite values through", () => {
    expect(roundToDecimals(NaN, 2)).toBeNaN();
    expect(roundToDecimals(Infinity, 2)).toBe(Infinity);
  });
});

describe("addDecimal / subtractDecimal", () => {
  it("fixes the canonical cases", () => {
    expect(0.1 + 0.2).toBe(0.30000000000000004);
    expect(addDecimal(0.1, 0.2)).toBe(0.3);

    expect(0.3 - 0.1).toBe(0.19999999999999998);
    expect(subtractDecimal(0.3, 0.1)).toBe(0.2);
  });

  it("handles mixed precision and negatives", () => {
    expect(addDecimal(1.005, 2.5)).toBe(3.505);
    expect(addDecimal(-0.1, -0.2)).toBe(-0.3);
    expect(subtractDecimal(0.1, 0.3)).toBe(-0.2);
  });

  it("leaves integers alone", () => {
    expect(addDecimal(2, 3)).toBe(5);
    expect(subtractDecimal(10, 4)).toBe(6);
  });
});

describe("sumDecimal", () => {
  it("removes float addition's order-dependence", () => {
    expect(0.1 + 0.2 + 0.3).toBe(0.6000000000000001);
    expect(0.1 + (0.2 + 0.3)).toBe(0.6);
    // Same answer for any ordering, because everything scales to one precision.
    expect(sumDecimal(0.1, 0.2, 0.3)).toBe(0.6);
    expect(sumDecimal(0.3, 0.2, 0.1)).toBe(0.6);
    expect(sumDecimal(0.2, 0.1, 0.3)).toBe(0.6);
  });

  it("does not accumulate error over repeated addition", () => {
    let naive = 0;
    for (let i = 0; i < 10; i++) naive += 0.1;
    expect(naive).toBe(0.9999999999999999);

    expect(sumDecimal(...Array<number>(10).fill(0.1))).toBe(1);
  });

  it("handles the empty and single cases", () => {
    expect(sumDecimal()).toBe(0);
    expect(sumDecimal(0.1)).toBe(0.1);
  });
});

describe("multiplyDecimal / productDecimal", () => {
  it("fixes multiplication for non-powers of ten", () => {
    expect(1.1 * 3).toBe(3.3000000000000003);
    expect(multiplyDecimal(1.1, 3)).toBe(3.3);

    expect(0.07 * 100).toBe(7.000000000000001);
    expect(multiplyDecimal(0.07, 100)).toBe(7);
  });

  it("covers the power-of-ten case too", () => {
    expect(multiplyDecimal(4.1, 1_000_000)).toBe(4_100_000);
  });

  it("multiplies two fractions", () => {
    expect(1.1 * 1.1).toBe(1.2100000000000002);
    expect(multiplyDecimal(1.1, 1.1)).toBe(1.21);
  });

  it("handles negatives and zero", () => {
    expect(multiplyDecimal(-1.1, 3)).toBe(-3.3);
    expect(multiplyDecimal(-1.1, -3)).toBe(3.3);
    expect(multiplyDecimal(4.1, 0)).toBe(0);
  });

  it("chains any number of factors", () => {
    expect(productDecimal(1.1, 3, 2)).toBe(6.6);
    expect(productDecimal()).toBe(1);
    expect(productDecimal(2.5)).toBe(2.5);
  });
});

describe("divideDecimal", () => {
  it("returns clean ratios that naive division mangles", () => {
    expect(0.3 / 0.1).toBe(2.9999999999999996);
    expect(divideDecimal(0.3, 0.1)).toBe(3);

    expect(divideDecimal(1.21, 1.1)).toBe(1.1);
    expect(divideDecimal(6.6, 3)).toBe(2.2);
  });

  it("rounds when the result does not terminate", () => {
    // 1/3 has no finite decimal form; no float technique changes that.
    expect(divideDecimal(1, 3)).toBe(0.333333333333);
    expect(divideDecimal(1, 3, 4)).toBe(0.3333);
  });

  it("keeps JS semantics for division by zero and non-finite input", () => {
    expect(divideDecimal(1, 0)).toBe(Infinity);
    expect(divideDecimal(-1, 0)).toBe(-Infinity);
    expect(divideDecimal(0, 0)).toBeNaN();
    expect(divideDecimal(NaN, 2)).toBeNaN();
  });
});

describe("the documented boundary", () => {
  it("falls back to the plain operator past 2^53 rather than returning garbage", () => {
    // Scaled operands exceed MAX_SAFE_INTEGER, so exactness is impossible.
    // The contract is "no worse than the naive operator", not "always exact".
    const a = 1.23456789012345e10;
    const b = 9.87654321e10;
    expect(multiplyDecimal(a, b)).toBe(a * b);

    // Computed, not written as a literal: a literal with this many significant
    // digits trips eslint's no-loss-of-precision, which is the same problem in
    // a different costume. Scaling it by its one decimal place hits MAX_SAFE
    // exactly, so the sum cannot be represented.
    const big = Number.MAX_SAFE_INTEGER / 10;
    expect(sumDecimal(big, big)).toBe(big + big);
  });

  it("propagates non-finite operands instead of inventing a result", () => {
    expect(addDecimal(NaN, 1)).toBeNaN();
    expect(addDecimal(Infinity, 1)).toBe(Infinity);
    expect(multiplyDecimal(NaN, 2)).toBeNaN();
    expect(sumDecimal(1, Infinity)).toBe(Infinity);
    expect(productDecimal(2, NaN)).toBeNaN();
  });
});

describe("realistic amounts (the AmountInput use case)", () => {
  it("expands human notation exactly", () => {
    expect(scaleByPowerOfTen(4.1, 6)).toBe(4_100_000); // 4.1m
    expect(scaleByPowerOfTen(10, 6)).toBe(10_000_000); // 10m
    expect(scaleByPowerOfTen(1.5, 9)).toBe(1_500_000_000); // 1.5bn
    expect(scaleByPowerOfTen(2.5, 3)).toBe(2_500); // 2.5k
  });

  it("keeps two-decimal money arithmetic exact", () => {
    expect(sumDecimal(0.07, 0.01, 0.02)).toBe(0.1);
    expect(subtractDecimal(1_000_000.01, 0.01)).toBe(1_000_000);
    expect(multiplyDecimal(19.99, 3)).toBe(59.97);
  });
});
