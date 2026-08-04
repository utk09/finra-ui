import type { SVGProps } from "react";

/**
 * Key icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function KeyIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="7.5" cy="16.5" r="4.5" />
      <path d="M10.5 13.5L21 3" />
      <path d="M21 3l-3 3" />
      <path d="M15.5 8.5l2 2" />
    </svg>
  );
}
