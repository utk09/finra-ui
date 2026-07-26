import type { SVGProps } from "react";

export function CryptoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12M8 9l8 6M8 15l8-6" />
    </svg>
  );
}
