import type { SVGProps } from "react";

export function SortAscIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M11 5h10M11 9h7M11 13h4" />
      <path d="M3 8l3-3 3 3M6 5v14" />
    </svg>
  );
}
