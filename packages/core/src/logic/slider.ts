/**
 * Pure helpers for range-input behaviour.
 *
 * Framework-agnostic by design: no React, no DOM. The styled Slider needs the
 * starting value before the input exists in order to render its readout, so the
 * rule the browser applies has to be expressible here too.
 */

/** A range bound as the DOM accepts it. */
export type SliderBound = string | number | undefined;

/**
 * The value a range input starts on when it is given none.
 *
 * Halfway between the bounds, or the minimum when they are inverted. This is
 * the HTML definition of a range control's default value, restated so a readout
 * can agree with the thumb on first render instead of sitting empty.
 *
 * Missing bounds fall back to the DOM's own defaults of 0 and 100. A bound that
 * is not a finite number yields an empty string: there is no honest midpoint to
 * report, and guessing one would put a number on screen the input does not hold.
 *
 * @param min - Lower bound. Defaults to 0, as the DOM does.
 * @param max - Upper bound. Defaults to 100, as the DOM does.
 *
 * @example
 * ```ts
 * sliderMidpoint(0, 100); // "50"
 * sliderMidpoint(20, 80); // "50"
 * sliderMidpoint(80, 20); // "80" - inverted bounds collapse to the minimum
 * ```
 */
export function sliderMidpoint(min: SliderBound, max: SliderBound): string {
  const lo = Number(min ?? 0);
  const hi = Number(max ?? 100);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return "";
  return String(hi < lo ? lo : lo + (hi - lo) / 2);
}

/**
 * A range bound as a number, falling back to the DOM's own default.
 *
 * @remarks
 * Exists so a formatter is handed real numbers rather than the
 * `string | number | undefined` the DOM accepts, and so the 0-and-100 defaults
 * are stated once rather than at each call site.
 *
 * @param bound - The bound as given.
 * @param fallback - Used when the bound is absent or not a finite number.
 */
export function sliderBoundNumber(bound: SliderBound, fallback: number): number {
  const value = Number(bound ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * A range input's current value as a number, or `null` when there is none.
 *
 * @remarks
 * `null` rather than `NaN` so a caller has one thing to check and cannot pass a
 * `NaN` into a formatter that would render "NaN%" on screen. An array is what
 * the DOM's `value` type permits rather than anything a range input produces;
 * its first entry is read so the type is honoured without inventing behaviour.
 *
 * @example
 * ```ts
 * sliderValueNumber("45"); // 45
 * sliderValueNumber(undefined); // null
 * ```
 */
export function sliderValueNumber(
  value: string | number | readonly string[] | undefined,
): number | null {
  const scalar = Array.isArray(value) ? value[0] : value;
  if (scalar === undefined || scalar === "") return null;
  const parsed = Number(scalar);
  return Number.isFinite(parsed) ? parsed : null;
}
