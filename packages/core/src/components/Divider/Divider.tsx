import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Divider.module.scss";

/**
 * Props for the Divider - a rule separating content.
 *
 * @remarks
 * Renders an `<hr>`, which carries an implicit `separator` role. Decide with
 * `decorative` whether that role is announced: a divider that only adds visual
 * rhythm should be hidden from assistive tech, while one that genuinely marks a
 * boundary between groups should not.
 */
export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /**
   * Layout axis. Vertical needs a parent with a resolvable block size, since
   * the rule stretches to fill it.
   *
   * @defaultValue `"horizontal"`
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Purely visual - hides the divider from assistive tech with
   * `role="presentation"`.
   *
   * @remarks
   * Set this when the rule is decoration. Leave it off when the separation is
   * meaningful, so screen-reader users hear the boundary too.
   *
   * @defaultValue `false`
   */
  decorative?: boolean;
  /** Additional CSS class. */
  className?: string;
}

/**
 * A rule separating content, decorative or semantic.
 *
 * @see {@link DividerProps}
 */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = "horizontal", decorative = false, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.divider }}
        className={clsx(
          styles.divider,
          orientation === "vertical" ? styles.vertical : styles.horizontal,
          className,
        )}
        {...(decorative
          ? { "aria-hidden": true }
          : { role: "separator", "aria-orientation": orientation })}
        {...props}
      />
    );
  },
);

Divider.displayName = "Divider";
