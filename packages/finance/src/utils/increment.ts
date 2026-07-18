/**
 * Shared, FP-safe increment engine for the finance numeric inputs
 * (PriceInput, AmountInput, ...). Increment *semantics* live here, decoupled
 * from keyboard mapping (see `logic/keymap.ts`) so a consumer can bind any key
 * to any action.
 *
 * All results are rounded to the configured display precision with the chosen
 * rounding strategy, so `0.1 + 0.2` never surfaces as `0.30000000000000004`.
 */

export type RoundingMode = "half-up" | "half-even" | "floor" | "ceil";

/**
 * A numeric value's precision structure. `primaryPrecision` is the number of
 * "primary" decimals (e.g. 4 for FX `1.0834`); `precisionDigits` is the extra
 * fractional-precision tail (e.g. 1 for the trailing pip fraction `…5`).
 */
export interface NumericPrecision {
  primaryPrecision: number;
  /** Extra fractional-precision digits beyond the primary block. Default 0. */
  precisionDigits?: number;
  /** Total decimals shown. Default `primaryPrecision + precisionDigits`. */
  displayPrecision?: number;
  /** Rounding strategy for all engine output. Default "half-up". */
  rounding?: RoundingMode;
}

/**
 * A single, keyboard-independent increment action. `direction` (+1 / -1) is
 * supplied at call time, so the same action serves increment and decrement.
 */
export type IncrementAction =
  | { type: "primary" }
  | { type: "precision" }
  | { type: "digit"; position: number }
  | { type: "amount"; amount: number }
  | { type: "tick"; ticks?: number }
  | { type: "custom"; apply: (value: number, direction: 1 | -1) => number };

export interface IncrementContext {
  precision: NumericPrecision;
  /** Tick size for `{ type: "tick" }`. Falls back to one display unit. */
  tickSize?: number;
}

/** Total decimals shown for a precision config. */
export function displayDecimals(precision: NumericPrecision): number {
  return (
    precision.displayPrecision ?? precision.primaryPrecision + (precision.precisionDigits ?? 0)
  );
}

/** Round `n` to `decimals` places with the given strategy (FP-noise safe). */
export function roundWith(n: number, decimals: number, mode: RoundingMode = "half-up"): number {
  const factor = 10 ** decimals;
  const scaled = n * factor;
  switch (mode) {
    case "floor":
      // Nudge up so a value meant to be k.0 (stored k-ε) floors to k.
      return Math.floor(scaled + 1e-9) / factor;
    case "ceil":
      return Math.ceil(scaled - 1e-9) / factor;
    case "half-even": {
      const floor = Math.floor(scaled);
      // Exact half (within FP tolerance) → round to the even neighbour.
      if (Math.abs(scaled - floor - 0.5) < 1e-9) {
        return (floor % 2 === 0 ? floor : floor + 1) / factor;
      }
      return Math.round(scaled) / factor;
    }
    default: {
      // half-up, nudged away from binary representation error.
      const eps = n >= 0 ? Number.EPSILON : -Number.EPSILON;
      return Math.round((n + eps) * factor) / factor;
    }
  }
}

/**
 * Apply one increment `action` to `value` in `direction` (+1 / -1), rounded to
 * the configured display precision. Keyboard-independent and programmatic.
 */
export function resolveIncrement(
  value: number,
  direction: 1 | -1,
  action: IncrementAction,
  ctx: IncrementContext,
): number {
  const decimals = displayDecimals(ctx.precision);
  const round = (n: number): number => roundWith(n, decimals, ctx.precision.rounding);

  switch (action.type) {
    case "custom":
      return round(action.apply(value, direction));
    case "tick": {
      const tick = ctx.tickSize ?? 10 ** -decimals;
      const count = action.ticks ?? 1;
      const ticks = Math.round(value / tick) + direction * count;
      return round(ticks * tick);
    }
    case "amount":
      return round(value + direction * action.amount);
    case "digit":
      return round(value + direction * 10 ** -action.position);
    case "primary":
      return round(value + direction * 10 ** -ctx.precision.primaryPrecision);
    case "precision": {
      const position = ctx.precision.primaryPrecision + (ctx.precision.precisionDigits ?? 0);
      return round(value + direction * 10 ** -position);
    }
  }
}

//  Tick validation

/** How an off-tick value is handled. */
export type TickValidationMode = "reject" | "warn" | "round" | "snap";

export interface TickValidationResult {
  /** False only when `mode === "reject"` and the value is off-tick. */
  valid: boolean;
  /** The value to use (snapped for round/snap, unchanged otherwise). */
  value: number;
  /** True when `mode === "warn"` and the value is off-tick. */
  warning?: boolean;
}

/**
 * Validate `value` against `tickSize` per `mode`. `round`/`snap` return the
 * nearest on-tick value; `reject` flags invalid; `warn` accepts with a flag.
 */
export function validateTick(
  value: number,
  tickSize: number,
  mode: TickValidationMode,
  decimals: number,
): TickValidationResult {
  const nearest = roundWith(Math.round(value / tickSize) * tickSize, decimals);
  if (Math.abs(value - nearest) < 1e-9) return { valid: true, value };

  switch (mode) {
    case "reject":
      return { valid: false, value };
    case "warn":
      return { valid: true, value, warning: true };
    default: // round | snap
      return { valid: true, value: nearest };
  }
}
