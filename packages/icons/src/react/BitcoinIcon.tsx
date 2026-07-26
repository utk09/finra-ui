import type { SVGProps } from "react";

export function BitcoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <line x1="10" y1="3" x2="10" y2="5" />
      <line x1="14" y1="3" x2="14" y2="5" />
      <line x1="10" y1="19" x2="10" y2="21" />
      <line x1="14" y1="19" x2="14" y2="21" />
      <path d="M7 6h6a3.5 3.5 0 0 1 0 7H7" />
      <path d="M7 13h7a3.5 3.5 0 0 1 0 7H7" />
      <line x1="10" y1="6" x2="10" y2="20" />
    </svg>
  );
}
