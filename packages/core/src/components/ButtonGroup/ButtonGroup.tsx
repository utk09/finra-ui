import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes } from "react";

import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./ButtonGroup.module.scss";

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

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
