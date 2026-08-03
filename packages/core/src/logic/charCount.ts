import type { ValidationStatus } from "../types/variants";

/**
 * Status of a character counter against its limit.
 *
 * @remarks
 * Reaching `maxLength` outranks crossing `warningThreshold`, so a field at its
 * limit reads as an error rather than a warning.
 *
 * Both bounds are counts of characters, not fractions. Without `maxLength`
 * there is no limit to be near, so the counter has no status at all and
 * `warningThreshold` alone does nothing.
 *
 * @param count - Characters currently entered.
 * @param maxLength - The limit. Undefined means unlimited.
 * @param warningThreshold - Character count at which the counter warns.
 * @returns The status, or `undefined` while the count is comfortably inside the limit.
 */
export function charCountStatus(
  count: number,
  maxLength?: number,
  warningThreshold?: number,
): ValidationStatus | undefined {
  if (maxLength === undefined) return undefined;
  if (count >= maxLength) return "error";
  if (warningThreshold !== undefined && count >= warningThreshold) return "warning";
  return undefined;
}
