import type { SVGProps } from "react";

export function FunnelOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M12.5 12.5L22 3H2l7.5 8.86V19l4 2v-4.5" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
