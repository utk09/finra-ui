import type { SVGProps } from "react";

/**
 * Euro icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function EuroIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M18 6a8 8 0 1 0 0 12" />
      <line x1="4" y1="10" x2="14" y2="10" />
      <line x1="4" y1="14" x2="14" y2="14" />
    </svg>
  );
}
