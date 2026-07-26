import type { SVGProps } from "react";

export function DashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}
