import type { SVGProps } from "react";

export function CloudOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0-2 11.29A5 5 0 0 0 9 20h9a4.91 4.91 0 0 0 2.22-.53" />
    </svg>
  );
}
