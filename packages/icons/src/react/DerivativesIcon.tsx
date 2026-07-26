import type { SVGProps } from "react";

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
