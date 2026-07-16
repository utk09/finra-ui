import { clsx } from "clsx";
import {
  Children,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  useId,
} from "react";

import { FormFieldContext } from "../../context/FormFieldContext";
import {
  computeDescribedBy,
  computeFieldIds,
  type FormFieldOwnA11y,
  type FormFieldState,
  mergeControlA11y,
} from "../../logic/formField";
import { componentIds, FINRA_UI_ATTR } from "../componentIds";
import type { ValidationStatus } from "../Input/Input";
import styles from "./FormField.module.scss";

/** Extract the a11y props that participate in the field merge from a child. */
function pickOwnA11y(props: Record<string, unknown>): FormFieldOwnA11y {
  return {
    id: props.id as string | undefined,
    "aria-describedby": props["aria-describedby"] as string | undefined,
    "aria-invalid": props["aria-invalid"] as boolean | undefined,
    disabled: props.disabled as boolean | undefined,
  };
}

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
    const { labelId, helperId, errorId } = computeFieldIds(fieldId);

    const showError = validationStatus === "error" && !!errorMessage;
    const describedBy = computeDescribedBy({
      showError,
      hasHelper: !!helperText,
      errorId,
      helperId,
    });

    const field: FormFieldState = {
      fieldId,
      labelId,
      helperId,
      errorId,
      describedBy,
      invalid: validationStatus === "error",
      required: !!required,
      disabled: !!disabled,
    };

    // Direct-child injection wires raw/native inputs with correct merge
    // semantics; finra-ui controls read the context provider below (any depth).
    const enhancedChildren = Children.map(children, (child) => {
      if (!isValidElement(child)) return child;
      const childProps = child.props as Record<string, unknown>;
      const injectable = mergeControlA11y(field, pickOwnA11y(childProps));
      // aria-required is role-restricted (invalid on a div-rooted composite) and
      // is NOT part of the injection contract composite children absorb. finra-ui
      // controls receive it via the FormField context instead.
      delete injectable["aria-required"];
      return cloneElement(
        child as React.ReactElement<Record<string, unknown>>,
        injectable as Record<string, unknown>,
      );
    });

    return (
      <FormFieldContext.Provider value={field}>
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
            id={labelId}
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
      </FormFieldContext.Provider>
    );
  },
);

FormField.displayName = "FormField";
