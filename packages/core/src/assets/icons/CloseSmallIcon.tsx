import type { SVGProps } from "react";

export function CloseSmallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      {...props}>
      <path d="M3 3l6 6M9 3l-6 6" />
    </svg>
  );
}
