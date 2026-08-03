import { clsx } from "clsx";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { FormFieldBase } from "../../unstyled/FormField/FormField";
import type { ValidationStatus } from "../Input/Input";
import styles from "./FormField.module.scss";

/**
 * Props for the styled FormField - label, helper text, error message and the
 * ARIA wiring that ties them to the control.
 *
 * @remarks
 * Two ways to reach the control, both automatic: direct element children get
 * the a11y props injected, and finra-ui controls at any depth read them from
 * context instead. So a control nested inside your own layout wrapper still
 * gets labelled correctly.
 *
 * @example
 * ```tsx
 * <FormField label="Quantity" helperText="Whole lots only" required>
 *   <NumberInput min={0} />
 * </FormField>
 * ```
 */
export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /** The visible label. Required - a field without one is not accessible. */
  label: string;
  /** Hint shown below the control. Reaches the control via `aria-describedby`. */
  helperText?: string;
  /**
   * Error text shown below the control.
   *
   * @remarks
   * Presence alone does not mark the field invalid - set `validationStatus` to
   * `"error"` for that. This lets you keep the message mounted while the field
   * is being corrected, rather than having it flash in and out.
   */
  errorMessage?: string;
  /** Validation state. `"error"` is what drives `aria-invalid` on the control. */
  validationStatus?: ValidationStatus;
  /** Marks the field required, adding `aria-required` to the control. */
  required?: boolean;
  /** Stretch the field to fill its container's inline size. */
  fullWidth?: boolean;
  /** Disables the field and everything it wraps. */
  disabled?: boolean;
  /** Explicit id for the input element. Auto-generated if omitted. */
  htmlFor?: string;
  /**
   * The control. Usually one element; non-element children (bare strings) are
   * passed through untouched rather than dropped.
   */
  children: ReactNode;
  /** Additional CSS class for the root wrapper. */
  className?: string;
}

/**
 * Label, helper text and error message, wired to the control it wraps.
 *
 * @see {@link FormFieldProps}
 */
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
  ) => (
    // Everything below the root is `FormFieldBase`: the id derivation, the
    // describedby computation, the child injection and the context provider all
    // live there. This layer supplies class names and the `fullWidth` axis.
    <FormFieldBase
      ref={ref}
      label={label}
      helperText={helperText}
      errorMessage={errorMessage}
      validationStatus={validationStatus}
      required={required}
      disabled={disabled}
      htmlFor={htmlFor}
      className={clsx(
        styles.formField,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        className,
      )}
      classNames={{
        label: styles.label,
        requiredMarker: styles.requiredMarker,
        error: styles.errorMessage,
        helper: styles.helperText,
      }}
      {...props}>
      {children}
    </FormFieldBase>
  ),
);

FormField.displayName = "FormField";
