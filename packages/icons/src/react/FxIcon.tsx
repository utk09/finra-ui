import type { SVGProps } from "react";

export function FxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H8a4 4 0 0 0-4 4v1" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h12a4 4 0 0 0 4-4v-1" />
    </svg>
  );
}
