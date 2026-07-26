import type { SVGProps } from "react";

export function EuroIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
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
