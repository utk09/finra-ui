import type { SVGProps } from "react";

export function StopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
