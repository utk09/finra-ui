import type { SVGProps } from "react";

export function CloseSmallIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <path d="M8 8l8 8M16 8l-8 8" />
    </svg>
  );
}
