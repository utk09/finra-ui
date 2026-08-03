import { CheckIcon, DashIcon } from "@utk09/finra-ui-icons/react";
import { clsx } from "clsx";
import { forwardRef, useEffect, useRef } from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { CheckboxBase, type CheckboxBaseProps } from "../../unstyled/Checkbox/Checkbox";
import { mergeRefs } from "../../utils/mergeRefs";
import styles from "./Checkbox.module.scss";

/**
 * Props for the styled Checkbox.
 *
 * @remarks
 * Supply either `label` or an `aria-label` - a checkbox with neither is
 * announced as unnamed. Set `indeterminate` for a parent controlling a partly
 * selected set; it is a visual and ARIA state only, and does not change
 * `checked`.
 *
 * @example
 * ```tsx
 * <Checkbox label="Include expired" indeterminate={someSelected} />
 * ```
 */
export interface CheckboxProps extends Omit<CheckboxBaseProps, "className"> {
  /** Visible label rendered beside the box, and wired as its accessible name. */
  label?: string;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

/**
 * A checkbox with an optional visible label and indeterminate state.
 *
 * @see {@link CheckboxProps}
 */
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
