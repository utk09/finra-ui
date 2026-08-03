import { type ButtonHTMLAttributes, forwardRef } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
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

    // Stamps its own id, so an unstyled button is reachable by the same
    // selector as a styled one. `props` follows, so a caller can still replace
    // it. Under `asChild` the id lands on the child, which is the button.
    return <Comp ref={ref} {...{ [FINRA_UI_ATTR]: componentIds.button }} {...props} />;
  },
);

ButtonBase.displayName = "ButtonBase";
