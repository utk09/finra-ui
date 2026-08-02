import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import styles from "./ButtonGroup.module.scss";

/**
 * Props for ButtonGroup - a set of related buttons rendered as one unit, with
 * collapsed inner borders and rounded outer ends.
 *
 * @remarks
 * Carries `role="group"`, so give it an `aria-label` when the grouping is not
 * obvious from surrounding text. Purely presentational otherwise: it does not
 * manage selection or roving focus. For mutually exclusive choices, use
 * RadioButton; for tabbed views, use Tabs.
 */
export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Layout axis. Vertical stacks the buttons and moves the collapsed borders to
   * the block edges.
   *
   * @defaultValue `"horizontal"`
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * A set of related buttons rendered as one unit.
 *
 * @see {@link ButtonGroupProps}
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        {...{ [FINRA_UI_ATTR]: componentIds.buttonGroup }}
        className={clsx(
          styles.buttonGroup,
          orientation === "vertical" && styles.vertical,
          className,
        )}
        {...props}>
        {children}
      </div>
    );
  },
);

ButtonGroup.displayName = "ButtonGroup";
