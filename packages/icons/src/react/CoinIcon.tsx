import type { SVGProps } from "react";

/**
 * Coin icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function CoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <ellipse cx="12" cy="6" rx="9" ry="3" />
      <path d="M21 6v6c0 1.66-4.03 3-9 3s-9-1.34-9-3V6" />
      <path d="M21 12v6c0 1.66-4.03 3-9 3s-9-1.34-9-3v-6" />
    </svg>
  );
}
