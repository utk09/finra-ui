import { CheckIcon, DashIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef, useEffect, useRef } from "react";

import { CheckboxBase, type CheckboxBaseProps } from "../../unstyled/Checkbox/Checkbox";
import { mergeRefs } from "../../utils/mergeRefs";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import styles from "./Checkbox.module.scss";

export interface CheckboxProps extends Omit<CheckboxBaseProps, "className"> {
  label?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, indeterminate, disabled, ...props }, forwardedRef) => {
    const internalRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    return (
      <label
        {...{ [FINRA_UI_ATTR]: componentIds.checkbox }}
        className={clsx(styles.checkbox, disabled && styles.disabled, className)}>
        <CheckboxBase
          ref={mergeRefs(forwardedRef, internalRef)}
          className={styles.input}
          disabled={disabled}
          data-indeterminate={indeterminate || undefined}
          {...props}
        />
        <span
          className={styles.indicator}
          aria-hidden="true"
          {...{ [FINRA_UI_ATTR]: componentIds.checkboxIndicator }}>
          {indeterminate ? <DashIcon /> : <CheckIcon />}
        </span>
        {label ? (
          <span className={styles.label} {...{ [FINRA_UI_ATTR]: componentIds.checkboxLabel }}>
            {label}
          </span>
        ) : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
