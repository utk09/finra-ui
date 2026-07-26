/**
 * Decimal arithmetic that avoids binary floating-point artefacts.
 *
 * ## What the problem actually is
 *
 * A float64 can only represent `p/q` exactly when `q` is a power of two. Since
 * `10 = 2 x 5`, almost no decimal fraction qualifies: only 4 of the 100 values
 * `0.01 .. 1.00` are exact. `0.1` is stored as `0.10000000000000000555`, so the
 * error exists *before* any arithmetic runs, and every operator then compounds
 * it - `0.1 + 0.2` is `0.30000000000000004`, `0.3 / 0.1` is `2.9999999999999996`.
 *
 * ## How these functions fix it
 *
 * Scale both operands to integers by their decimal places, operate in integer
 * space (where float64 is exact up to 2^53), then scale back. The scaling
 * itself goes through {@link scaleByPowerOfTen}, which shifts the decimal
 * exponent textually rather than multiplying, so it introduces no error of
 * its own.
 *
 * ## The boundary - read this
 *
 * Exactness is guaranteed only while the *scaled* integers stay within
 * `Number.MAX_SAFE_INTEGER`. Beyond that the result cannot be trusted, so each
 * function detects the condition and falls back to the plain operator: no
 * better than doing nothing, but never silently worse. Roughly, that means
 * `value x 10^decimals` must stay under ~9.0e15 - ample for prices and
 * notionals, not ample for 15-significant-digit inputs.
 *
 * These are **not** general-purpose safe arithmetic. Irrational results and
 * repeating decimals (`1/3`) remain inexact no matter what, because the return
 * type is still a float64. Code that must never drift - summing ledgers, cash
 * balances - wants integer minor units or a decimal library, not this module.
 */

/** Largest integer for which float64 addition is exact: 2^53 - 1. */
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

/**
 * Decimal places in a number's shortest round-trip representation.
 *
 * Reads the string form, so it reports what the author *wrote* (`0.1` -> 1),
 * not the 55 digits actually stored. Handles exponential notation, which
 * `String()` produces below 1e-6 (`1e-7` -> 7).
 */
export function decimalPlaces(value: number): number {
  if (!Number.isFinite(value)) return 0;

  const text = String(value);
  const eIndex = text.indexOf("e");

  if (eIndex === -1) {
    const dot = text.indexOf(".");
    return dot === -1 ? 0 : text.length - dot - 1;
  }

  const mantissa = text.slice(0, eIndex);
  const exponent = Number(text.slice(eIndex + 1));
  const dot = mantissa.indexOf(".");
  const mantissaPlaces = dot === -1 ? 0 : mantissa.length - dot - 1;

  return Math.max(0, mantissaPlaces - exponent);
}

/**
 * Multiply `value` by `10 ** exponent` without floating-point drift.
 *
 * Shifts the decimal exponent in the number's textual form and re-parses, so
 * the mantissa's digits are never disturbed:
 *
 * ```ts
 * scaleByPowerOfTen(4.1, 6);    // 4100000        (4.1 * 1e6 gives 4099999.9999999995)
 * scaleByPowerOfTen(0.07, 2);   // 7              (0.07 * 100 gives 7.000000000000001)
 * scaleByPowerOfTen(-4.1, 6);   // -4100000       sign travels in the mantissa
 * scaleByPowerOfTen(4.1, -3);   // 0.0041         negative exponents divide
 * ```
 *
 * This is the operation behind human-notation amounts (`4.1m` -> `4_100_000`).
 * Taking the exponent directly - rather than deriving it from a multiplier via
 * `Math.log10` - keeps negative and non-power-of-ten factors from silently
 * skipping the safe path.
 *
 * Returns `NaN` for a non-finite `value` or a non-integer `exponent`.
 */
export function scaleByPowerOfTen(value: number, exponent: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(exponent)) return NaN;
  if (value === 0 || exponent === 0) return value;

  const text = value.toExponential();
  const eIndex = text.indexOf("e");
  const mantissa = text.slice(0, eIndex);
  const currentExponent = Number(text.slice(eIndex + 1));

  return Number(`${mantissa}e${currentExponent + exponent}`);
}

/** Round to `decimals` places without the `n * 10^d` rounding step drifting. */
export function roundToDecimals(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const scaled = scaleByPowerOfTen(value, decimals);
  return scaleByPowerOfTen(Math.round(scaled), -decimals);
}

