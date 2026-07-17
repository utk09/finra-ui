import { clsx } from "clsx";
import { forwardRef } from "react";

import {
  Popover as PopoverRoot,
  PopoverClose as PopoverCloseBase,
  PopoverContent as PopoverContentBase,
  type PopoverContentProps as PopoverContentBaseProps,
  type PopoverProps,
  PopoverTrigger as PopoverTriggerBase,
  type PopoverTriggerProps,
} from "../../unstyled/Popover/Popover";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Popover.module.scss";

export type { PopoverProps, PopoverTriggerProps };
export type PopoverContentProps = PopoverContentBaseProps;

/** Popover root - controlled/uncontrolled open state, placement, dismiss options. */
export const Popover = PopoverRoot;

/**
 * Toggles the popover and anchors it. Wrap your own control with `asChild`
 * (e.g. `<PopoverTrigger asChild><Button>Filters</Button></PopoverTrigger>`).
 */
export const PopoverTrigger = PopoverTriggerBase;

/** Styled popover panel (portalled, anchored, focus-trapped, dismiss-on-escape/outside). */
export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, ...rest }, ref) => (
    <PopoverContentBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.popover }}
      className={clsx(styles.panel, className)}
      {...rest}
    />
  ),
);

PopoverContent.displayName = "PopoverContent";

/**
 * Closes the popover. Unstyled by design - style it yourself or wrap your own
 * control with `asChild`.
 */
export const PopoverClose = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, ...rest }, ref) => <PopoverCloseBase ref={ref} className={className} {...rest} />,
);

PopoverClose.displayName = "PopoverClose";
