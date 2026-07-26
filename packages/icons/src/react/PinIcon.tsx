import type { SVGProps } from "react";

export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14l-2-6V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6L5 17z" />
    </svg>
  );
}
