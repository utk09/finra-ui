import type { SVGProps } from "react";

export function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
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
