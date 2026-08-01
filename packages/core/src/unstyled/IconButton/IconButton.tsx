import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

import { Slot } from "../Slot";

/**
 * Props for the unstyled icon-only button.
 *
 * @remarks
 * `aria-label` is **required**, not optional. An icon-only control has no text
 * to name it, so without one it is announced as just "button" - which is why
 * the type enforces it rather than leaving it to review.
 */
export interface IconButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Render onto the single child element instead of a `<button>`.
   *
   * @defaultValue `false`
   */
  asChild?: boolean;
  /** The glyph. Rendered `aria-hidden`, so it never competes with `aria-label`. */
  icon: ReactNode;
  /** Required accessible name. Describe the action ("Close"), not the picture ("X"). */
  "aria-label": string;
}

export const IconButtonBase = forwardRef<HTMLButtonElement, IconButtonBaseProps>(
  ({ asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp ref={ref} {...props}>
        {icon}
        {children}
      </Comp>
    );
  },
);

IconButtonBase.displayName = "IconButtonBase";
