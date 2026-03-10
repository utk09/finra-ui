import type { SVGProps } from "react";

export function DashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}>
      <path d="M2.5 6h7" />
    </svg>
  );
}
