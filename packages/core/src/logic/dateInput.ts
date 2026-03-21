/**
 * Pure date-input helpers - zero framework imports.
 * Shared by DateInputBase and DateTenorInputBase.
 */

/**
 * Auto-insert separators as digits are typed.
 * E.g. "20260" → "2026-0" for YYYY-MM-DD format.
 */
export function autoInsertSeparators(
  raw: string,
  segmentLengths: readonly number[],
  sep: string,
): string {
  const digitsOnly = raw.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;
  for (let i = 0; i < segmentLengths.length && digitIndex < digitsOnly.length; i++) {
    if (i > 0) result += sep;
    const segLen = segmentLengths[i];
    result += digitsOnly.slice(digitIndex, digitIndex + segLen);
    digitIndex += segLen;
  }
  return result;
}

/**
 * Compute the maximum input length (digits + separators).
 */
export function getMaxLength(segmentLengths: readonly number[], sep: string): number {
  const digitCount = segmentLengths.reduce((sum, len) => sum + len, 0);
  const separatorCount = segmentLengths.length - 1;
  return digitCount + separatorCount * sep.length;
}
