import type { SVGProps } from "react";

/**
 * Chevron left icon.
 *
 * @remarks
 * Strokes with `currentColor`, so it inherits the surrounding text colour.
 * Props are spread onto the `<svg>`, so pass `aria-hidden` for decoration or
 * `role="img"` with an `aria-label` when the icon is the only content.
 */
export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
