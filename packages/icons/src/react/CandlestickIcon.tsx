import type { SVGProps } from "react";

/**
 * Candlestick icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function CandlestickIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <line x1="9" y1="2" x2="9" y2="6" />
      <rect x="6" y="6" width="6" height="10" rx="1" />
      <line x1="9" y1="16" x2="9" y2="22" />
      <line x1="17" y1="2" x2="17" y2="10" />
      <rect x="14" y="10" width="6" height="8" rx="1" />
      <line x1="17" y1="18" x2="17" y2="22" />
    </svg>
  );
}
