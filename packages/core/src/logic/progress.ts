/**
 * Deriving a progress bar's fill and its ARIA value from `value` and `max`.
 *
 * Framework-agnostic: the React layer renders the result and a future Lit
 * adapter reads the same function.
 */

export interface ProgressState {
  /** Fill percentage, 0 to 100, or `null` while indeterminate. */
  percent: number | null;
  /**
   * `aria-valuenow`. `null` means the attribute is omitted entirely rather than
   * set to a placeholder, which is how an indeterminate bar is expressed.
   */
  valueNow: number | null;
  /** Work whose total is not yet known. Zero progress is not this. */
  indeterminate: boolean;
}

/**
 * Resolve `value` and `max` into a fill percentage and an ARIA value.
 *
 * An absent value is indeterminate. Zero is a determinate state: it means no
 * progress, not unknown progress.
 */
export function progressState(value: number | null | undefined, max: number): ProgressState {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { percent: null, valueNow: null, indeterminate: true };
  }

  // A non-positive or non-finite max describes no range, so there is no ratio
  // to report and the fill stays empty. The value itself passes through
  // unclamped: clamping to an impossible range would report a position the
  // caller never described.
  if (!Number.isFinite(max) || max <= 0) {
    return { percent: 0, valueNow: value, indeterminate: false };
  }

  const clamped = Math.min(Math.max(value, 0), max);
  return { percent: (clamped / max) * 100, valueNow: clamped, indeterminate: false };
}
