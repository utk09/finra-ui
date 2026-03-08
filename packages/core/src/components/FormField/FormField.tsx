import {
  forwardRef,
  useId,
  Children,
  isValidElement,
  cloneElement,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { clsx } from "clsx";
import { FINRA_UI_ATTR, componentIds } from "../componentIds";
import type { ValidationStatus } from "../Input/Input";
import styles from "./FormField.module.scss";

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  helperText?: string;
  errorMessage?: string;
  validationStatus?: ValidationStatus;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  /** Explicit id for the input element. Auto-generated if omitted. */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      validationStatus,
      required,
      fullWidth,
      disabled,
      htmlFor,
      children,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const fieldId = htmlFor ?? autoId;
    const helperId = `${fieldId}-helper`;
    const errorId = `${fieldId}-error`;

    const showError = validationStatus === "error" && errorMessage;

    // Build aria-describedby from present elements
    const describedBy =
      [showError ? errorId : undefined, helperText ? helperId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    // Clone children to inject a11y props
    const enhancedChildren = Children.map(children, (child) => {
      if (!isValidElement(child)) return child;
      return cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        id: fieldId,
        "aria-describedby": describedBy,
        "aria-invalid": validationStatus === "error" ? true : undefined,
        disabled: disabled || undefined,
      });
    });

    return (
      <div
        ref={ref}
        {...{ [FINRA_UI_ATTR]: componentIds.formField }}
        className={clsx(
          styles.formField,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          className,
        )}
        {...props}>
        <label
          {...{ [FINRA_UI_ATTR]: componentIds.formFieldLabel }}
          htmlFor={fieldId}
          className={clsx(styles.label, required && styles.required)}>
          {label}
        </label>

        {enhancedChildren}

        {showError ? (
          <p
            {...{ [FINRA_UI_ATTR]: componentIds.formFieldError }}
            id={errorId}
            className={styles.errorMessage}
            role="alert">
            {errorMessage}
          </p>
        ) : null}

        {helperText ? (
          <p
            {...{ [FINRA_UI_ATTR]: componentIds.formFieldHelper }}
            id={helperId}
            className={styles.helperText}>
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

FormField.displayName = "FormField";
