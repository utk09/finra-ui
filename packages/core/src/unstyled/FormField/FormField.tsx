import {
  Children,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  useId,
} from "react";

export type ValidationStatus = "error" | "warning" | "success";

export interface FormFieldBaseProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  helperText?: string;
  errorMessage?: string;
  validationStatus?: ValidationStatus;
  required?: boolean;
  disabled?: boolean;
  /** Explicit id for the input element. Auto-generated if omitted. */
  htmlFor?: string;
  children: ReactNode;
}

export const FormFieldBase = forwardRef<HTMLDivElement, FormFieldBaseProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      validationStatus,
      required,
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

    const describedBy =
      [showError ? errorId : undefined, helperText ? helperId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

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
      <div ref={ref} {...props}>
        <label htmlFor={fieldId}>
          {label}
          {required ? " *" : null}
        </label>

        {enhancedChildren}

        {showError ? (
          <p id={errorId} role="alert">
            {errorMessage}
          </p>
        ) : null}

        {helperText ? <p id={helperId}>{helperText}</p> : null}
      </div>
    );
  },
);

FormFieldBase.displayName = "FormFieldBase";
