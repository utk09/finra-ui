import { ChevronDownIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import {
  SelectContent as SelectContentBase,
  type SelectContentProps as SelectContentBaseProps,
  type SelectOptionData,
  type SelectProps,
  Select as SelectRoot,
  SelectTrigger as SelectTriggerBase,
  type SelectTriggerProps as SelectTriggerBaseProps,
  SelectValue as SelectValueBase,
} from "../../unstyled/Select/Select";
import styles from "./Select.module.scss";

export type { SelectOptionData, SelectProps };
/**
 * Props for the styled trigger.
 *
 * @remarks
 * Identical to the unstyled base's. The styled layer renders the value and a
 * chevron for you, so leave `children` unset unless you want to replace both.
 */
export type SelectTriggerProps = SelectTriggerBaseProps;
/**
 * Props for the styled listbox panel.
 *
 * @remarks
 * Identical to the unstyled base's - the styled layer adds only CSS, no new API.
 */
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
      <SelectValueBase
        {...{ [FINRA_UI_ATTR]: componentIds.selectValue }}
        className={styles.value}
      />
      <ChevronDownIcon
        {...{ [FINRA_UI_ATTR]: componentIds.selectIndicator }}
        className={styles.chevron}
        aria-hidden="true"
      />
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
