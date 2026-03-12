import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Divider.module.scss";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  className?: string;
}

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
