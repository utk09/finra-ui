import type { SVGProps } from "react";

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M2.5 6l2.5 2.5 4.5-5" />
    </svg>
  );
}
