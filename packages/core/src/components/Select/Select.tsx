import { ChevronDownIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef } from "react";

import {
  Select as SelectRoot,
  SelectContent as SelectContentBase,
  type SelectContentProps as SelectContentBaseProps,
  type SelectOptionData,
  type SelectProps,
  SelectTrigger as SelectTriggerBase,
  type SelectTriggerProps as SelectTriggerBaseProps,
  SelectValue as SelectValueBase,
} from "../../unstyled/Select/Select";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Select.module.scss";

export type { SelectOptionData, SelectProps };
export type SelectTriggerProps = SelectTriggerBaseProps;
export type SelectContentProps = SelectContentBaseProps;

/** Select root - controlled/uncontrolled value + open state, options, placement. */
export const Select = SelectRoot;

/** Styled trigger - shows the selected label (or placeholder) and a chevron. */
export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...rest }, ref) => (
    <SelectTriggerBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.selectTrigger }}
      className={clsx(styles.trigger, className)}
      {...rest}>
      <SelectValueBase className={styles.value} />
      <ChevronDownIcon className={styles.chevron} aria-hidden="true" />
      {children}
    </SelectTriggerBase>
  ),
);

SelectTrigger.displayName = "SelectTrigger";

/** Styled listbox panel (portalled, anchored, dismiss-on-escape/outside). */
export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, ...rest }, ref) => (
    <SelectContentBase
      ref={ref}
      {...{ [FINRA_UI_ATTR]: componentIds.select }}
      className={clsx(styles.listbox, className)}
      {...rest}
    />
  ),
);

SelectContent.displayName = "SelectContent";
