import type { SVGProps } from "react";

/**
 * Derivatives icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function DerivativesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M7 10a5 5 0 0 1 9-3l3 3" />
      <path d="M19 6v4h-4" />
      <path d="M17 14a5 5 0 0 1-9 3l-3-3" />
      <path d="M5 18v-4h4" />
    </svg>
  );
}
