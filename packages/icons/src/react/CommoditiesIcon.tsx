import type { SVGProps } from "react";

export function CommoditiesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <polygon points="2 12 6 7 18 7 22 12 2 12" />
      <polygon points="2 12 22 12 18 20 6 20 2 12" />
    </svg>
  );
}
