import { clsx } from "clsx";
import { forwardRef } from "react";

import {
  Tooltip as TooltipRoot,
  TooltipContent as TooltipContentBase,
  type TooltipContentProps as TooltipContentBaseProps,
  type TooltipProps,
  TooltipTrigger as TooltipTriggerBase,
  type TooltipTriggerProps,
} from "../../unstyled/Tooltip/Tooltip";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Tooltip.module.scss";

export type { TooltipProps, TooltipTriggerProps };
export type TooltipContentProps = TooltipContentBaseProps;

/** Tooltip root - controlled/uncontrolled open state, hover/focus delays, placement. */
export const Tooltip = TooltipRoot;

/**
 * Element the tooltip describes. Wrap your own control with `asChild`
 * (e.g. `<TooltipTrigger asChild><IconButton /></TooltipTrigger>`).
 */
export const TooltipTrigger = TooltipTriggerBase;

/** Styled tooltip bubble (portalled, positioned, `role="tooltip"`). */
export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, ...rest }, ref) => (
    <TooltipContentBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.tooltip }}
      className={clsx(styles.tooltip, className)}
      {...rest}
    />
  ),
);

TooltipContent.displayName = "TooltipContent";
