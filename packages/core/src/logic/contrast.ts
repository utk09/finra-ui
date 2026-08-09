/** An opaque colour, as 8-bit channels. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Parse a 3 or 6 digit hex colour.
 *
 * @remarks
 * Returns `null` for anything else, including the 4 and 8 digit forms. Those
 * carry an alpha channel, and a translucent colour has no contrast ratio of its
 * own: it depends on whatever is painted behind it. Composite it first, then
 * measure the result.
 *
 * @returns The parsed channels, or `null` when the input is not an opaque hex colour.
 */
export function parseHexColor(value: string): Rgb | null {
  const match = HEX_PATTERN.exec(value.trim());
  if (!match) return null;

  const digits = match[1];
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits;

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

function channelLuminance(channel: number): number {
  const proportion = channel / 255;
  return proportion <= 0.04045 ? proportion / 12.92 : ((proportion + 0.055) / 1.055) ** 2.4;
}

/**
 * Relative luminance, per the WCAG 2 definition.
 *
 * @remarks
 * Not perceived brightness. The green channel carries most of the weight
 * because the eye is most sensitive to it, which is why a mid green and a mid
 * blue of the same hex "darkness" behave very differently against a dark page.
 */
export function relativeLuminance(color: Rgb): number {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

/**
 * Contrast ratio between two opaque colours, from 1 to 21.
 *
 * @remarks
 * Symmetric: which colour is the ink and which is the surface does not change
 * the number, only which WCAG threshold applies to it. Body text needs 4.5,
 * large text and meaningful non-text graphics need 3.
 *
 * @example
 * ```ts
 * const ink = parseHexColor("#dc2626");
 * const surface = parseHexColor("#fef2f2");
 * if (ink && surface) contrastRatio(ink, surface); // 4.41
 * ```
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (first, second) => second - first,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
