import type { SVGProps } from "react";

/**
 * Pin icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function PinIcon(props: SVGProps<SVGSVGElement>) {
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
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14l-2-6V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6L5 17z" />
    </svg>
  );
}
