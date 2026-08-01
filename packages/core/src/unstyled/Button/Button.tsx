import { type ButtonHTMLAttributes, forwardRef } from "react";

import { Slot } from "../Slot";

/**
 * Props for the unstyled button.
 *
 * @remarks
 * Ships no CSS and no variants - it is the bare element plus `asChild`. For
 * emphasis and sentiment, use the styled `Button`.
 */
export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Render onto the single child element instead of the default tag, merging
   * these props onto it.
   *
   * @remarks
   * `className` is concatenated, `style` merged, and handlers chained with the
   * child's called first. You become responsible for the child being genuinely
   * interactive and focusable.
   *
   * @defaultValue `false`
   */
  asChild?: boolean;
}

/**
 * Unstyled button - the bare element plus `asChild`.
 *
 * @see {@link ButtonBaseProps}
 */
export const ButtonBase = forwardRef<HTMLButtonElement, ButtonBaseProps>(
  ({ asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp ref={ref} {...props} />;
  },
);

ButtonBase.displayName = "ButtonBase";