/** Integer representation of `value` at `decimals` places. */
function toScaledInteger(value: number, decimals: number): number {
  return Math.round(scaleByPowerOfTen(value, decimals));
}

/** Whether every scaled operand (and the result) stays exact in float64. */
function withinSafeRange(...scaled: number[]): boolean {
  return scaled.every((n) => Number.isFinite(n) && Math.abs(n) <= MAX_SAFE);
}

/**
 * `a + b`, exact for decimal inputs.
 *
 * ```ts
 * addDecimal(0.1, 0.2);   // 0.3   (0.1 + 0.2 gives 0.30000000000000004)
 * ```
 */
export function addDecimal(a: number, b: number): number {
  return sumDecimal(a, b);
}

/**
 * `a - b`, exact for decimal inputs.
 *
 * ```ts
 * subtractDecimal(0.3, 0.1);   // 0.2   (0.3 - 0.1 gives 0.19999999999999998)
 * ```
 */
export function subtractDecimal(a: number, b: number): number {
  return sumDecimal(a, -b);
}

/**
 * Sum any number of values, exact for decimal inputs.
 *
 * Scaling every operand to a single common precision before adding also removes
 * float addition's order-dependence: `(0.1 + 0.2) + 0.3` and `0.1 + (0.2 + 0.3)`
 * disagree, but this returns `0.6` for any ordering.
 *
 * ```ts
 * sumDecimal(0.1, 0.2, 0.3);   // 0.6
 * ```
 */
export function sumDecimal(...values: number[]): number {
  if (values.length === 0) return 0;
  if (values.some((v) => !Number.isFinite(v))) {
    return values.reduce((acc, v) => acc + v, 0);
  }

  const decimals = values.reduce((max, v) => Math.max(max, decimalPlaces(v)), 0);
  const scaled = values.map((v) => toScaledInteger(v, decimals));
  const total = scaled.reduce((acc, n) => acc + n, 0);

  if (!withinSafeRange(...scaled, total)) {
    return values.reduce((acc, v) => acc + v, 0);
  }
  return scaleByPowerOfTen(total, -decimals);
}

/**
 * `a * b`, exact for decimal inputs.
 *
 * ```ts
 * multiplyDecimal(1.1, 3);     // 3.3    (1.1 * 3 gives 3.3000000000000003)
 * multiplyDecimal(4.1, 1e6);   // 4100000
 * ```
 */
export function multiplyDecimal(a: number, b: number): number {
  return productDecimal(a, b);
}

/**
 * Multiply any number of values, exact for decimal inputs.
 *
 * ```ts
 * productDecimal(1.1, 3, 2);   // 6.6
 * ```
 */
export function productDecimal(...values: number[]): number {
  if (values.length === 0) return 1;
  if (values.some((v) => !Number.isFinite(v))) {
    return values.reduce((acc, v) => acc * v, 1);
  }

  let decimals = 0;
  let product = 1;

  for (const value of values) {
    decimals += decimalPlaces(value);
    const scaled = toScaledInteger(value, decimalPlaces(value));
    product *= scaled;
    if (!withinSafeRange(scaled, product)) {
      return values.reduce((acc, v) => acc * v, 1);
    }
  }

  return scaleByPowerOfTen(product, -decimals);
}

/**
 * `a / b`, exact when the result terminates.
 *
 * Dividing the scaled integers removes one rounding step, so ratios that should
 * be clean come out clean:
 *
 * ```ts
 * divideDecimal(0.3, 0.1);   // 3   (0.3 / 0.1 gives 2.9999999999999996)
 * ```
 *
 * Division is the one operation that cannot always be exact - `1/3` has no
 * finite decimal form. When the division does not come out evenly the result is
 * rounded to `decimals` places (default 12), which is far enough out to absorb
 * float noise while staying well inside float64's ~15-17 significant digits.
 */
export function divideDecimal(a: number, b: number, decimals = 12): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return a / b;

  const scale = Math.max(decimalPlaces(a), decimalPlaces(b));
  const scaledA = toScaledInteger(a, scale);
  const scaledB = toScaledInteger(b, scale);

  if (withinSafeRange(scaledA, scaledB) && scaledB !== 0 && scaledA % scaledB === 0) {
    return scaledA / scaledB;
  }
  return roundToDecimals(a / b, decimals);
}
