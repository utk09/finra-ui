import {
  Children,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  useId,
} from "react";

import { componentIds, FINRA_UI_ATTR } from "../../componentIds";
import { FormFieldContext } from "../../context/FormFieldContext";
import {
  computeDescribedBy,
  computeFieldIds,
  type FormFieldOwnA11y,
  type FormFieldState,
  mergeControlA11y,
} from "../../logic/formField";
import type { ValidationStatus as _ValidationStatus } from "../../types/variants";

/**
 * Validation state, re-declared here so the unstyled entry point is
 * self-contained.
 *
 * @remarks
 * The same type as the styled layer's - only `"error"` changes ARIA, by setting
 * `aria-invalid` on the control.
 */
export type ValidationStatus = _ValidationStatus;

/** Extract the a11y props that participate in the field merge from a child. */
function pickOwnA11y(props: Record<string, unknown>): FormFieldOwnA11y {
  return {
    id: props.id as string | undefined,
    "aria-describedby": props["aria-describedby"] as string | undefined,
    "aria-invalid": props["aria-invalid"] as boolean | undefined,
    disabled: props.disabled as boolean | undefined,
  };
}

/**
 * CSS class overrides for the parts a FormField renders below its root.
 *
 * @remarks
 * The root takes `className` like any element. These name the inner parts,
 * which a caller cannot otherwise reach, and are how the styled `FormField`
 * dresses this component rather than reimplementing it.
 */
export interface FormFieldClassNames {
  /** The `<label>`. */
  label?: string;
  /** The marker appended to the label when `required`. */
  requiredMarker?: string;
  /** The error paragraph. Rendered only when `validationStatus` is `"error"`. */
  error?: string;
  /** The helper-text paragraph. */
  helper?: string;
}

/**
 * Props for the unstyled FormField - label, helper text, error message and the
 * ARIA wiring that ties them to the control.
 *
 * @remarks
 * Two ways to reach the control, both automatic: direct element children get
 * the a11y props injected, and finra-ui controls at any depth read them from
 * context instead. So a control nested inside your own layout wrapper still
 * gets labelled correctly.
 */
export interface FormFieldBaseProps extends HTMLAttributes<HTMLDivElement> {
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
  /** Disables the field and everything it wraps. */
  disabled?: boolean;
  /** Explicit id for the input element. Auto-generated if omitted. */
  htmlFor?: string;
  /** CSS class names for the inner parts. The root uses `className`. */
  classNames?: FormFieldClassNames;
  /**
   * The control. Usually one element; non-element children (bare strings) are
   * passed through untouched rather than dropped.
   */
  children: ReactNode;
}

/**
 * Unstyled form field. Publishes its a11y state through context and injects it
 * into direct element children.
 *
 * @see {@link FormFieldBaseProps}
 */
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
      classNames,
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

    // Direct-child injection wires raw/native inputs (`<FormField><input/></FormField>`)
    // with correct merge semantics. finra-ui controls read the context below instead,
    // which works at any nesting depth.
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
        {/* Each part stamps its own id, so an unstyled field is reachable by
            the same selectors as a styled one. `props` follows on the root, so
            a caller can still replace it. */}
        <div ref={ref} {...{ [FINRA_UI_ATTR]: componentIds.formField }} {...props}>
          <label
            {...{ [FINRA_UI_ATTR]: componentIds.formFieldLabel }}
            id={labelId}
            htmlFor={fieldId}
            className={classNames?.label}>
            {label}
            {/* A real text node, not generated content. `::after` is absent from
                `textContent`, and assistive tech that ignores generated content
                never announces it, so the marker would exist only for sighted
                users on Chromium. */}
            {required ? (
              <span
                {...{ [FINRA_UI_ATTR]: componentIds.formFieldRequiredMarker }}
                className={classNames?.requiredMarker}>
                {" *"}
              </span>
            ) : null}
          </label>

          {enhancedChildren}

          {showError ? (
            <p
              {...{ [FINRA_UI_ATTR]: componentIds.formFieldError }}
              id={errorId}
              role="alert"
              className={classNames?.error}>
              {errorMessage}
            </p>
          ) : null}

          {helperText ? (
            <p
              {...{ [FINRA_UI_ATTR]: componentIds.formFieldHelper }}
              id={helperId}
              className={classNames?.helper}>
              {helperText}
            </p>
          ) : null}
        </div>
      </FormFieldContext.Provider>
    );
  },
);

FormFieldBase.displayName = "FormFieldBase";
