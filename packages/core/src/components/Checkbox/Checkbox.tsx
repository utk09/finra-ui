import { forwardRef, useEffect, useRef, type Ref } from "react";
import { clsx } from "clsx";
import { CheckboxBase, type CheckboxBaseProps } from "../../unstyled/Checkbox/Checkbox";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
import styles from "./Checkbox.module.scss";

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (value: T | null) => void {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref && typeof ref === "object") {
        (ref as React.RefObject<T | null>).current = value;
      }
    }
  };
}

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
        <span className={styles.indicator} aria-hidden="true">
          {indeterminate ? (
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round">
              <path d="M2.5 6h7" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M2.5 6l2.5 2.5 4.5-5" />
            </svg>
          )}
        </span>
        {label ? <span className={styles.label}>{label}</span> : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
