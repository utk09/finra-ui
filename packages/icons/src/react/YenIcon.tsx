import type { SVGProps } from "react";

/**
 * Yen icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function YenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M6 3l6 8 6-8" />
      <line x1="12" y1="11" x2="12" y2="21" />
      <line x1="7" y1="13" x2="17" y2="13" />
      <line x1="7" y1="17" x2="17" y2="17" />
    </svg>
  );
}
