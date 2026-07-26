import type { SVGProps } from "react";

export function PoundIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M18 6a4 4 0 0 0-6 0v11a2 2 0 0 0 2 2h5" />
      <line x1="8" y1="12" x2="15" y2="12" />
    </svg>
  );
}
