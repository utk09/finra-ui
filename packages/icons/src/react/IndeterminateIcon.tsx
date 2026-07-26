import type { SVGProps } from "react";

export function IndeterminateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}
