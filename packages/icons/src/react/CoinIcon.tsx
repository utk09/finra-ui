import type { SVGProps } from "react";

export function CoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <ellipse cx="12" cy="6" rx="9" ry="3" />
      <path d="M21 6v6c0 1.66-4.03 3-9 3s-9-1.34-9-3V6" />
      <path d="M21 12v6c0 1.66-4.03 3-9 3s-9-1.34-9-3v-6" />
    </svg>
  );
}
