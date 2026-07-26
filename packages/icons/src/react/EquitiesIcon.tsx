import type { SVGProps } from "react";

export function EquitiesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <line x1="3" y1="20" x2="21" y2="20" />
      <path d="M3 16l5-6 4 4 8-9" />
      <circle cx="8" cy="10" r="1.5" />
      <circle cx="12" cy="14" r="1.5" />
      <circle cx="20" cy="5" r="1.5" />
    </svg>
  );
}
